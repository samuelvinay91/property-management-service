import { Repository, FindOptionsWhere, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Application, ApplicationStatus, ApplicationType } from '../entities/Application';
import { ApplicationReview } from '../entities/ApplicationReview';
import { Tenant } from '../entities/Tenant';
import { ScreeningService } from './ScreeningService';

export interface CreateApplicationData {
  tenantId: string;
  propertyId: string;
  unitId?: string;
  type?: ApplicationType;
  desiredMoveInDate?: Date;
  desiredMoveOutDate?: Date;
  desiredLeaseTerm?: number;
  proposedRent?: number;
  securityDepositAmount?: number;
  applicationFee?: number;
  numberOfApplicants?: number;
  totalOccupants?: number;
  coApplicants?: any[];
  additionalOccupants?: any[];
  vehicles?: any[];
  hasPets?: boolean;
  pets?: any[];
  petDeposit?: number;
  petRent?: number;
  specialRequests?: string;
  reasonForMoving?: string;
  additionalInformation?: string;
  metadata?: Record<string, any>;
}

export interface UpdateApplicationData extends Partial<CreateApplicationData> {
  status?: ApplicationStatus;
  approvalNotes?: string;
  rejectionReason?: string;
  conditions?: any[];
  reviewedBy?: string;
  assignedTo?: string;
  internalNotes?: string;
}

export interface ApplicationSearchFilters {
  status?: ApplicationStatus[];
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  minScore?: number;
  maxScore?: number;
  hasScreeningIssues?: boolean;
}

export interface ApplicationDecision {
  action: 'APPROVE' | 'REJECT' | 'CONDITIONAL_APPROVE';
  notes?: string;
  rejectionReason?: string;
  conditions?: Array<{
    type: string;
    description: string;
    required: boolean;
  }>;
  reviewedBy: string;
}

export class ApplicationService {
  private applicationRepository: Repository<Application>;
  private reviewRepository: Repository<ApplicationReview>;
  private tenantRepository: Repository<Tenant>;
  private screeningService: ScreeningService;

  constructor() {
    this.applicationRepository = AppDataSource.getRepository(Application);
    this.reviewRepository = AppDataSource.getRepository(ApplicationReview);
    this.tenantRepository = AppDataSource.getRepository(Tenant);
    this.screeningService = new ScreeningService();
  }

  async createApplication(data: CreateApplicationData): Promise<Application> {
    try {
      // Verify tenant exists
      const tenant = await this.tenantRepository.findOne({
        where: { id: data.tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check for existing applications for the same property/unit
      const existingApplication = await this.applicationRepository.findOne({
        where: {
          tenantId: data.tenantId,
          propertyId: data.propertyId,
          unitId: data.unitId,
          status: In([
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.PENDING_VERIFICATION,
            ApplicationStatus.APPROVED,
            ApplicationStatus.CONDITIONALLY_APPROVED
          ])
        }
      });

      if (existingApplication) {
        throw new Error('An active application already exists for this property/unit');
      }

      // Create application
      const application = this.applicationRepository.create({
        ...data,
        status: ApplicationStatus.DRAFT,
        numberOfApplicants: data.numberOfApplicants || 1,
        totalOccupants: data.totalOccupants || 1,
        desiredLeaseTerm: data.desiredLeaseTerm || 12,
        backgroundCheckRequested: false,
        creditCheckRequested: false,
        incomeVerificationRequested: false,
        referenceCheckRequested: false,
        backgroundCheckPassed: false,
        creditCheckPassed: false,
        incomeVerificationPassed: false,
        referenceCheckPassed: false,
        revisionCount: 0,
        remindersSent: 0,
        // Set expiration date to 30 days from creation
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const savedApplication = await this.applicationRepository.save(application);

      console.log(`Application created: ${savedApplication.id} for tenant: ${data.tenantId}`);

      return savedApplication;
    } catch (error) {
      console.error('Error creating application:', error);
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  async updateApplication(id: string, data: UpdateApplicationData): Promise<Application> {
    try {
      const application = await this.getApplicationById(id);
      if (!application) {
        throw new Error('Application not found');
      }

      // Prevent updates to finalized applications
      if ([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN].includes(application.status)) {
        throw new Error('Cannot update finalized application');
      }

      Object.assign(application, data);

      // Update revision count if substantial changes
      if (data.proposedRent || data.desiredMoveInDate || data.totalOccupants) {
        application.revisionCount += 1;
      }

      application.updatedAt = new Date();

      const updatedApplication = await this.applicationRepository.save(application);

      console.log(`Application updated: ${updatedApplication.id}`);

      return updatedApplication;
    } catch (error) {
      console.error('Error updating application:', error);
      throw new Error(`Failed to update application: ${error.message}`);
    }
  }

  async submitApplication(id: string): Promise<Application> {
    try {
      const application = await this.getApplicationById(id);
      if (!application) {
        throw new Error('Application not found');
      }

      if (application.status !== ApplicationStatus.DRAFT) {
        throw new Error('Only draft applications can be submitted');
      }

      // Validate required fields
      this.validateApplicationForSubmission(application);

      application.status = ApplicationStatus.SUBMITTED;
      application.submittedAt = new Date();

      const submittedApplication = await this.applicationRepository.save(application);

      // Auto-assign for review if applicable
      await this.autoAssignForReview(submittedApplication);

      console.log(`Application submitted: ${submittedApplication.id}`);

      return submittedApplication;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw new Error(`Failed to submit application: ${error.message}`);
    }
  }

  async startReview(id: string, reviewerId?: string): Promise<Application> {
    try {
      const application = await this.getApplicationById(id);
      if (!application) {
        throw new Error('Application not found');
      }

      if (application.status !== ApplicationStatus.SUBMITTED) {
        throw new Error('Only submitted applications can be reviewed');
      }

      application.status = ApplicationStatus.UNDER_REVIEW;
      application.reviewStartedAt = new Date();
      
      if (reviewerId) {
        application.assignedTo = reviewerId;
      }

      const updatedApplication = await this.applicationRepository.save(application);

      // Start screening processes
      await this.initiateScreeningProcesses(updatedApplication);

      console.log(`Application review started: ${updatedApplication.id}`);

      return updatedApplication;
    } catch (error) {
      console.error('Error starting application review:', error);
      throw new Error(`Failed to start application review: ${error.message}`);
    }
  }

  async makeDecision(id: string, decision: ApplicationDecision): Promise<Application> {
    try {
      const application = await this.getApplicationById(id);
      if (!application) {
        throw new Error('Application not found');
      }

      if (![ApplicationStatus.UNDER_REVIEW, ApplicationStatus.PENDING_VERIFICATION].includes(application.status)) {
        throw new Error('Application is not ready for decision');
      }

      // Create review record
      const review = this.reviewRepository.create({
        applicationId: application.id,
        reviewerId: decision.reviewedBy,
        decision: decision.action,
        notes: decision.notes,
        rejectionReason: decision.rejectionReason,
        conditions: decision.conditions,
        reviewDate: new Date()
      });

      await this.reviewRepository.save(review);

      // Update application based on decision
      application.decisionMadeAt = new Date();
      application.reviewedBy = decision.reviewedBy;

      switch (decision.action) {
        case 'APPROVE':
          application.status = ApplicationStatus.APPROVED;
          application.approvedAt = new Date();
          application.approvalNotes = decision.notes;
          break;

        case 'REJECT':
          application.status = ApplicationStatus.REJECTED;
          application.rejectedAt = new Date();
          application.rejectionReason = decision.rejectionReason;
          break;

        case 'CONDITIONAL_APPROVE':
          application.status = ApplicationStatus.CONDITIONALLY_APPROVED;
          application.approvedAt = new Date();
          application.approvalNotes = decision.notes;
          application.conditions = decision.conditions;
          break;
      }

      const updatedApplication = await this.applicationRepository.save(application);

      console.log(`Application decision made: ${updatedApplication.id} - ${decision.action}`);

      return updatedApplication;
    } catch (error) {
      console.error('Error making application decision:', error);
      throw new Error(`Failed to make application decision: ${error.message}`);
    }
  }

  async withdrawApplication(id: string, reason?: string): Promise<Application> {
    try {
      const application = await this.getApplicationById(id);
      if (!application) {
        throw new Error('Application not found');
      }

      if ([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED].includes(application.status)) {
        throw new Error('Cannot withdraw finalized application');
      }

      application.status = ApplicationStatus.WITHDRAWN;
      application.withdrawnAt = new Date();
      
      if (reason) {
        application.metadata = {
          ...application.metadata,
          withdrawalReason: reason
        };
      }

      const updatedApplication = await this.applicationRepository.save(application);

      console.log(`Application withdrawn: ${updatedApplication.id}`);

      return updatedApplication;
    } catch (error) {
      console.error('Error withdrawing application:', error);
      throw new Error(`Failed to withdraw application: ${error.message}`);
    }
  }

  async getApplicationById(id: string): Promise<Application | null> {
    try {
      return await this.applicationRepository.findOne({
        where: { id },
        relations: ['tenant', 'reviews']
      });
    } catch (error) {
      console.error('Error fetching application by ID:', error);
      return null;
    }
  }

  async searchApplications(filters: ApplicationSearchFilters, limit = 50, offset = 0): Promise<Application[]> {
    try {
      const queryBuilder = this.applicationRepository.createQueryBuilder('application')
        .leftJoinAndSelect('application.tenant', 'tenant')
        .leftJoinAndSelect('application.reviews', 'reviews');

      // Status filter
      if (filters.status && filters.status.length > 0) {
        queryBuilder.andWhere('application.status IN (:...statuses)', { statuses: filters.status });
      }

      // Property filter
      if (filters.propertyId) {
        queryBuilder.andWhere('application.propertyId = :propertyId', { propertyId: filters.propertyId });
      }

      // Unit filter
      if (filters.unitId) {
        queryBuilder.andWhere('application.unitId = :unitId', { unitId: filters.unitId });
      }

      // Tenant filter
      if (filters.tenantId) {
        queryBuilder.andWhere('application.tenantId = :tenantId', { tenantId: filters.tenantId });
      }

      // Assigned to filter
      if (filters.assignedTo) {
        queryBuilder.andWhere('application.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
      }

      // Date range filter
      if (filters.dateRange) {
        queryBuilder.andWhere('application.submittedAt BETWEEN :start AND :end', {
          start: filters.dateRange.start,
          end: filters.dateRange.end
        });
      }

      // Score filters
      if (filters.minScore !== undefined) {
        queryBuilder.andWhere('application.overallScore >= :minScore', { minScore: filters.minScore });
      }

      if (filters.maxScore !== undefined) {
        queryBuilder.andWhere('application.overallScore <= :maxScore', { maxScore: filters.maxScore });
      }

      // Screening issues filter
      if (filters.hasScreeningIssues) {
        queryBuilder.andWhere('(application.backgroundCheckPassed = false OR application.creditCheckPassed = false OR application.incomeVerificationPassed = false OR application.referenceCheckPassed = false)');
      }

      return await queryBuilder
        .orderBy('application.submittedAt', 'DESC')
        .take(limit)
        .skip(offset)
        .getMany();
    } catch (error) {
      console.error('Error searching applications:', error);
      return [];
    }
  }

  async getApplicationsByProperty(propertyId: string, limit = 50, offset = 0): Promise<Application[]> {
    try {
      return await this.applicationRepository.find({
        where: { propertyId },
        relations: ['tenant', 'reviews'],
        order: { submittedAt: 'DESC' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      console.error('Error fetching applications by property:', error);
      return [];
    }
  }

  async getApplicationsByTenant(tenantId: string): Promise<Application[]> {
    try {
      return await this.applicationRepository.find({
        where: { tenantId },
        relations: ['reviews'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error('Error fetching applications by tenant:', error);
      return [];
    }
  }

  async updateScreeningResult(applicationId: string, screeningType: 'background' | 'credit' | 'income' | 'reference', passed: boolean, details?: any): Promise<Application> {
    try {
      const application = await this.getApplicationById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Update screening result
      switch (screeningType) {
        case 'background':
          application.backgroundCheckPassed = passed;
          application.backgroundCheckRequested = true;
          break;
        case 'credit':
          application.creditCheckPassed = passed;
          application.creditCheckRequested = true;
          if (details?.creditScore) {
            application.creditScore = details.creditScore;
          }
          break;
        case 'income':
          application.incomeVerificationPassed = passed;
          application.incomeVerificationRequested = true;
          if (details?.incomeToRentRatio) {
            application.incomeToRentRatio = details.incomeToRentRatio;
          }
          if (details?.debtToIncomeRatio) {
            application.debtToIncomeRatio = details.debtToIncomeRatio;
          }
          break;
        case 'reference':
          application.referenceCheckPassed = passed;
          application.referenceCheckRequested = true;
          break;
      }

      // Update screening data
      application.screeningData = {
        ...application.screeningData,
        [screeningType]: {
          passed,
          completedAt: new Date().toISOString(),
          details
        }
      };

      // Calculate overall score
      application.overallScore = this.calculateOverallScore(application);

      // Update status if all screening is complete
      if (this.isScreeningComplete(application)) {
        application.status = ApplicationStatus.PENDING_VERIFICATION;
      }

      const updatedApplication = await this.applicationRepository.save(application);

      console.log(`Screening result updated: ${applicationId} - ${screeningType}: ${passed}`);

      return updatedApplication;
    } catch (error) {
      console.error('Error updating screening result:', error);
      throw new Error(`Failed to update screening result: ${error.message}`);
    }
  }

  async expireOldApplications(): Promise<number> {
    try {
      const expiredApplications = await this.applicationRepository
        .createQueryBuilder('application')
        .where('application.expiresAt < :now', { now: new Date() })
        .andWhere('application.status IN (:...statuses)', {
          statuses: [ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED]
        })
        .getMany();

      for (const application of expiredApplications) {
        application.status = ApplicationStatus.EXPIRED;
        await this.applicationRepository.save(application);
      }

      console.log(`Expired ${expiredApplications.length} applications`);

      return expiredApplications.length;
    } catch (error) {
      console.error('Error expiring applications:', error);
      return 0;
    }
  }

  async getApplicationStats(): Promise<{
    total: number;
    byStatus: Record<ApplicationStatus, number>;
    averageProcessingTime: number;
    approvalRate: number;
  }> {
    try {
      const [total, applications] = await Promise.all([
        this.applicationRepository.count(),
        this.applicationRepository.find()
      ]);

      const byStatus = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<ApplicationStatus, number>);

      const processedApplications = applications.filter(app => 
        app.decisionMadeAt && app.submittedAt
      );

      const totalProcessingTime = processedApplications.reduce((sum, app) => {
        return sum + (app.decisionMadeAt!.getTime() - app.submittedAt!.getTime());
      }, 0);

      const averageProcessingTime = processedApplications.length > 0 
        ? Math.round(totalProcessingTime / processedApplications.length / (1000 * 60 * 60 * 24)) // Days
        : 0;

      const approvedApplications = applications.filter(app => 
        app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.CONDITIONALLY_APPROVED
      ).length;

      const finalizedApplications = applications.filter(app =>
        [ApplicationStatus.APPROVED, ApplicationStatus.CONDITIONALLY_APPROVED, ApplicationStatus.REJECTED].includes(app.status)
      ).length;

      const approvalRate = finalizedApplications > 0 
        ? Math.round((approvedApplications / finalizedApplications) * 100)
        : 0;

      return {
        total,
        byStatus,
        averageProcessingTime,
        approvalRate
      };
    } catch (error) {
      console.error('Error fetching application stats:', error);
      return {
        total: 0,
        byStatus: {} as Record<ApplicationStatus, number>,
        averageProcessingTime: 0,
        approvalRate: 0
      };
    }
  }

  private validateApplicationForSubmission(application: Application): void {
    const errors: string[] = [];

    if (!application.tenantId) errors.push('Tenant ID is required');
    if (!application.propertyId) errors.push('Property ID is required');
    if (!application.desiredMoveInDate) errors.push('Desired move-in date is required');
    if (!application.proposedRent || application.proposedRent <= 0) errors.push('Valid proposed rent is required');
    if (application.totalOccupants < 1) errors.push('At least one occupant is required');

    if (errors.length > 0) {
      throw new Error(`Application validation failed: ${errors.join(', ')}`);
    }
  }

  private async autoAssignForReview(application: Application): Promise<void> {
    // In a real implementation, this would assign to available reviewers
    // For now, we'll just move it to under review status
    try {
      application.status = ApplicationStatus.UNDER_REVIEW;
      application.reviewStartedAt = new Date();
      await this.applicationRepository.save(application);
    } catch (error) {
      console.error('Error auto-assigning application:', error);
    }
  }

  private async initiateScreeningProcesses(application: Application): Promise<void> {
    try {
      // Start background check
      if (!application.backgroundCheckRequested) {
        await this.screeningService.initiateBackgroundCheck(application.tenantId);
        application.backgroundCheckRequested = true;
      }

      // Start credit check
      if (!application.creditCheckRequested) {
        await this.screeningService.initiateCreditCheck(application.tenantId);
        application.creditCheckRequested = true;
      }

      // Start income verification
      if (!application.incomeVerificationRequested) {
        await this.screeningService.initiateIncomeVerification(application.tenantId);
        application.incomeVerificationRequested = true;
      }

      // Start reference check
      if (!application.referenceCheckRequested) {
        await this.screeningService.initiateReferenceCheck(application.tenantId);
        application.referenceCheckRequested = true;
      }

      await this.applicationRepository.save(application);
    } catch (error) {
      console.error('Error initiating screening processes:', error);
    }
  }

  private calculateOverallScore(application: Application): number {
    let score = 0;
    let factors = 0;

    // Background check (25 points)
    if (application.backgroundCheckRequested) {
      score += application.backgroundCheckPassed ? 25 : 0;
      factors += 25;
    }

    // Credit check (25 points)
    if (application.creditCheckRequested) {
      if (application.creditCheckPassed) {
        if (application.creditScore) {
          if (application.creditScore >= 750) score += 25;
          else if (application.creditScore >= 650) score += 20;
          else if (application.creditScore >= 600) score += 15;
          else score += 10;
        } else {
          score += 20;
        }
      }
      factors += 25;
    }

    // Income verification (25 points)
    if (application.incomeVerificationRequested) {
      if (application.incomeVerificationPassed) {
        if (application.incomeToRentRatio) {
          if (application.incomeToRentRatio <= 30) score += 25;
          else if (application.incomeToRentRatio <= 40) score += 20;
          else if (application.incomeToRentRatio <= 50) score += 15;
          else score += 10;
        } else {
          score += 20;
        }
      }
      factors += 25;
    }

    // Reference check (25 points)
    if (application.referenceCheckRequested) {
      score += application.referenceCheckPassed ? 25 : 0;
      factors += 25;
    }

    return factors > 0 ? Math.round((score / factors) * 100) : 0;
  }

  private isScreeningComplete(application: Application): boolean {
    return application.backgroundCheckRequested &&
           application.creditCheckRequested &&
           application.incomeVerificationRequested &&
           application.referenceCheckRequested;
  }
}
import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Tenant } from '../entities/Tenant';
import { Application } from '../entities/Application';

export interface BackgroundCheckResult {
  passed: boolean;
  hasConvictions: boolean;
  hasEvictions: boolean;
  convictionDetails?: string;
  evictionDetails?: string;
  reportUrl?: string;
  reportDate: Date;
  provider: string;
  referenceId: string;
}

export interface CreditCheckResult {
  passed: boolean;
  creditScore: number;
  creditReportUrl?: string;
  reportDate: Date;
  provider: string;
  referenceId: string;
  creditHistory?: {
    accountsInGoodStanding: number;
    accountsInDefault: number;
    totalDebt: number;
    creditUtilization: number;
    paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface IncomeVerificationResult {
  passed: boolean;
  verifiedIncome: number;
  incomeToRentRatio: number;
  debtToIncomeRatio?: number;
  employmentVerified: boolean;
  verificationMethod: 'payStubs' | 'bankStatements' | 'employerVerification' | 'taxReturns' | 'other';
  verificationDate: Date;
  provider: string;
  referenceId: string;
}

export interface ReferenceCheckResult {
  passed: boolean;
  landlordReferences: Array<{
    landlordName: string;
    contactPhone: string;
    relationship: string;
    duration: number; // months
    rentPaidOnTime: boolean;
    propertyCondition: 'excellent' | 'good' | 'fair' | 'poor';
    wouldRentAgain: boolean;
    reasonForLeaving: string;
    notes?: string;
  }>;
  employmentReferences: Array<{
    employerName: string;
    contactPerson: string;
    contactPhone: string;
    jobTitle: string;
    employmentDuration: number; // months
    currentlyEmployed: boolean;
    income: number;
    notes?: string;
  }>;
  personalReferences: Array<{
    name: string;
    relationship: string;
    contactPhone: string;
    knownDuration: number; // years
    characterAssessment: 'excellent' | 'good' | 'fair' | 'poor';
    notes?: string;
  }>;
  verificationDate: Date;
  provider: string;
  referenceId: string;
}

export interface ScreeningConfiguration {
  backgroundCheck: {
    enabled: boolean;
    provider: 'internal' | 'experian' | 'transunion' | 'rentspree' | 'smartmove';
    requireConvictionCheck: boolean;
    requireEvictionCheck: boolean;
    requireSexOffenderCheck: boolean;
    lookbackYears: number;
  };
  creditCheck: {
    enabled: boolean;
    provider: 'internal' | 'experian' | 'transunion' | 'equifax';
    minimumScore: number;
    requireFullReport: boolean;
  };
  incomeVerification: {
    enabled: boolean;
    provider: 'internal' | 'theWorkNumber' | 'plaid' | 'manual';
    minimumIncomeMultiplier: number; // e.g., 3x rent
    acceptableVerificationMethods: string[];
  };
  referenceCheck: {
    enabled: boolean;
    provider: 'internal' | 'rentspree' | 'manual';
    requireLandlordReferences: number;
    requireEmploymentReferences: number;
    requirePersonalReferences: number;
  };
}

export class ScreeningService {
  private tenantRepository: Repository<Tenant>;
  private applicationRepository: Repository<Application>;
  private screeningConfig: ScreeningConfiguration;

  constructor() {
    this.tenantRepository = AppDataSource.getRepository(Tenant);
    this.applicationRepository = AppDataSource.getRepository(Application);
    this.screeningConfig = this.getDefaultScreeningConfig();
  }

  async initiateBackgroundCheck(tenantId: string): Promise<string> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      console.log(`Initiating background check for tenant: ${tenantId}`);

      // In a real implementation, this would call external APIs
      const referenceId = `bg_${Date.now()}_${tenantId.substring(0, 8)}`;

      // Simulate API call delay
      await this.delay(1000);

      // For now, simulate a successful background check
      const mockResult: BackgroundCheckResult = {
        passed: true,
        hasConvictions: false,
        hasEvictions: false,
        reportDate: new Date(),
        provider: this.screeningConfig.backgroundCheck.provider,
        referenceId
      };

      // In production, this would be called when the external service completes
      setTimeout(async () => {
        await this.processBackgroundCheckResult(tenantId, mockResult);
      }, 5000); // Simulate 5-second processing time

      console.log(`Background check initiated: ${referenceId}`);
      return referenceId;
    } catch (error) {
      console.error('Error initiating background check:', error);
      throw new Error(`Failed to initiate background check: ${error.message}`);
    }
  }

  async initiateCreditCheck(tenantId: string): Promise<string> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      console.log(`Initiating credit check for tenant: ${tenantId}`);

      const referenceId = `cc_${Date.now()}_${tenantId.substring(0, 8)}`;

      // Simulate API call delay
      await this.delay(1000);

      // Simulate credit check result
      const mockCreditScore = this.generateMockCreditScore();
      const mockResult: CreditCheckResult = {
        passed: mockCreditScore >= this.screeningConfig.creditCheck.minimumScore,
        creditScore: mockCreditScore,
        reportDate: new Date(),
        provider: this.screeningConfig.creditCheck.provider,
        referenceId,
        creditHistory: {
          accountsInGoodStanding: Math.floor(Math.random() * 10) + 1,
          accountsInDefault: Math.floor(Math.random() * 3),
          totalDebt: Math.floor(Math.random() * 50000) + 10000,
          creditUtilization: Math.floor(Math.random() * 60) + 10,
          paymentHistory: mockCreditScore >= 700 ? 'excellent' : mockCreditScore >= 600 ? 'good' : 'fair'
        }
      };

      // Simulate processing delay
      setTimeout(async () => {
        await this.processCreditCheckResult(tenantId, mockResult);
      }, 3000);

      console.log(`Credit check initiated: ${referenceId}`);
      return referenceId;
    } catch (error) {
      console.error('Error initiating credit check:', error);
      throw new Error(`Failed to initiate credit check: ${error.message}`);
    }
  }

  async initiateIncomeVerification(tenantId: string): Promise<string> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      console.log(`Initiating income verification for tenant: ${tenantId}`);

      const referenceId = `iv_${Date.now()}_${tenantId.substring(0, 8)}`;

      await this.delay(1000);

      // Calculate income to rent ratio if we have both values
      const monthlyIncome = tenant.totalMonthlyIncome || tenant.monthlyIncome || 0;
      const estimatedRent = 2000; // In real app, this would come from application
      const incomeToRentRatio = estimatedRent > 0 ? (estimatedRent / monthlyIncome) * 100 : 0;

      const mockResult: IncomeVerificationResult = {
        passed: incomeToRentRatio <= (this.screeningConfig.incomeVerification.minimumIncomeMultiplier * 100 / 3),
        verifiedIncome: monthlyIncome,
        incomeToRentRatio: Math.round(incomeToRentRatio * 100) / 100,
        debtToIncomeRatio: tenant.debtToIncomeRatio || Math.floor(Math.random() * 40) + 10,
        employmentVerified: !!tenant.employerName,
        verificationMethod: 'payStubs',
        verificationDate: new Date(),
        provider: this.screeningConfig.incomeVerification.provider,
        referenceId
      };

      setTimeout(async () => {
        await this.processIncomeVerificationResult(tenantId, mockResult);
      }, 4000);

      console.log(`Income verification initiated: ${referenceId}`);
      return referenceId;
    } catch (error) {
      console.error('Error initiating income verification:', error);
      throw new Error(`Failed to initiate income verification: ${error.message}`);
    }
  }

  async initiateReferenceCheck(tenantId: string): Promise<string> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      console.log(`Initiating reference check for tenant: ${tenantId}`);

      const referenceId = `rc_${Date.now()}_${tenantId.substring(0, 8)}`;

      await this.delay(1000);

      const mockResult: ReferenceCheckResult = {
        passed: true,
        landlordReferences: tenant.currentLandlordName ? [{
          landlordName: tenant.currentLandlordName,
          contactPhone: tenant.currentLandlordPhone || '',
          relationship: 'Current Landlord',
          duration: 12,
          rentPaidOnTime: true,
          propertyCondition: 'good',
          wouldRentAgain: true,
          reasonForLeaving: tenant.reasonForMoving || 'Seeking larger space'
        }] : [],
        employmentReferences: tenant.employerName ? [{
          employerName: tenant.employerName,
          contactPerson: tenant.supervisorName || 'HR Department',
          contactPhone: tenant.employerPhone || '',
          jobTitle: tenant.jobTitle || '',
          employmentDuration: 24,
          currentlyEmployed: true,
          income: tenant.monthlyIncome || 0,
          notes: 'Good employee'
        }] : [],
        personalReferences: tenant.personalReferenceName ? [{
          name: tenant.personalReferenceName,
          relationship: tenant.personalReferenceRelationship || 'Friend',
          contactPhone: tenant.personalReferencePhone || '',
          knownDuration: 5,
          characterAssessment: 'excellent',
          notes: 'Reliable and trustworthy'
        }] : [],
        verificationDate: new Date(),
        provider: this.screeningConfig.referenceCheck.provider,
        referenceId
      };

      setTimeout(async () => {
        await this.processReferenceCheckResult(tenantId, mockResult);
      }, 6000);

      console.log(`Reference check initiated: ${referenceId}`);
      return referenceId;
    } catch (error) {
      console.error('Error initiating reference check:', error);
      throw new Error(`Failed to initiate reference check: ${error.message}`);
    }
  }

  async processBackgroundCheckResult(tenantId: string, result: BackgroundCheckResult): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Update tenant with background check results
      tenant.backgroundCheckCompleted = true;
      tenant.backgroundCheckCompletedAt = new Date();
      tenant.hasConvictions = result.hasConvictions;
      tenant.convictionDetails = result.convictionDetails;
      tenant.hasEvictions = result.hasEvictions;
      tenant.evictionDetails = result.evictionDetails;

      await this.tenantRepository.save(tenant);

      // Update related applications
      await this.updateApplicationScreeningResults(tenantId, 'background', result.passed, {
        hasConvictions: result.hasConvictions,
        hasEvictions: result.hasEvictions,
        provider: result.provider,
        referenceId: result.referenceId
      });

      console.log(`Background check completed for tenant: ${tenantId} - Passed: ${result.passed}`);
    } catch (error) {
      console.error('Error processing background check result:', error);
    }
  }

  async processCreditCheckResult(tenantId: string, result: CreditCheckResult): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Update tenant with credit check results
      tenant.creditCheckCompleted = true;
      tenant.creditCheckCompletedAt = new Date();
      tenant.creditScore = result.creditScore;
      tenant.creditReportDate = result.reportDate;
      tenant.creditReportUrl = result.creditReportUrl;

      await this.tenantRepository.save(tenant);

      // Update related applications
      await this.updateApplicationScreeningResults(tenantId, 'credit', result.passed, {
        creditScore: result.creditScore,
        creditHistory: result.creditHistory,
        provider: result.provider,
        referenceId: result.referenceId
      });

      console.log(`Credit check completed for tenant: ${tenantId} - Score: ${result.creditScore}, Passed: ${result.passed}`);
    } catch (error) {
      console.error('Error processing credit check result:', error);
    }
  }

  async processIncomeVerificationResult(tenantId: string, result: IncomeVerificationResult): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Update tenant with income verification results
      tenant.incomeVerified = result.passed;
      tenant.incomeVerifiedAt = new Date();
      tenant.totalMonthlyIncome = result.verifiedIncome;

      await this.tenantRepository.save(tenant);

      // Update related applications
      await this.updateApplicationScreeningResults(tenantId, 'income', result.passed, {
        verifiedIncome: result.verifiedIncome,
        incomeToRentRatio: result.incomeToRentRatio,
        debtToIncomeRatio: result.debtToIncomeRatio,
        employmentVerified: result.employmentVerified,
        verificationMethod: result.verificationMethod,
        provider: result.provider,
        referenceId: result.referenceId
      });

      console.log(`Income verification completed for tenant: ${tenantId} - Income: $${result.verifiedIncome}, Passed: ${result.passed}`);
    } catch (error) {
      console.error('Error processing income verification result:', error);
    }
  }

  async processReferenceCheckResult(tenantId: string, result: ReferenceCheckResult): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Update tenant with reference check results
      tenant.referencesVerified = result.passed;
      tenant.referencesVerifiedAt = new Date();

      await this.tenantRepository.save(tenant);

      // Update related applications
      await this.updateApplicationScreeningResults(tenantId, 'reference', result.passed, {
        landlordReferences: result.landlordReferences,
        employmentReferences: result.employmentReferences,
        personalReferences: result.personalReferences,
        provider: result.provider,
        referenceId: result.referenceId
      });

      console.log(`Reference check completed for tenant: ${tenantId} - Passed: ${result.passed}`);
    } catch (error) {
      console.error('Error processing reference check result:', error);
    }
  }

  async getScreeningStatus(tenantId: string): Promise<{
    backgroundCheck: { completed: boolean; passed?: boolean; completedAt?: Date };
    creditCheck: { completed: boolean; passed?: boolean; score?: number; completedAt?: Date };
    incomeVerification: { completed: boolean; passed?: boolean; completedAt?: Date };
    referenceCheck: { completed: boolean; passed?: boolean; completedAt?: Date };
    overallProgress: number;
  }> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const checks = [
        tenant.backgroundCheckCompleted,
        tenant.creditCheckCompleted,
        tenant.incomeVerified,
        tenant.referencesVerified
      ];

      const completedChecks = checks.filter(check => check).length;
      const overallProgress = (completedChecks / checks.length) * 100;

      return {
        backgroundCheck: {
          completed: tenant.backgroundCheckCompleted,
          passed: tenant.backgroundCheckCompleted ? !tenant.hasConvictions && !tenant.hasEvictions : undefined,
          completedAt: tenant.backgroundCheckCompletedAt
        },
        creditCheck: {
          completed: tenant.creditCheckCompleted,
          passed: tenant.creditCheckCompleted ? (tenant.creditScore || 0) >= this.screeningConfig.creditCheck.minimumScore : undefined,
          score: tenant.creditScore,
          completedAt: tenant.creditCheckCompletedAt
        },
        incomeVerification: {
          completed: tenant.incomeVerified,
          passed: tenant.incomeVerified,
          completedAt: tenant.incomeVerifiedAt
        },
        referenceCheck: {
          completed: tenant.referencesVerified,
          passed: tenant.referencesVerified,
          completedAt: tenant.referencesVerifiedAt
        },
        overallProgress: Math.round(overallProgress)
      };
    } catch (error) {
      console.error('Error getting screening status:', error);
      throw new Error(`Failed to get screening status: ${error.message}`);
    }
  }

  private async updateApplicationScreeningResults(
    tenantId: string,
    screeningType: 'background' | 'credit' | 'income' | 'reference',
    passed: boolean,
    details: any
  ): Promise<void> {
    try {
      // Find active applications for this tenant
      const applications = await this.applicationRepository.find({
        where: {
          tenantId,
          status: In(['UNDER_REVIEW', 'PENDING_VERIFICATION'])
        }
      });

      // Update each application
      for (const application of applications) {
        switch (screeningType) {
          case 'background':
            application.backgroundCheckPassed = passed;
            application.backgroundCheckRequested = true;
            break;
          case 'credit':
            application.creditCheckPassed = passed;
            application.creditCheckRequested = true;
            if (details.creditScore) {
              application.creditScore = details.creditScore;
            }
            break;
          case 'income':
            application.incomeVerificationPassed = passed;
            application.incomeVerificationRequested = true;
            if (details.incomeToRentRatio) {
              application.incomeToRentRatio = details.incomeToRentRatio;
            }
            if (details.debtToIncomeRatio) {
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

        await this.applicationRepository.save(application);
      }
    } catch (error) {
      console.error('Error updating application screening results:', error);
    }
  }

  private getDefaultScreeningConfig(): ScreeningConfiguration {
    return {
      backgroundCheck: {
        enabled: true,
        provider: 'internal',
        requireConvictionCheck: true,
        requireEvictionCheck: true,
        requireSexOffenderCheck: true,
        lookbackYears: 7
      },
      creditCheck: {
        enabled: true,
        provider: 'internal',
        minimumScore: 600,
        requireFullReport: true
      },
      incomeVerification: {
        enabled: true,
        provider: 'internal',
        minimumIncomeMultiplier: 3,
        acceptableVerificationMethods: ['payStubs', 'bankStatements', 'employerVerification']
      },
      referenceCheck: {
        enabled: true,
        provider: 'internal',
        requireLandlordReferences: 1,
        requireEmploymentReferences: 1,
        requirePersonalReferences: 1
      }
    };
  }

  private generateMockCreditScore(): number {
    // Generate a realistic credit score distribution
    const rand = Math.random();
    if (rand < 0.1) return Math.floor(Math.random() * 150) + 300; // Poor: 300-450
    if (rand < 0.3) return Math.floor(Math.random() * 150) + 450; // Fair: 450-600
    if (rand < 0.7) return Math.floor(Math.random() * 150) + 600; // Good: 600-750
    return Math.floor(Math.random() * 100) + 750; // Excellent: 750-850
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
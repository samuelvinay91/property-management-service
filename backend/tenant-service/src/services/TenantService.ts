import { Repository, FindOptionsWhere, Like, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Tenant, TenantStatus } from '../entities/Tenant';
import { EmergencyContact } from '../entities/EmergencyContact';
import { Lease } from '../entities/Lease';
import { TenantDocument } from '../entities/TenantDocument';
import { Application } from '../entities/Application';
import { ApplicationService } from './ApplicationService';
import { ScreeningService } from './ScreeningService';

export interface CreateTenantData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  currentAddress?: string;
  currentCity?: string;
  currentState?: string;
  currentZipCode?: string;
  currentCountry?: string;
  monthlyIncome?: number;
  employerName?: string;
  jobTitle?: string;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateTenantData extends Partial<CreateTenantData> {
  status?: TenantStatus;
}

export interface TenantSearchFilters {
  status?: TenantStatus[];
  city?: string;
  state?: string;
  minIncome?: number;
  maxIncome?: number;
  hasActiveLeases?: boolean;
  isVerified?: boolean;
  search?: string; // Search in name, email, phone
}

export interface TenantVerificationData {
  identityVerified?: boolean;
  incomeVerified?: boolean;
  backgroundCheckCompleted?: boolean;
  creditCheckCompleted?: boolean;
  referencesVerified?: boolean;
  creditScore?: number;
  hasConvictions?: boolean;
  hasEvictions?: boolean;
  convictionDetails?: string;
  evictionDetails?: string;
}

export class TenantService {
  private tenantRepository: Repository<Tenant>;
  private emergencyContactRepository: Repository<EmergencyContact>;
  private leaseRepository: Repository<Lease>;
  private documentRepository: Repository<TenantDocument>;
  private applicationRepository: Repository<Application>;
  private applicationService: ApplicationService;
  private screeningService: ScreeningService;

  constructor() {
    this.tenantRepository = AppDataSource.getRepository(Tenant);
    this.emergencyContactRepository = AppDataSource.getRepository(EmergencyContact);
    this.leaseRepository = AppDataSource.getRepository(Lease);
    this.documentRepository = AppDataSource.getRepository(TenantDocument);
    this.applicationRepository = AppDataSource.getRepository(Application);
    this.applicationService = new ApplicationService();
    this.screeningService = new ScreeningService();
  }

  async createTenant(data: CreateTenantData): Promise<Tenant> {
    try {
      // Check if tenant with email already exists
      const existingTenant = await this.tenantRepository.findOne({
        where: { email: data.email }
      });

      if (existingTenant) {
        throw new Error('Tenant with this email already exists');
      }

      // Create tenant
      const tenant = this.tenantRepository.create({
        ...data,
        status: TenantStatus.PENDING_VERIFICATION,
        isActive: true,
        identityVerified: false,
        incomeVerified: false,
        backgroundCheckCompleted: false,
        creditCheckCompleted: false,
        referencesVerified: false,
        hasPets: false,
        smoker: false,
        numberOfOccupants: 1,
        hasConvictions: false,
        hasEvictions: false
      });

      const savedTenant = await this.tenantRepository.save(tenant);

      // Log tenant creation
      console.log(`Tenant created: ${savedTenant.id} - ${savedTenant.fullName}`);

      return savedTenant;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }
  }

  async updateTenant(id: string, data: UpdateTenantData): Promise<Tenant> {
    try {
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check if email is being updated and if it conflicts
      if (data.email && data.email !== tenant.email) {
        const existingTenant = await this.tenantRepository.findOne({
          where: { email: data.email }
        });
        if (existingTenant && existingTenant.id !== id) {
          throw new Error('Tenant with this email already exists');
        }
      }

      Object.assign(tenant, data);
      tenant.updatedAt = new Date();

      const updatedTenant = await this.tenantRepository.save(tenant);

      console.log(`Tenant updated: ${updatedTenant.id} - ${updatedTenant.fullName}`);

      return updatedTenant;
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    try {
      return await this.tenantRepository.findOne({
        where: { id },
        relations: ['applications', 'documents', 'leases', 'emergencyContacts']
      });
    } catch (error) {
      console.error('Error fetching tenant by ID:', error);
      return null;
    }
  }

  async getTenantByEmail(email: string): Promise<Tenant | null> {
    try {
      return await this.tenantRepository.findOne({
        where: { email },
        relations: ['applications', 'documents', 'leases', 'emergencyContacts']
      });
    } catch (error) {
      console.error('Error fetching tenant by email:', error);
      return null;
    }
  }

  async getAllTenants(limit = 50, offset = 0): Promise<Tenant[]> {
    try {
      return await this.tenantRepository.find({
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
        relations: ['leases']
      });
    } catch (error) {
      console.error('Error fetching all tenants:', error);
      return [];
    }
  }

  async searchTenants(filters: TenantSearchFilters, limit = 50, offset = 0): Promise<Tenant[]> {
    try {
      const queryBuilder = this.tenantRepository.createQueryBuilder('tenant')
        .leftJoinAndSelect('tenant.leases', 'lease')
        .leftJoinAndSelect('tenant.emergencyContacts', 'emergencyContact');

      // Status filter
      if (filters.status && filters.status.length > 0) {
        queryBuilder.andWhere('tenant.status IN (:...statuses)', { statuses: filters.status });
      }

      // Location filters
      if (filters.city) {
        queryBuilder.andWhere('tenant.currentCity ILIKE :city', { city: `%${filters.city}%` });
      }

      if (filters.state) {
        queryBuilder.andWhere('tenant.currentState = :state', { state: filters.state });
      }

      // Income filters
      if (filters.minIncome !== undefined) {
        queryBuilder.andWhere('tenant.totalMonthlyIncome >= :minIncome', { minIncome: filters.minIncome });
      }

      if (filters.maxIncome !== undefined) {
        queryBuilder.andWhere('tenant.totalMonthlyIncome <= :maxIncome', { maxIncome: filters.maxIncome });
      }

      // Active leases filter
      if (filters.hasActiveLeases !== undefined) {
        if (filters.hasActiveLeases) {
          queryBuilder.andWhere('lease.status = :leaseStatus', { leaseStatus: 'ACTIVE' });
        } else {
          queryBuilder.andWhere('(lease.status != :leaseStatus OR lease.id IS NULL)', { leaseStatus: 'ACTIVE' });
        }
      }

      // Verification filter
      if (filters.isVerified !== undefined) {
        if (filters.isVerified) {
          queryBuilder.andWhere('tenant.identityVerified = true')
            .andWhere('tenant.incomeVerified = true')
            .andWhere('tenant.backgroundCheckCompleted = true')
            .andWhere('tenant.creditCheckCompleted = true')
            .andWhere('tenant.referencesVerified = true');
        } else {
          queryBuilder.andWhere('(tenant.identityVerified = false OR tenant.incomeVerified = false OR tenant.backgroundCheckCompleted = false OR tenant.creditCheckCompleted = false OR tenant.referencesVerified = false)');
        }
      }

      // Text search
      if (filters.search) {
        queryBuilder.andWhere(
          '(tenant.firstName ILIKE :search OR tenant.lastName ILIKE :search OR tenant.email ILIKE :search OR tenant.phone ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      return await queryBuilder
        .orderBy('tenant.createdAt', 'DESC')
        .take(limit)
        .skip(offset)
        .getMany();
    } catch (error) {
      console.error('Error searching tenants:', error);
      return [];
    }
  }

  async updateVerificationStatus(id: string, verificationData: TenantVerificationData): Promise<Tenant> {
    try {
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Update verification fields
      if (verificationData.identityVerified !== undefined) {
        tenant.identityVerified = verificationData.identityVerified;
        tenant.identityVerifiedAt = verificationData.identityVerified ? new Date() : null;
      }

      if (verificationData.incomeVerified !== undefined) {
        tenant.incomeVerified = verificationData.incomeVerified;
        tenant.incomeVerifiedAt = verificationData.incomeVerified ? new Date() : null;
      }

      if (verificationData.backgroundCheckCompleted !== undefined) {
        tenant.backgroundCheckCompleted = verificationData.backgroundCheckCompleted;
        tenant.backgroundCheckCompletedAt = verificationData.backgroundCheckCompleted ? new Date() : null;
      }

      if (verificationData.creditCheckCompleted !== undefined) {
        tenant.creditCheckCompleted = verificationData.creditCheckCompleted;
        tenant.creditCheckCompletedAt = verificationData.creditCheckCompleted ? new Date() : null;
      }

      if (verificationData.referencesVerified !== undefined) {
        tenant.referencesVerified = verificationData.referencesVerified;
        tenant.referencesVerifiedAt = verificationData.referencesVerified ? new Date() : null;
      }

      // Update screening results
      if (verificationData.creditScore !== undefined) {
        tenant.creditScore = verificationData.creditScore;
        tenant.creditReportDate = new Date();
      }

      if (verificationData.hasConvictions !== undefined) {
        tenant.hasConvictions = verificationData.hasConvictions;
        tenant.convictionDetails = verificationData.convictionDetails;
      }

      if (verificationData.hasEvictions !== undefined) {
        tenant.hasEvictions = verificationData.hasEvictions;
        tenant.evictionDetails = verificationData.evictionDetails;
      }

      // Update status based on verification progress
      if (tenant.isFullyVerified) {
        tenant.status = TenantStatus.ACTIVE;
      }

      const updatedTenant = await this.tenantRepository.save(tenant);

      console.log(`Tenant verification updated: ${updatedTenant.id} - Progress: ${updatedTenant.verificationProgress}%`);

      return updatedTenant;
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw new Error(`Failed to update verification status: ${error.message}`);
    }
  }

  async deactivateTenant(id: string, reason?: string): Promise<Tenant> {
    try {
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.status = TenantStatus.INACTIVE;
      tenant.isActive = false;
      
      if (reason) {
        tenant.metadata = {
          ...tenant.metadata,
          deactivationReason: reason,
          deactivatedAt: new Date().toISOString()
        };
      }

      const updatedTenant = await this.tenantRepository.save(tenant);

      console.log(`Tenant deactivated: ${updatedTenant.id} - ${updatedTenant.fullName}`);

      return updatedTenant;
    } catch (error) {
      console.error('Error deactivating tenant:', error);
      throw new Error(`Failed to deactivate tenant: ${error.message}`);
    }
  }

  async reactivateTenant(id: string): Promise<Tenant> {
    try {
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.status = tenant.isFullyVerified ? TenantStatus.ACTIVE : TenantStatus.PENDING_VERIFICATION;
      tenant.isActive = true;
      
      tenant.metadata = {
        ...tenant.metadata,
        reactivatedAt: new Date().toISOString()
      };

      const updatedTenant = await this.tenantRepository.save(tenant);

      console.log(`Tenant reactivated: ${updatedTenant.id} - ${updatedTenant.fullName}`);

      return updatedTenant;
    } catch (error) {
      console.error('Error reactivating tenant:', error);
      throw new Error(`Failed to reactivate tenant: ${error.message}`);
    }
  }

  async deleteTenant(id: string): Promise<void> {
    try {
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check for active leases
      const activeLeases = await this.leaseRepository.find({
        where: { tenantId: id, status: In(['ACTIVE', 'PENDING_APPROVAL']) }
      });

      if (activeLeases.length > 0) {
        throw new Error('Cannot delete tenant with active leases');
      }

      // Soft delete by marking as inactive
      tenant.isActive = false;
      tenant.status = TenantStatus.TERMINATED;
      tenant.metadata = {
        ...tenant.metadata,
        deletedAt: new Date().toISOString()
      };

      await this.tenantRepository.save(tenant);

      console.log(`Tenant deleted: ${tenant.id} - ${tenant.fullName}`);
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  async getTenantDocuments(tenantId: string): Promise<TenantDocument[]> {
    try {
      return await this.documentRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error('Error fetching tenant documents:', error);
      return [];
    }
  }

  async addDocument(tenantId: string, documentData: Partial<TenantDocument>): Promise<TenantDocument> {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const document = this.documentRepository.create({
        ...documentData,
        tenantId,
        uploadedAt: new Date(),
        isActive: true
      });

      const savedDocument = await this.documentRepository.save(document);

      console.log(`Document added for tenant: ${tenantId} - ${documentData.name}`);

      return savedDocument;
    } catch (error) {
      console.error('Error adding document:', error);
      throw new Error(`Failed to add document: ${error.message}`);
    }
  }

  async getTenantApplications(tenantId: string): Promise<Application[]> {
    try {
      return await this.applicationRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error('Error fetching tenant applications:', error);
      return [];
    }
  }

  async getTenantLeases(tenantId: string): Promise<Lease[]> {
    try {
      return await this.leaseRepository.find({
        where: { tenantId },
        order: { startDate: 'DESC' }
      });
    } catch (error) {
      console.error('Error fetching tenant leases:', error);
      return [];
    }
  }

  async getActiveLeases(tenantId: string): Promise<Lease[]> {
    try {
      return await this.leaseRepository.find({
        where: { 
          tenantId,
          status: 'ACTIVE'
        },
        order: { startDate: 'DESC' }
      });
    } catch (error) {
      console.error('Error fetching active leases:', error);
      return [];
    }
  }

  async initiateScreeningProcess(tenantId: string, screeningType: 'BASIC' | 'COMPREHENSIVE' = 'BASIC'): Promise<void> {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      console.log(`Initiating ${screeningType} screening for tenant: ${tenantId}`);

      // Initiate background check
      if (screeningType === 'COMPREHENSIVE' || !tenant.backgroundCheckCompleted) {
        await this.screeningService.initiateBackgroundCheck(tenantId);
      }

      // Initiate credit check
      if (screeningType === 'COMPREHENSIVE' || !tenant.creditCheckCompleted) {
        await this.screeningService.initiateCreditCheck(tenantId);
      }

      // Initiate income verification
      if (screeningType === 'COMPREHENSIVE' || !tenant.incomeVerified) {
        await this.screeningService.initiateIncomeVerification(tenantId);
      }

      console.log(`Screening process initiated for tenant: ${tenantId}`);
    } catch (error) {
      console.error('Error initiating screening process:', error);
      throw new Error(`Failed to initiate screening process: ${error.message}`);
    }
  }

  async getTenantStats(): Promise<{
    total: number;
    active: number;
    pendingVerification: number;
    inactive: number;
    fullyVerified: number;
    withActiveLeases: number;
  }> {
    try {
      const [
        total,
        active,
        pendingVerification,
        inactive,
        fullyVerified,
        withActiveLeases
      ] = await Promise.all([
        this.tenantRepository.count(),
        this.tenantRepository.count({ where: { status: TenantStatus.ACTIVE } }),
        this.tenantRepository.count({ where: { status: TenantStatus.PENDING_VERIFICATION } }),
        this.tenantRepository.count({ where: { status: TenantStatus.INACTIVE } }),
        this.tenantRepository.count({
          where: {
            identityVerified: true,
            incomeVerified: true,
            backgroundCheckCompleted: true,
            creditCheckCompleted: true,
            referencesVerified: true
          }
        }),
        this.tenantRepository
          .createQueryBuilder('tenant')
          .leftJoin('tenant.leases', 'lease')
          .where('lease.status = :status', { status: 'ACTIVE' })
          .getCount()
      ]);

      return {
        total,
        active,
        pendingVerification,
        inactive,
        fullyVerified,
        withActiveLeases
      };
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      return {
        total: 0,
        active: 0,
        pendingVerification: 0,
        inactive: 0,
        fullyVerified: 0,
        withActiveLeases: 0
      };
    }
  }
}
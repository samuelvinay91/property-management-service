import { Repository } from 'typeorm';
import { MaintenanceRequest, RequestStatus } from '../entities/MaintenanceRequest';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '../entities/WorkOrder';
import { Asset } from '../entities/Asset';
import { Vendor } from '../entities/Vendor';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('MaintenanceService');

export class MaintenanceService {
  private maintenanceRequestRepo: Repository<MaintenanceRequest>;
  private workOrderRepo: Repository<WorkOrder>;
  private assetRepo: Repository<Asset>;
  private vendorRepo: Repository<Vendor>;

  constructor() {
    this.maintenanceRequestRepo = getRepository(MaintenanceRequest);
    this.workOrderRepo = getRepository(WorkOrder);
    this.assetRepo = getRepository(Asset);
    this.vendorRepo = getRepository(Vendor);
  }

  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      await this.maintenanceRequestRepo.count();
      return { status: 'healthy' };
    } catch (error) {
      logger.error('Maintenance service health check failed', { error: error.message });
      return { status: 'unhealthy', details: { error: error.message } };
    }
  }

  async submitMaintenanceRequest(data: any): Promise<MaintenanceRequest> {
    try {
      const request = this.maintenanceRequestRepo.create({
        ...data,
        status: RequestStatus.SUBMITTED,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedRequest = await this.maintenanceRequestRepo.save(request);
      logger.info('Maintenance request submitted', { requestId: savedRequest.id });
      return savedRequest;
    } catch (error) {
      logger.error('Failed to submit maintenance request', { error: error.message });
      throw error;
    }
  }

  async reviewMaintenanceRequest(requestId: string, reviewData: any, reviewedBy: string): Promise<MaintenanceRequest> {
    try {
      const request = await this.maintenanceRequestRepo.findOne({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error('Maintenance request not found');
      }

      Object.assign(request, {
        ...reviewData,
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date()
      });

      const savedRequest = await this.maintenanceRequestRepo.save(request);
      logger.info('Maintenance request reviewed', { requestId, status: reviewData.status });
      return savedRequest;
    } catch (error) {
      logger.error('Failed to review maintenance request', { error: error.message, requestId });
      throw error;
    }
  }

  async getMaintenanceRequestById(id: string): Promise<MaintenanceRequest | null> {
    try {
      return await this.maintenanceRequestRepo.findOne({ where: { id } });
    } catch (error) {
      logger.error('Failed to get maintenance request', { error: error.message, id });
      throw error;
    }
  }

  async getMaintenanceRequests(propertyId: string, status?: RequestStatus): Promise<MaintenanceRequest[]> {
    try {
      const where: any = { propertyId };
      if (status) {
        where.status = status;
      }
      return await this.maintenanceRequestRepo.find({ where });
    } catch (error) {
      logger.error('Failed to get maintenance requests', { error: error.message, propertyId });
      throw error;
    }
  }

  async getMaintenanceDashboard(propertyIds: string[]): Promise<any> {
    try {
      const [pendingRequests, totalRequests] = await Promise.all([
        this.maintenanceRequestRepo.count({
          where: { status: RequestStatus.SUBMITTED }
        }),
        this.maintenanceRequestRepo.count()
      ]);

      return {
        activeWorkOrders: 0,
        pendingRequests,
        overdueWorkOrders: 0,
        completedThisMonth: 0,
        averageCompletionTime: 0,
        topIssueCategories: [],
        upcomingScheduledMaintenance: 0,
        totalMaintenanceCost: 0
      };
    } catch (error) {
      logger.error('Failed to get maintenance dashboard', { error: error.message });
      throw error;
    }
  }

}
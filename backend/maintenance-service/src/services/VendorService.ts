import { Repository } from 'typeorm';
import { Vendor, VendorStatus, VendorType } from '../entities/Vendor';
import { WorkOrder } from '../entities/WorkOrder';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('VendorService');

export class VendorService {
  private vendorRepo: Repository<Vendor>;
  private workOrderRepo: Repository<WorkOrder>;

  constructor() {
    this.vendorRepo = getRepository(Vendor);
    this.workOrderRepo = getRepository(WorkOrder);
  }

  async getStatistics(): Promise<any> {
    try {
      const total = await this.vendorRepo.count();
      const active = await this.vendorRepo.count({ where: { status: VendorStatus.ACTIVE } });
      return { total, active };
    } catch (error) {
      logger.error('Failed to get vendor statistics', { error: error.message });
      return { total: 0, active: 0 };
    }
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    try {
      return await this.vendorRepo.findOne({ where: { id } });
    } catch (error) {
      logger.error('Failed to get vendor', { error: error.message, id });
      throw error;
    }
  }

  async getVendors(filters?: any): Promise<Vendor[]> {
    try {
      const where: any = {};
      if (filters?.status) {
        where.status = filters.status;
      }
      return await this.vendorRepo.find({ where });
    } catch (error) {
      logger.error('Failed to get vendors', { error: error.message });
      throw error;
    }
  }

  async createVendor(data: any): Promise<Vendor> {
    try {
      const vendor = this.vendorRepo.create({
        ...data,
        status: VendorStatus.PENDING_APPROVAL,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedVendor = await this.vendorRepo.save(vendor);
      logger.info('Vendor created', { vendorId: savedVendor.id });
      return savedVendor;
    } catch (error) {
      logger.error('Failed to create vendor', { error: error.message });
      throw error;
    }
  }

  async updateVendor(id: string, data: any): Promise<Vendor> {
    try {
      const vendor = await this.vendorRepo.findOne({ where: { id } });
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      Object.assign(vendor, data, { updatedAt: new Date() });
      const updatedVendor = await this.vendorRepo.save(vendor);
      logger.info('Vendor updated', { vendorId: id });
      return updatedVendor;
    } catch (error) {
      logger.error('Failed to update vendor', { error: error.message, id });
      throw error;
    }
  }

  async approveVendor(id: string, approvedBy: string): Promise<Vendor> {
    try {
      const vendor = await this.vendorRepo.findOne({ where: { id } });
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      vendor.status = VendorStatus.ACTIVE;
      vendor.updatedAt = new Date();

      const updatedVendor = await this.vendorRepo.save(vendor);
      logger.info('Vendor approved', { vendorId: id });
      return updatedVendor;
    } catch (error) {
      logger.error('Failed to approve vendor', { error: error.message, id });
      throw error;
    }
  }

  async suspendVendor(id: string, reason: string, suspendedBy: string): Promise<Vendor> {
    try {
      const vendor = await this.vendorRepo.findOne({ where: { id } });
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      vendor.status = VendorStatus.SUSPENDED;
      vendor.updatedAt = new Date();

      const updatedVendor = await this.vendorRepo.save(vendor);
      logger.info('Vendor suspended', { vendorId: id, reason });
      return updatedVendor;
    } catch (error) {
      logger.error('Failed to suspend vendor', { error: error.message, id });
      throw error;
    }
  }

  async getVendorPerformance(id: string): Promise<any> {
    try {
      const vendor = await this.vendorRepo.findOne({ where: { id } });
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      const workOrders = await this.workOrderRepo.find({ where: { vendorId: id } });
      
      return {
        totalJobs: workOrders.length,
        completedJobs: workOrders.filter(wo => wo.status === 'COMPLETED').length,
        completionRate: workOrders.length > 0 ? 
          (workOrders.filter(wo => wo.status === 'COMPLETED').length / workOrders.length) * 100 : 0,
        averageRating: vendor.rating || 0,
        averageResponseTime: vendor.averageResponseTime || 0,
        onTimeCompletionRate: 0,
        totalRevenue: 0,
        recentJobs: workOrders.slice(0, 5)
      };
    } catch (error) {
      logger.error('Failed to get vendor performance', { error: error.message, id });
      throw error;
    }
  }

  async getVendorsBySpecialty(specialty: string): Promise<Vendor[]> {
    try {
      return await this.vendorRepo.find({
        where: {
          status: VendorStatus.ACTIVE
          // Note: This would need proper array contains query for specialties
        }
      });
    } catch (error) {
      logger.error('Failed to get vendors by specialty', { error: error.message, specialty });
      throw error;
    }
  }
}
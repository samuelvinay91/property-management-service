import { Repository } from 'typeorm';
import { MaintenanceSchedule, ScheduleStatus, ScheduleFrequency } from '../entities/MaintenanceSchedule';
import { WorkOrder } from '../entities/WorkOrder';
import { Asset } from '../entities/Asset';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('ScheduleService');

export class ScheduleService {
  private scheduleRepo: Repository<MaintenanceSchedule>;
  private workOrderRepo: Repository<WorkOrder>;
  private assetRepo: Repository<Asset>;

  constructor() {
    this.scheduleRepo = getRepository(MaintenanceSchedule);
    this.workOrderRepo = getRepository(WorkOrder);
    this.assetRepo = getRepository(Asset);
  }

  async getMaintenanceScheduleById(id: string): Promise<MaintenanceSchedule | null> {
    try {
      return await this.scheduleRepo.findOne({ where: { id } });
    } catch (error) {
      logger.error('Failed to get maintenance schedule', { error: error.message, id });
      throw error;
    }
  }

  async getMaintenanceSchedules(propertyId: string, filters?: any): Promise<MaintenanceSchedule[]> {
    try {
      const where: any = { propertyId };
      if (filters?.status) {
        where.status = filters.status;
      }
      return await this.scheduleRepo.find({ where });
    } catch (error) {
      logger.error('Failed to get maintenance schedules', { error: error.message, propertyId });
      throw error;
    }
  }

  async createMaintenanceSchedule(data: any): Promise<MaintenanceSchedule> {
    try {
      const schedule = this.scheduleRepo.create({
        ...data,
        status: ScheduleStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedSchedule = await this.scheduleRepo.save(schedule);
      logger.info('Maintenance schedule created', { scheduleId: savedSchedule.id });
      return savedSchedule;
    } catch (error) {
      logger.error('Failed to create maintenance schedule', { error: error.message });
      throw error;
    }
  }

  async updateMaintenanceSchedule(id: string, data: any): Promise<MaintenanceSchedule> {
    try {
      const schedule = await this.scheduleRepo.findOne({ where: { id } });
      if (!schedule) {
        throw new Error('Maintenance schedule not found');
      }

      Object.assign(schedule, data, { updatedAt: new Date() });
      const updatedSchedule = await this.scheduleRepo.save(schedule);
      logger.info('Maintenance schedule updated', { scheduleId: id });
      return updatedSchedule;
    } catch (error) {
      logger.error('Failed to update maintenance schedule', { error: error.message, id });
      throw error;
    }
  }

  async pauseMaintenanceSchedule(id: string, pausedBy: string): Promise<MaintenanceSchedule> {
    try {
      const schedule = await this.scheduleRepo.findOne({ where: { id } });
      if (!schedule) {
        throw new Error('Maintenance schedule not found');
      }

      schedule.status = ScheduleStatus.PAUSED;
      schedule.updatedAt = new Date();

      const updatedSchedule = await this.scheduleRepo.save(schedule);
      logger.info('Maintenance schedule paused', { scheduleId: id });
      return updatedSchedule;
    } catch (error) {
      logger.error('Failed to pause maintenance schedule', { error: error.message, id });
      throw error;
    }
  }

  async resumeMaintenanceSchedule(id: string, resumedBy: string): Promise<MaintenanceSchedule> {
    try {
      const schedule = await this.scheduleRepo.findOne({ where: { id } });
      if (!schedule) {
        throw new Error('Maintenance schedule not found');
      }

      schedule.status = ScheduleStatus.ACTIVE;
      schedule.updatedAt = new Date();

      const updatedSchedule = await this.scheduleRepo.save(schedule);
      logger.info('Maintenance schedule resumed', { scheduleId: id });
      return updatedSchedule;
    } catch (error) {
      logger.error('Failed to resume maintenance schedule', { error: error.message, id });
      throw error;
    }
  }

  async executeScheduleManually(id: string, executedBy: string, skipWorkOrderCreation: boolean = false, notes?: string): Promise<MaintenanceSchedule> {
    try {
      const schedule = await this.scheduleRepo.findOne({ where: { id } });
      if (!schedule) {
        throw new Error('Maintenance schedule not found');
      }

      // Update schedule execution
      schedule.lastCompletedDate = new Date();
      schedule.completedCount = (schedule.completedCount || 0) + 1;
      schedule.updatedAt = new Date();

      // Calculate next due date
      if (schedule.frequency && schedule.intervalDays) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + schedule.intervalDays);
        schedule.nextDueDate = nextDate;
      }

      const updatedSchedule = await this.scheduleRepo.save(schedule);
      logger.info('Maintenance schedule executed manually', { scheduleId: id });
      return updatedSchedule;
    } catch (error) {
      logger.error('Failed to execute maintenance schedule', { error: error.message, id });
      throw error;
    }
  }

  async getUpcomingSchedules(propertyIds: string[], days: number = 30): Promise<MaintenanceSchedule[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      return await this.scheduleRepo.find({
        where: {
          status: ScheduleStatus.ACTIVE,
          nextDueDate: new Date() // This should be a proper date range query
        }
      });
    } catch (error) {
      logger.error('Failed to get upcoming schedules', { error: error.message });
      throw error;
    }
  }

  async getScheduleMetrics(propertyIds: string[]): Promise<any> {
    try {
      const totalSchedules = await this.scheduleRepo.count();
      const activeSchedules = await this.scheduleRepo.count({
        where: { status: ScheduleStatus.ACTIVE }
      });

      return {
        totalSchedules,
        activeSchedules,
        overdueSchedules: 0,
        schedulesThisMonth: 0,
        completionRate: 0,
        averageFrequency: 0,
        schedulesByFrequency: []
      };
    } catch (error) {
      logger.error('Failed to get schedule metrics', { error: error.message });
      throw error;
    }
  }

  async processScheduledMaintenance(): Promise<void> {
    try {
      logger.info('Processing scheduled maintenance');
      // Implementation for processing scheduled maintenance
      // This would check for due schedules and create work orders
    } catch (error) {
      logger.error('Failed to process scheduled maintenance', { error: error.message });
      throw error;
    }
  }

  // Placeholder methods for relationship queries
  async getMaintenanceSchedulesByAsset(assetId: string): Promise<MaintenanceSchedule[]> {
    return await this.scheduleRepo.find({ where: { assetId } });
  }
}
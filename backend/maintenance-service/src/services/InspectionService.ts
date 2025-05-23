import { Repository } from 'typeorm';
import { Inspection, InspectionStatus, InspectionType, InspectionResult } from '../entities/Inspection';
import { WorkOrder } from '../entities/WorkOrder';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('InspectionService');

export class InspectionService {
  private inspectionRepo: Repository<Inspection>;
  private workOrderRepo: Repository<WorkOrder>;

  constructor() {
    this.inspectionRepo = getRepository(Inspection);
    this.workOrderRepo = getRepository(WorkOrder);
  }

  async getInspectionById(id: string): Promise<Inspection | null> {
    try {
      return await this.inspectionRepo.findOne({ where: { id } });
    } catch (error) {
      logger.error('Failed to get inspection', { error: error.message, id });
      throw error;
    }
  }

  async getInspections(propertyId: string, filters?: any): Promise<Inspection[]> {
    try {
      const where: any = { propertyId };
      if (filters?.status) {
        where.status = filters.status;
      }
      return await this.inspectionRepo.find({ where });
    } catch (error) {
      logger.error('Failed to get inspections', { error: error.message, propertyId });
      throw error;
    }
  }

  async createInspection(data: any): Promise<Inspection> {
    try {
      const inspection = this.inspectionRepo.create({
        ...data,
        status: InspectionStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedInspection = await this.inspectionRepo.save(inspection);
      logger.info('Inspection created', { inspectionId: savedInspection.id });
      return savedInspection;
    } catch (error) {
      logger.error('Failed to create inspection', { error: error.message });
      throw error;
    }
  }

  async startInspection(id: string, inspectorId: string): Promise<Inspection> {
    try {
      const inspection = await this.inspectionRepo.findOne({ where: { id } });
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      inspection.status = InspectionStatus.IN_PROGRESS;
      inspection.inspectorId = inspectorId;
      inspection.startedAt = new Date();
      inspection.updatedAt = new Date();

      const updatedInspection = await this.inspectionRepo.save(inspection);
      logger.info('Inspection started', { inspectionId: id });
      return updatedInspection;
    } catch (error) {
      logger.error('Failed to start inspection', { error: error.message, id });
      throw error;
    }
  }

  async completeInspection(id: string, data: any): Promise<Inspection> {
    try {
      const inspection = await this.inspectionRepo.findOne({ where: { id } });
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      inspection.status = InspectionStatus.COMPLETED;
      inspection.completedAt = new Date();
      inspection.updatedAt = new Date();
      inspection.checklistResults = data.checklistResults;
      inspection.overallResult = data.overallResult;
      inspection.overallScore = data.overallScore;
      inspection.findings = data.findings;
      inspection.recommendations = data.recommendations;

      const updatedInspection = await this.inspectionRepo.save(inspection);
      logger.info('Inspection completed', { inspectionId: id });
      return updatedInspection;
    } catch (error) {
      logger.error('Failed to complete inspection', { error: error.message, id });
      throw error;
    }
  }

  async rescheduleInspection(id: string, newDate: Date, reason: string, rescheduledBy: string): Promise<Inspection> {
    try {
      const inspection = await this.inspectionRepo.findOne({ where: { id } });
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      inspection.status = InspectionStatus.RESCHEDULED;
      inspection.scheduledDate = newDate;
      inspection.updatedAt = new Date();

      const updatedInspection = await this.inspectionRepo.save(inspection);
      logger.info('Inspection rescheduled', { inspectionId: id, newDate });
      return updatedInspection;
    } catch (error) {
      logger.error('Failed to reschedule inspection', { error: error.message, id });
      throw error;
    }
  }

  async getUpcomingInspections(inspectorId?: string, days: number = 7): Promise<Inspection[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const where: any = {
        status: InspectionStatus.SCHEDULED,
        scheduledDate: new Date() // This should be a proper date range query
      };

      if (inspectorId) {
        where.inspectorId = inspectorId;
      }

      return await this.inspectionRepo.find({ where });
    } catch (error) {
      logger.error('Failed to get upcoming inspections', { error: error.message });
      throw error;
    }
  }

  async getInspectionTemplates(type: InspectionType): Promise<string[]> {
    try {
      // Return predefined checklist items based on inspection type
      const templates: Record<string, string[]> = {
        [InspectionType.MOVE_IN]: [
          'Check all lights and electrical outlets',
          'Test plumbing fixtures',
          'Inspect HVAC system',
          'Check smoke detectors',
          'Inspect walls and flooring'
        ],
        [InspectionType.MOVE_OUT]: [
          'Document any damages',
          'Check for normal wear and tear',
          'Verify cleanliness',
          'Test all appliances',
          'Inspect for needed repairs'
        ],
        [InspectionType.ROUTINE]: [
          'Safety systems check',
          'HVAC maintenance review',
          'Plumbing inspection',
          'Electrical system check'
        ]
      };

      return templates[type] || [];
    } catch (error) {
      logger.error('Failed to get inspection templates', { error: error.message, type });
      throw error;
    }
  }

  async generateInspectionReport(id: string): Promise<string> {
    try {
      const inspection = await this.inspectionRepo.findOne({ where: { id } });
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      // Generate and return report URL
      const reportUrl = `/reports/inspection/${id}`;
      inspection.reportUrl = reportUrl;
      inspection.reportGeneratedAt = new Date();
      await this.inspectionRepo.save(inspection);

      logger.info('Inspection report generated', { inspectionId: id });
      return reportUrl;
    } catch (error) {
      logger.error('Failed to generate inspection report', { error: error.message, id });
      throw error;
    }
  }

  async getInspectionMetrics(propertyIds: string[], dateRange: any): Promise<any> {
    try {
      const totalInspections = await this.inspectionRepo.count();
      const completedInspections = await this.inspectionRepo.count({
        where: { status: InspectionStatus.COMPLETED }
      });

      return {
        totalInspections,
        completedInspections,
        averageScore: 0,
        passRate: 0,
        deficiencyRate: 0,
        averageDuration: 0,
        inspectionsByType: [],
        monthlyTrend: []
      };
    } catch (error) {
      logger.error('Failed to get inspection metrics', { error: error.message });
      throw error;
    }
  }
}
import { Repository } from 'typeorm';
import { AvailabilityTemplate, TemplateStatus } from '../entities/AvailabilityTemplate';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('TemplateService');

export class TemplateService {
  private templateRepo: Repository<AvailabilityTemplate>;

  constructor() {
    this.templateRepo = getRepository(AvailabilityTemplate);
  }

  async createTemplate(data: any): Promise<AvailabilityTemplate> {
    try {
      const template = this.templateRepo.create({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedTemplate = await this.templateRepo.save(template);
      logger.info('Template created', { templateId: savedTemplate.id });
      return savedTemplate;
    } catch (error) {
      logger.error('Failed to create template', { error: error.message });
      throw error;
    }
  }

  async getTemplateById(id: string): Promise<AvailabilityTemplate | null> {
    try {
      return await this.templateRepo.findOne({
        where: { id },
        relations: ['slots']
      });
    } catch (error) {
      logger.error('Failed to get template', { error: error.message, id });
      throw error;
    }
  }

  async getTemplates(resourceId?: string, resourceType?: string, status?: TemplateStatus): Promise<AvailabilityTemplate[]> {
    try {
      const where: any = {};
      
      if (resourceId) where.resourceId = resourceId;
      if (resourceType) where.resourceType = resourceType;
      if (status) where.status = status;

      return await this.templateRepo.find({
        where,
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      logger.error('Failed to get templates', { error: error.message });
      throw error;
    }
  }

  async updateTemplate(id: string, data: any): Promise<AvailabilityTemplate> {
    try {
      const template = await this.templateRepo.findOne({ where: { id } });
      if (!template) {
        throw new Error('Template not found');
      }

      Object.assign(template, data, { updatedAt: new Date() });
      const updatedTemplate = await this.templateRepo.save(template);
      
      logger.info('Template updated', { templateId: id });
      return updatedTemplate;
    } catch (error) {
      logger.error('Failed to update template', { error: error.message, id });
      throw error;
    }
  }

  async activateTemplate(id: string): Promise<AvailabilityTemplate> {
    try {
      const template = await this.templateRepo.findOne({ where: { id } });
      if (!template) {
        throw new Error('Template not found');
      }

      template.status = TemplateStatus.ACTIVE;
      template.updatedAt = new Date();

      const updatedTemplate = await this.templateRepo.save(template);
      logger.info('Template activated', { templateId: id });
      return updatedTemplate;
    } catch (error) {
      logger.error('Failed to activate template', { error: error.message, id });
      throw error;
    }
  }

  async deactivateTemplate(id: string): Promise<AvailabilityTemplate> {
    try {
      const template = await this.templateRepo.findOne({ where: { id } });
      if (!template) {
        throw new Error('Template not found');
      }

      template.status = TemplateStatus.INACTIVE;
      template.updatedAt = new Date();

      const updatedTemplate = await this.templateRepo.save(template);
      logger.info('Template deactivated', { templateId: id });
      return updatedTemplate;
    } catch (error) {
      logger.error('Failed to deactivate template', { error: error.message, id });
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const template = await this.templateRepo.findOne({ 
        where: { id },
        relations: ['slots']
      });
      
      if (!template) {
        throw new Error('Template not found');
      }

      if (template.slots && template.slots.length > 0) {
        throw new Error('Cannot delete template with existing slots');
      }

      await this.templateRepo.remove(template);
      logger.info('Template deleted', { templateId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete template', { error: error.message, id });
      throw error;
    }
  }
}
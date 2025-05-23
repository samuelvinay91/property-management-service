import { Repository } from 'typeorm';
import { WorkOrderAttachment, AttachmentType, AttachmentCategory } from '../entities/WorkOrderAttachment';
import { WorkOrder } from '../entities/WorkOrder';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('FileUploadService');

export class FileUploadService {
  private attachmentRepo: Repository<WorkOrderAttachment>;
  private workOrderRepo: Repository<WorkOrder>;

  constructor() {
    this.attachmentRepo = getRepository(WorkOrderAttachment);
    this.workOrderRepo = getRepository(WorkOrder);
  }

  async uploadWorkOrderAttachment(workOrderId: string, data: any): Promise<WorkOrderAttachment> {
    try {
      // Verify work order exists
      const workOrder = await this.workOrderRepo.findOne({ where: { id: workOrderId } });
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      const attachment = this.attachmentRepo.create({
        workOrderId,
        filename: data.filename || 'uploaded-file',
        originalFilename: data.originalFilename || data.filename,
        url: data.url || `/uploads/${workOrderId}/${data.filename}`,
        type: data.type || AttachmentType.DOCUMENT,
        category: data.category || AttachmentCategory.OTHER,
        mimeType: data.mimeType || 'application/octet-stream',
        fileSize: data.fileSize || 0,
        description: data.description,
        uploadedBy: data.uploadedBy || 'system',
        isVisible: data.isVisible !== false,
        isPrivate: data.isPrivate || false,
        createdAt: new Date()
      });

      const savedAttachment = await this.attachmentRepo.save(attachment);
      logger.info('Work order attachment uploaded', { 
        attachmentId: savedAttachment.id, 
        workOrderId 
      });
      return savedAttachment;
    } catch (error) {
      logger.error('Failed to upload work order attachment', { 
        error: error.message, 
        workOrderId 
      });
      throw error;
    }
  }

  async getWorkOrderAttachments(workOrderId: string): Promise<WorkOrderAttachment[]> {
    try {
      return await this.attachmentRepo.find({ 
        where: { workOrderId },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      logger.error('Failed to get work order attachments', { 
        error: error.message, 
        workOrderId 
      });
      throw error;
    }
  }

  async deleteWorkOrderAttachment(id: string): Promise<boolean> {
    try {
      const attachment = await this.attachmentRepo.findOne({ where: { id } });
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      await this.attachmentRepo.remove(attachment);
      logger.info('Work order attachment deleted', { attachmentId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete work order attachment', { 
        error: error.message, 
        id 
      });
      throw error;
    }
  }

  async getAttachmentById(id: string): Promise<WorkOrderAttachment | null> {
    try {
      return await this.attachmentRepo.findOne({ where: { id } });
    } catch (error) {
      logger.error('Failed to get attachment', { error: error.message, id });
      throw error;
    }
  }

  async updateAttachment(id: string, data: any): Promise<WorkOrderAttachment> {
    try {
      const attachment = await this.attachmentRepo.findOne({ where: { id } });
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      Object.assign(attachment, data);
      const updatedAttachment = await this.attachmentRepo.save(attachment);
      logger.info('Attachment updated', { attachmentId: id });
      return updatedAttachment;
    } catch (error) {
      logger.error('Failed to update attachment', { error: error.message, id });
      throw error;
    }
  }

  async generateThumbnail(attachmentId: string): Promise<string> {
    try {
      const attachment = await this.attachmentRepo.findOne({ where: { id: attachmentId } });
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Generate thumbnail URL
      const thumbnailUrl = `/thumbnails/${attachmentId}`;
      attachment.thumbnailUrl = thumbnailUrl;
      await this.attachmentRepo.save(attachment);

      logger.info('Thumbnail generated', { attachmentId });
      return thumbnailUrl;
    } catch (error) {
      logger.error('Failed to generate thumbnail', { error: error.message, attachmentId });
      throw error;
    }
  }

  async validateFileType(filename: string, mimeType: string): Promise<boolean> {
    try {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      return allowedTypes.includes(mimeType);
    } catch (error) {
      logger.error('Failed to validate file type', { error: error.message, filename, mimeType });
      return false;
    }
  }

  async getUploadStats(): Promise<any> {
    try {
      const totalUploads = await this.attachmentRepo.count();
      const recentUploads = await this.attachmentRepo.count({
        where: {
          // Last 30 days
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      });

      return {
        totalUploads,
        recentUploads,
        averageFileSize: 0,
        popularFileTypes: []
      };
    } catch (error) {
      logger.error('Failed to get upload stats', { error: error.message });
      return { totalUploads: 0, recentUploads: 0, averageFileSize: 0, popularFileTypes: [] };
    }
  }
}
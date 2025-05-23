import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Notification, NotificationStatus, NotificationChannel, NotificationPriority } from '../entities/Notification';
import { NotificationPreference } from '../entities/NotificationPreference';
import { NotificationGroup } from '../entities/NotificationGroup';
import { DeliveryLog } from '../entities/DeliveryLog';
import { EmailService } from './EmailService';
import { SMSService } from './SMSService';
import { PushNotificationService } from './PushNotificationService';
import { TemplateService } from './TemplateService';
import { DeliveryService } from './DeliveryService';
import { Logger } from '../utils/logger';

export interface SendNotificationRequest {
  recipientId: string;
  channel: NotificationChannel;
  subject: string;
  content: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
  locale?: string;
  correlationId?: string;
  campaignId?: string;
}

export interface BulkNotificationRequest {
  recipientIds: string[];
  channel: NotificationChannel;
  subject: string;
  content: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
  locale?: string;
  campaignId?: string;
  batchSize?: number;
  batchDelayMs?: number;
}

export interface NotificationStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  byChannel: Record<NotificationChannel, number>;
  byPriority: Record<NotificationPriority, number>;
}

export class NotificationService {
  private notificationRepository: Repository<Notification>;
  private preferenceRepository: Repository<NotificationPreference>;
  private groupRepository: Repository<NotificationGroup>;
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushNotificationService;
  private templateService: TemplateService;
  private deliveryService: DeliveryService;
  private logger: Logger;

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
    this.preferenceRepository = AppDataSource.getRepository(NotificationPreference);
    this.groupRepository = AppDataSource.getRepository(NotificationGroup);
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushNotificationService();
    this.templateService = new TemplateService();
    this.deliveryService = new DeliveryService();
    this.logger = new Logger('NotificationService');
  }

  /**
   * Send a single notification
   */
  async sendNotification(request: SendNotificationRequest): Promise<Notification> {
    const startTime = Date.now();
    this.logger.info('Sending notification', { 
      recipientId: request.recipientId, 
      channel: request.channel,
      correlationId: request.correlationId 
    });

    try {
      // Check user preferences
      const canSend = await this.checkUserPreferences(
        request.recipientId,
        request.channel,
        request.priority || NotificationPriority.NORMAL
      );

      if (!canSend.allowed) {
        this.logger.warn('Notification blocked by user preferences', {
          recipientId: request.recipientId,
          reason: canSend.reason
        });
        throw new Error(`Notification blocked: ${canSend.reason}`);
      }

      // Process template if provided
      let processedContent = request.content;
      let processedSubject = request.subject;

      if (request.templateId) {
        const rendered = await this.templateService.renderTemplate(
          request.templateId,
          request.templateVariables || {},
          request.locale || 'en'
        );
        processedSubject = rendered.subject;
        processedContent = rendered.body;
      }

      // Get recipient contact info
      const contactInfo = await this.getRecipientContactInfo(request.recipientId, request.channel);
      if (!contactInfo) {
        throw new Error(`No contact information found for recipient ${request.recipientId} on channel ${request.channel}`);
      }

      // Create notification record
      const notification = this.notificationRepository.create({
        recipientId: request.recipientId,
        recipientEmail: contactInfo.email,
        recipientPhone: contactInfo.phone,
        recipientDeviceToken: contactInfo.deviceToken,
        channel: request.channel,
        subject: processedSubject,
        content: processedContent,
        templateId: request.templateId,
        templateVariables: request.templateVariables,
        priority: request.priority || NotificationPriority.NORMAL,
        scheduledAt: request.scheduledAt,
        metadata: request.metadata,
        locale: request.locale || 'en',
        correlationId: request.correlationId,
        campaignId: request.campaignId,
        status: request.scheduledAt && request.scheduledAt > new Date() 
          ? NotificationStatus.PENDING 
          : NotificationStatus.PROCESSING
      });

      const savedNotification = await this.notificationRepository.save(notification);

      // Send immediately if not scheduled
      if (!request.scheduledAt || request.scheduledAt <= new Date()) {
        await this.processNotification(savedNotification);
      }

      const duration = Date.now() - startTime;
      this.logger.info('Notification created successfully', {
        notificationId: savedNotification.id,
        duration
      });

      return savedNotification;

    } catch (error) {
      this.logger.error('Failed to send notification', {
        recipientId: request.recipientId,
        channel: request.channel,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(request: BulkNotificationRequest): Promise<NotificationGroup> {
    this.logger.info('Sending bulk notifications', {
      recipientCount: request.recipientIds.length,
      channel: request.channel
    });

    try {
      // Create notification group
      const group = this.groupRepository.create({
        name: `Bulk ${request.channel} - ${new Date().toISOString()}`,
        type: 'bulk',
        channel: request.channel,
        notificationType: 'transactional',
        priority: request.priority || NotificationPriority.NORMAL,
        targeting: {
          userIds: request.recipientIds
        },
        schedule: {
          sendImmediately: !request.scheduledAt,
          sendAt: request.scheduledAt,
          timezone: 'UTC',
          respectQuietHours: true
        },
        settings: {
          batchSize: request.batchSize || 100,
          batchDelayMs: request.batchDelayMs || 1000,
          maxRetries: 3,
          retryDelayMs: 5000,
          enableRateLimiting: true,
          suppressDuplicates: true,
          respectUserPreferences: true,
          trackingEnabled: true,
          unsubscribeEnabled: true
        },
        templateId: request.templateId,
        templateVariables: request.templateVariables,
        campaignId: request.campaignId,
        metrics: {
          totalRecipients: request.recipientIds.length,
          targetedRecipients: request.recipientIds.length,
          eligibleRecipients: 0,
          sentCount: 0,
          deliveredCount: 0,
          failedCount: 0,
          bouncedCount: 0,
          openedCount: 0,
          clickedCount: 0,
          unsubscribedCount: 0,
          complainedCount: 0,
          costTotal: 0,
          currency: 'USD'
        }
      });

      const savedGroup = await this.groupRepository.save(group);

      // Create individual notifications
      const notifications = [];
      for (const recipientId of request.recipientIds) {
        const notification = this.notificationRepository.create({
          recipientId,
          channel: request.channel,
          subject: request.subject,
          content: request.content,
          templateId: request.templateId,
          templateVariables: request.templateVariables,
          priority: request.priority || NotificationPriority.NORMAL,
          scheduledAt: request.scheduledAt,
          metadata: request.metadata,
          locale: request.locale || 'en',
          campaignId: request.campaignId,
          groupId: savedGroup.id,
          status: NotificationStatus.PENDING
        });
        notifications.push(notification);
      }

      await this.notificationRepository.save(notifications);

      // Start processing if not scheduled
      if (!request.scheduledAt || request.scheduledAt <= new Date()) {
        this.processBulkNotifications(savedGroup.id);
      }

      return savedGroup;

    } catch (error) {
      this.logger.error('Failed to send bulk notifications', {
        recipientCount: request.recipientIds.length,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process a single notification for delivery
   */
  async processNotification(notification: Notification): Promise<void> {
    try {
      notification.status = NotificationStatus.PROCESSING;
      await this.notificationRepository.save(notification);

      let success = false;
      let errorMessage = '';

      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          success = await this.emailService.sendEmail({
            to: notification.recipientEmail!,
            subject: notification.subject,
            content: notification.content,
            metadata: notification.metadata
          });
          break;

        case NotificationChannel.SMS:
          success = await this.smsService.sendSMS({
            to: notification.recipientPhone!,
            message: notification.content,
            metadata: notification.metadata
          });
          break;

        case NotificationChannel.PUSH:
          success = await this.pushService.sendPush({
            deviceToken: notification.recipientDeviceToken!,
            title: notification.subject,
            body: notification.content,
            metadata: notification.metadata
          });
          break;

        case NotificationChannel.IN_APP:
          // In-app notifications are stored in database and marked as sent
          success = true;
          break;

        default:
          throw new Error(`Unsupported notification channel: ${notification.channel}`);
      }

      if (success) {
        notification.markAsSent();
        this.logger.info('Notification sent successfully', {
          notificationId: notification.id,
          channel: notification.channel
        });
      } else {
        notification.markAsFailed('Delivery service returned failure');
        this.logger.error('Notification delivery failed', {
          notificationId: notification.id,
          channel: notification.channel
        });
      }

      await this.notificationRepository.save(notification);

    } catch (error) {
      notification.markAsFailed(error.message);
      await this.notificationRepository.save(notification);
      
      this.logger.error('Error processing notification', {
        notificationId: notification.id,
        error: error.message
      });
    }
  }

  /**
   * Process bulk notifications in batches
   */
  async processBulkNotifications(groupId: string): Promise<void> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new Error(`Notification group ${groupId} not found`);
    }

    group.start();
    await this.groupRepository.save(group);

    try {
      const batchSize = group.settings.batchSize;
      let offset = 0;
      let hasMore = true;

      while (hasMore && group.status === 'processing') {
        const notifications = await this.notificationRepository.find({
          where: { 
            groupId,
            status: NotificationStatus.PENDING
          },
          take: batchSize,
          skip: offset
        });

        if (notifications.length === 0) {
          hasMore = false;
          break;
        }

        // Process batch
        const promises = notifications.map(notification => 
          this.processNotification(notification)
        );
        
        await Promise.allSettled(promises);

        group.incrementProcessedCount(notifications.length);
        await this.groupRepository.save(group);

        // Delay between batches
        if (group.settings.batchDelayMs > 0 && hasMore) {
          await this.delay(group.settings.batchDelayMs);
        }

        offset += batchSize;
      }

      group.complete();
      await this.groupRepository.save(group);

      this.logger.info('Bulk notification processing completed', {
        groupId,
        processedCount: group.processedCount
      });

    } catch (error) {
      group.cancel(error.message);
      await this.groupRepository.save(group);
      
      this.logger.error('Bulk notification processing failed', {
        groupId,
        error: error.message
      });
    }
  }

  /**
   * Get notifications for a user (for in-app display)
   */
  async getUserNotifications(
    userId: string,
    channel: NotificationChannel = NotificationChannel.IN_APP,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<{ notifications: Notification[]; total: number }> {
    const whereCondition: any = {
      recipientId: userId,
      channel
    };

    if (unreadOnly) {
      whereCondition.readAt = null;
    }

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });

    return { notifications, total };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.markAsRead();
    await this.notificationRepository.save(notification);
  }

  /**
   * Get notification statistics
   */
  async getStats(
    dateFrom?: Date,
    dateTo?: Date,
    userId?: string,
    channel?: NotificationChannel
  ): Promise<NotificationStats> {
    const query = this.notificationRepository.createQueryBuilder('notification');

    if (dateFrom) {
      query.andWhere('notification.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      query.andWhere('notification.createdAt <= :dateTo', { dateTo });
    }

    if (userId) {
      query.andWhere('notification.recipientId = :userId', { userId });
    }

    if (channel) {
      query.andWhere('notification.channel = :channel', { channel });
    }

    const notifications = await query.getMany();

    const stats: NotificationStats = {
      total: notifications.length,
      pending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      byChannel: {} as Record<NotificationChannel, number>,
      byPriority: {} as Record<NotificationPriority, number>
    };

    // Initialize counters
    Object.values(NotificationChannel).forEach(ch => {
      stats.byChannel[ch] = 0;
    });

    Object.values(NotificationPriority).forEach(priority => {
      stats.byPriority[priority] = 0;
    });

    // Count notifications
    notifications.forEach(notification => {
      switch (notification.status) {
        case NotificationStatus.PENDING:
          stats.pending++;
          break;
        case NotificationStatus.SENT:
          stats.sent++;
          break;
        case NotificationStatus.DELIVERED:
          stats.delivered++;
          break;
        case NotificationStatus.FAILED:
          stats.failed++;
          break;
      }

      stats.byChannel[notification.channel]++;
      stats.byPriority[notification.priority]++;
    });

    return stats;
  }

  /**
   * Check if user can receive notification based on preferences
   */
  private async checkUserPreferences(
    userId: string,
    channel: NotificationChannel,
    priority: NotificationPriority
  ): Promise<{ allowed: boolean; reason?: string }> {
    const preferences = await this.preferenceRepository.find({
      where: { userId }
    });

    // If no preferences found, allow by default
    if (preferences.length === 0) {
      return { allowed: true };
    }

    for (const preference of preferences) {
      if (!preference.canReceiveNotification(channel, 'transactional')) {
        return { 
          allowed: false, 
          reason: `User has opted out of ${channel} notifications` 
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get recipient contact information
   */
  private async getRecipientContactInfo(
    userId: string,
    channel: NotificationChannel
  ): Promise<{ email?: string; phone?: string; deviceToken?: string } | null> {
    // This would typically fetch from user service
    // For now, return mock data based on preferences
    const preference = await this.preferenceRepository.findOne({
      where: { userId }
    });

    if (!preference?.contactInfo) {
      return null;
    }

    return {
      email: preference.contactInfo.email,
      phone: preference.contactInfo.phone,
      deviceToken: preference.contactInfo.deviceTokens?.[0]
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    const scheduledNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.PENDING,
        scheduledAt: { $lte: now } as any
      },
      take: 100 // Process in batches
    });

    const promises = scheduledNotifications.map(notification =>
      this.processNotification(notification)
    );

    await Promise.allSettled(promises);

    this.logger.info('Processed scheduled notifications', {
      count: scheduledNotifications.length
    });
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<void> {
    const failedNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.FAILED
      }
    });

    const retryableNotifications = failedNotifications.filter(n => n.canRetry);

    for (const notification of retryableNotifications) {
      if (!notification.nextRetryAt || notification.nextRetryAt <= new Date()) {
        notification.resetForRetry();
        await this.processNotification(notification);
      }
    }

    this.logger.info('Retried failed notifications', {
      count: retryableNotifications.length
    });
  }
}
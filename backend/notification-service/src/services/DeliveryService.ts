import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Notification, NotificationStatus } from '../entities/Notification';
import { DeliveryLog, DeliveryStatus, DeliveryProvider } from '../entities/DeliveryLog';
import { NotificationGroup, GroupStatus } from '../entities/NotificationGroup';
import { EmailService } from './EmailService';
import { SMSService } from './SMSService';
import { PushNotificationService } from './PushNotificationService';
import { Logger } from '../utils/logger';

export interface DeliveryMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  byChannel: Record<string, {
    total: number;
    successful: number;
    failed: number;
    rate: number;
  }>;
  byProvider: Record<string, {
    total: number;
    successful: number;
    failed: number;
    rate: number;
    avgCost: number;
  }>;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstSize: number;
}

export class DeliveryService {
  private notificationRepository: Repository<Notification>;
  private deliveryLogRepository: Repository<DeliveryLog>;
  private groupRepository: Repository<NotificationGroup>;
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushNotificationService;
  private logger: Logger;
  private rateLimiters: Map<string, { count: number; resetTime: Date }>;
  private retryQueues: Map<string, Notification[]>;

  private defaultRetryPolicy: RetryPolicy = {
    maxRetries: 3,
    baseDelayMs: 5000, // 5 seconds
    maxDelayMs: 300000, // 5 minutes
    backoffMultiplier: 2,
    retryableErrors: [
      'RATE_LIMIT_EXCEEDED',
      'TEMPORARY_FAILURE',
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVICE_UNAVAILABLE'
    ]
  };

  private defaultRateLimits: RateLimitConfig = {
    requestsPerSecond: 10,
    requestsPerMinute: 300,
    requestsPerHour: 10000,
    burstSize: 50
  };

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
    this.deliveryLogRepository = AppDataSource.getRepository(DeliveryLog);
    this.groupRepository = AppDataSource.getRepository(NotificationGroup);
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushNotificationService();
    this.logger = new Logger('DeliveryService');
    this.rateLimiters = new Map();
    this.retryQueues = new Map();

    // Start background workers
    this.startRetryWorker();
    this.startMetricsWorker();
    this.startCleanupWorker();
  }

  /**
   * Process a notification for delivery
   */
  async processDelivery(notificationId: string): Promise<DeliveryLog> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    // Check if already processing or completed
    if (notification.status !== NotificationStatus.PENDING) {
      this.logger.warn('Notification already processed', {
        notificationId,
        status: notification.status
      });
      throw new Error(`Notification ${notificationId} is not in pending status`);
    }

    // Check rate limits
    const rateLimitKey = `${notification.channel}:${notification.recipientId}`;
    if (!this.checkRateLimit(rateLimitKey)) {
      // Add to retry queue
      await this.scheduleRetry(notification, 'Rate limit exceeded');
      throw new Error('Rate limit exceeded, notification scheduled for retry');
    }

    // Create delivery log
    const deliveryLog = this.deliveryLogRepository.create({
      notificationId: notification.id,
      status: DeliveryStatus.PROCESSING,
      channel: notification.channel,
      provider: this.getProviderForChannel(notification.channel),
      recipientAddress: this.getRecipientAddress(notification),
      metrics: {
        attemptNumber: notification.retryCount + 1,
        latencyMs: 0
      }
    });

    const savedLog = await this.deliveryLogRepository.save(deliveryLog);

    // Update notification status
    notification.status = NotificationStatus.PROCESSING;
    await this.notificationRepository.save(notification);

    try {
      // Attempt delivery
      const success = await this.attemptDelivery(notification, savedLog);

      if (success) {
        // Mark as sent
        notification.markAsSent();
        savedLog.markAsSent();
        
        this.logger.info('Notification delivered successfully', {
          notificationId: notification.id,
          channel: notification.channel,
          provider: savedLog.provider
        });
      } else {
        // Mark as failed and potentially retry
        const errorMessage = 'Delivery failed';
        notification.markAsFailed(errorMessage);
        savedLog.markAsFailed(errorMessage);

        if (notification.canRetry) {
          await this.scheduleRetry(notification, errorMessage);
        }
      }

      // Save updates
      await Promise.all([
        this.notificationRepository.save(notification),
        this.deliveryLogRepository.save(savedLog)
      ]);

      // Update group metrics if applicable
      if (notification.groupId) {
        await this.updateGroupMetrics(notification.groupId);
      }

      return savedLog;

    } catch (error) {
      // Handle delivery error
      const errorMessage = error.message || 'Unknown delivery error';
      
      notification.markAsFailed(errorMessage);
      savedLog.markAsFailed(errorMessage);

      // Check if error is retryable
      if (this.isRetryableError(errorMessage) && notification.canRetry) {
        await this.scheduleRetry(notification, errorMessage);
      }

      await Promise.all([
        this.notificationRepository.save(notification),
        this.deliveryLogRepository.save(savedLog)
      ]);

      this.logger.error('Notification delivery failed', {
        notificationId: notification.id,
        error: errorMessage,
        canRetry: notification.canRetry
      });

      throw error;
    }
  }

  /**
   * Attempt delivery using appropriate service
   */
  private async attemptDelivery(notification: Notification, deliveryLog: DeliveryLog): Promise<boolean> {
    const startTime = Date.now();

    try {
      let success = false;

      switch (notification.channel) {
        case 'email':
          success = await this.emailService.sendEmail({
            to: notification.recipientEmail!,
            subject: notification.subject,
            content: notification.content,
            metadata: notification.metadata
          });
          break;

        case 'sms':
          success = await this.smsService.sendSMS({
            to: notification.recipientPhone!,
            message: notification.content,
            metadata: notification.metadata
          });
          break;

        case 'push':
          success = await this.pushService.sendPush({
            deviceToken: notification.recipientDeviceToken!,
            title: notification.subject,
            body: notification.content,
            metadata: notification.metadata
          });
          break;

        case 'in_app':
          // In-app notifications are stored and marked as delivered
          success = true;
          break;

        default:
          throw new Error(`Unsupported channel: ${notification.channel}`);
      }

      // Update delivery metrics
      const latency = Date.now() - startTime;
      deliveryLog.updateMetrics({
        ...deliveryLog.metrics,
        latencyMs: latency,
        responseTime: latency
      });

      return success;

    } catch (error) {
      const latency = Date.now() - startTime;
      deliveryLog.updateMetrics({
        ...deliveryLog.metrics,
        latencyMs: latency
      });

      throw error;
    }
  }

  /**
   * Schedule notification for retry
   */
  private async scheduleRetry(notification: Notification, reason: string): Promise<void> {
    const retryPolicy = this.getRetryPolicy(notification);
    const delayMs = this.calculateRetryDelay(notification.retryCount, retryPolicy);
    
    notification.nextRetryAt = new Date(Date.now() + delayMs);
    notification.failureReason = reason;

    // Add to retry queue
    const queueKey = notification.channel;
    if (!this.retryQueues.has(queueKey)) {
      this.retryQueues.set(queueKey, []);
    }
    this.retryQueues.get(queueKey)!.push(notification);

    this.logger.info('Notification scheduled for retry', {
      notificationId: notification.id,
      retryCount: notification.retryCount,
      retryAt: notification.nextRetryAt,
      reason
    });
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
      take: 100,
      order: { scheduledAt: 'ASC' }
    });

    this.logger.info('Processing scheduled notifications', {
      count: scheduledNotifications.length
    });

    for (const notification of scheduledNotifications) {
      try {
        await this.processDelivery(notification.id);
      } catch (error) {
        this.logger.error('Failed to process scheduled notification', {
          notificationId: notification.id,
          error: error.message
        });
      }
    }
  }

  /**
   * Process retry queue
   */
  async processRetryQueue(): Promise<void> {
    const now = new Date();

    for (const [channel, notifications] of this.retryQueues.entries()) {
      const readyForRetry = notifications.filter(n => 
        n.nextRetryAt && n.nextRetryAt <= now
      );

      for (const notification of readyForRetry) {
        try {
          notification.resetForRetry();
          await this.processDelivery(notification.id);
          
          // Remove from retry queue
          const index = notifications.indexOf(notification);
          if (index > -1) {
            notifications.splice(index, 1);
          }
        } catch (error) {
          this.logger.error('Retry attempt failed', {
            notificationId: notification.id,
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Get delivery metrics
   */
  async getDeliveryMetrics(
    dateFrom?: Date,
    dateTo?: Date,
    channel?: string,
    provider?: string
  ): Promise<DeliveryMetrics> {
    const query = this.deliveryLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.notification', 'notification');

    if (dateFrom) {
      query.andWhere('log.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      query.andWhere('log.createdAt <= :dateTo', { dateTo });
    }

    if (channel) {
      query.andWhere('log.channel = :channel', { channel });
    }

    if (provider) {
      query.andWhere('log.provider = :provider', { provider });
    }

    const logs = await query.getMany();

    // Calculate metrics
    const metrics: DeliveryMetrics = {
      totalDeliveries: logs.length,
      successfulDeliveries: logs.filter(log => log.isSuccessful).length,
      failedDeliveries: logs.filter(log => log.isFailed).length,
      deliveryRate: 0,
      avgDeliveryTime: 0,
      byChannel: {},
      byProvider: {}
    };

    metrics.deliveryRate = metrics.totalDeliveries > 0 
      ? (metrics.successfulDeliveries / metrics.totalDeliveries) * 100 
      : 0;

    // Calculate average delivery time
    const deliveryTimes = logs
      .filter(log => log.deliveryDuration !== null)
      .map(log => log.deliveryDuration!);

    metrics.avgDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
      : 0;

    // Group by channel
    const channelGroups = this.groupBy(logs, 'channel');
    for (const [channel, channelLogs] of Object.entries(channelGroups)) {
      const successful = channelLogs.filter(log => log.isSuccessful).length;
      metrics.byChannel[channel] = {
        total: channelLogs.length,
        successful,
        failed: channelLogs.length - successful,
        rate: channelLogs.length > 0 ? (successful / channelLogs.length) * 100 : 0
      };
    }

    // Group by provider
    const providerGroups = this.groupBy(logs, 'provider');
    for (const [provider, providerLogs] of Object.entries(providerGroups)) {
      const successful = providerLogs.filter(log => log.isSuccessful).length;
      const totalCost = providerLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
      
      metrics.byProvider[provider] = {
        total: providerLogs.length,
        successful,
        failed: providerLogs.length - successful,
        rate: providerLogs.length > 0 ? (successful / providerLogs.length) * 100 : 0,
        avgCost: providerLogs.length > 0 ? totalCost / providerLogs.length : 0
      };
    }

    return metrics;
  }

  /**
   * Update group metrics
   */
  private async updateGroupMetrics(groupId: string): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['notifications']
    });

    if (!group) return;

    const notifications = group.notifications;
    const sentCount = notifications.filter(n => n.status === NotificationStatus.SENT).length;
    const deliveredCount = notifications.filter(n => n.status === NotificationStatus.DELIVERED).length;
    const failedCount = notifications.filter(n => n.status === NotificationStatus.FAILED).length;

    group.updateMetrics({
      ...group.metrics!,
      sentCount,
      deliveredCount,
      failedCount
    });

    // Check if group is completed
    if (sentCount + failedCount === notifications.length) {
      group.complete();
    }

    await this.groupRepository.save(group);
  }

  /**
   * Helper methods
   */
  private getProviderForChannel(channel: string): DeliveryProvider {
    switch (channel) {
      case 'email':
        return DeliveryProvider.SENDGRID; // Default email provider
      case 'sms':
        return DeliveryProvider.TWILIO;
      case 'push':
        return DeliveryProvider.FIREBASE;
      default:
        return DeliveryProvider.INTERNAL;
    }
  }

  private getRecipientAddress(notification: Notification): string {
    switch (notification.channel) {
      case 'email':
        return notification.recipientEmail || '';
      case 'sms':
        return notification.recipientPhone || '';
      case 'push':
        return notification.recipientDeviceToken || '';
      default:
        return notification.recipientId;
    }
  }

  private checkRateLimit(key: string): boolean {
    const config = this.defaultRateLimits;
    const now = new Date();
    const limiter = this.rateLimiters.get(key);

    if (!limiter || now >= limiter.resetTime) {
      // Reset or initialize rate limiter
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + 60000) // Reset in 1 minute
      });
      return true;
    }

    if (limiter.count >= config.requestsPerMinute) {
      return false;
    }

    limiter.count++;
    return true;
  }

  private getRetryPolicy(notification: Notification): RetryPolicy {
    // Could be customized per channel or notification type
    return this.defaultRetryPolicy;
  }

  private calculateRetryDelay(retryCount: number, policy: RetryPolicy): number {
    const delay = policy.baseDelayMs * Math.pow(policy.backoffMultiplier, retryCount);
    return Math.min(delay, policy.maxDelayMs);
  }

  private isRetryableError(error: string): boolean {
    return this.defaultRetryPolicy.retryableErrors.some(retryableError =>
      error.includes(retryableError)
    );
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      (groups[group] = groups[group] || []).push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Background workers
   */
  private startRetryWorker(): void {
    setInterval(async () => {
      try {
        await this.processRetryQueue();
        await this.processScheduledNotifications();
      } catch (error) {
        this.logger.error('Retry worker error', { error: error.message });
      }
    }, 30000); // Run every 30 seconds
  }

  private startMetricsWorker(): void {
    setInterval(async () => {
      try {
        // Aggregate and store metrics
        const metrics = await this.getDeliveryMetrics(
          new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          new Date()
        );

        this.logger.info('Daily delivery metrics', metrics);
      } catch (error) {
        this.logger.error('Metrics worker error', { error: error.message });
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  private startCleanupWorker(): void {
    setInterval(() => {
      // Clean up expired rate limiters
      const now = new Date();
      for (const [key, limiter] of this.rateLimiters.entries()) {
        if (now >= limiter.resetTime) {
          this.rateLimiters.delete(key);
        }
      }

      // Clean up completed retry queues
      for (const [channel, notifications] of this.retryQueues.entries()) {
        const activeNotifications = notifications.filter(n => 
          n.status === NotificationStatus.PENDING && n.canRetry
        );
        
        if (activeNotifications.length === 0) {
          this.retryQueues.delete(channel);
        } else {
          this.retryQueues.set(channel, activeNotifications);
        }
      }

      this.logger.debug('Cleanup completed');
    }, 10 * 60 * 1000); // Run every 10 minutes
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    metrics: {
      pendingNotifications: number;
      retryQueueSize: number;
      avgDeliveryTime: number;
    };
  }> {
    const pendingCount = await this.notificationRepository.count({
      where: { status: NotificationStatus.PENDING }
    });

    const retryQueueSize = Array.from(this.retryQueues.values())
      .reduce((total, queue) => total + queue.length, 0);

    const recentMetrics = await this.getDeliveryMetrics(
      new Date(Date.now() - 60 * 60 * 1000), // Last hour
      new Date()
    );

    const services = {
      email: true, // Would check email service health
      sms: true,   // Would check SMS service health
      push: true   // Would check push service health
    };

    const allServicesHealthy = Object.values(services).every(Boolean);
    const status = allServicesHealthy && pendingCount < 1000 ? 'healthy' : 
                  allServicesHealthy ? 'degraded' : 'unhealthy';

    return {
      status,
      services,
      metrics: {
        pendingNotifications: pendingCount,
        retryQueueSize,
        avgDeliveryTime: recentMetrics.avgDeliveryTime
      }
    };
  }
}
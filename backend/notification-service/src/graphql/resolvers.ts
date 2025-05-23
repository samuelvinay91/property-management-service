import { IResolvers } from '@graphql-tools/utils';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';
import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification';
import { NotificationTemplate } from '../entities/NotificationTemplate';
import { NotificationPreference } from '../entities/NotificationPreference';
import { NotificationGroup } from '../entities/NotificationGroup';
import { DeliveryLog } from '../entities/DeliveryLog';
import { NotificationService } from '../services/NotificationService';
import { TemplateService } from '../services/TemplateService';
import { DeliveryService } from '../services/DeliveryService';
import { Logger } from '../utils/logger';

// Initialize repositories
const notificationRepository = AppDataSource.getRepository(Notification);
const templateRepository = AppDataSource.getRepository(NotificationTemplate);
const preferenceRepository = AppDataSource.getRepository(NotificationPreference);
const groupRepository = AppDataSource.getRepository(NotificationGroup);
const deliveryLogRepository = AppDataSource.getRepository(DeliveryLog);

// Initialize services
const notificationService = new NotificationService();
const templateService = new TemplateService();
const deliveryService = new DeliveryService();
const logger = new Logger('GraphQLResolvers');

// Custom scalars
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value;
  },
  parseValue(value: any) {
    return value;
  },
  parseLiteral(ast: any) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.OBJECT:
        return ast.fields.reduce((obj: any, field: any) => {
          obj[field.name.value] = JSONScalar.parseLiteral!(field.value, {});
          return obj;
        }, {});
      case Kind.LIST:
        return ast.values.map((value: any) => JSONScalar.parseLiteral!(value, {}));
      default:
        return null;
    }
  },
});

export const resolvers: IResolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Query: {
    // Notification queries
    async notification(_, { id }) {
      try {
        return await notificationRepository.findOne({
          where: { id },
          relations: ['template', 'group', 'deliveryLogs']
        });
      } catch (error) {
        logger.error('Error fetching notification', { id, error: error.message });
        throw new Error('Failed to fetch notification');
      }
    },

    async notifications(_, { recipientId, channel, status, limit = 50, offset = 0, dateFrom, dateTo }) {
      try {
        const query = notificationRepository.createQueryBuilder('notification')
          .leftJoinAndSelect('notification.template', 'template')
          .leftJoinAndSelect('notification.group', 'group');

        if (recipientId) {
          query.andWhere('notification.recipientId = :recipientId', { recipientId });
        }

        if (channel) {
          query.andWhere('notification.channel = :channel', { channel });
        }

        if (status) {
          query.andWhere('notification.status = :status', { status });
        }

        if (dateFrom) {
          query.andWhere('notification.createdAt >= :dateFrom', { dateFrom });
        }

        if (dateTo) {
          query.andWhere('notification.createdAt <= :dateTo', { dateTo });
        }

        return await query
          .orderBy('notification.createdAt', 'DESC')
          .limit(limit)
          .offset(offset)
          .getMany();
      } catch (error) {
        logger.error('Error fetching notifications', { error: error.message });
        throw new Error('Failed to fetch notifications');
      }
    },

    async userNotifications(_, { userId, channel = 'IN_APP', limit = 50, offset = 0, unreadOnly = false }) {
      try {
        const result = await notificationService.getUserNotifications(
          userId,
          channel,
          limit,
          offset,
          unreadOnly
        );
        return result.notifications;
      } catch (error) {
        logger.error('Error fetching user notifications', { userId, error: error.message });
        throw new Error('Failed to fetch user notifications');
      }
    },

    async notificationStats(_, { dateFrom, dateTo, userId, channel }) {
      try {
        return await notificationService.getStats(dateFrom, dateTo, userId, channel);
      } catch (error) {
        logger.error('Error fetching notification stats', { error: error.message });
        throw new Error('Failed to fetch notification stats');
      }
    },

    // Template queries
    async template(_, { id }) {
      try {
        return await templateRepository.findOne({
          where: { id },
          relations: ['notifications']
        });
      } catch (error) {
        logger.error('Error fetching template', { id, error: error.message });
        throw new Error('Failed to fetch template');
      }
    },

    async templates(_, { channel, type, status, category, limit = 50, offset = 0 }) {
      try {
        const query = templateRepository.createQueryBuilder('template');

        if (channel) {
          query.andWhere('template.channel = :channel', { channel });
        }

        if (type) {
          query.andWhere('template.type = :type', { type });
        }

        if (status) {
          query.andWhere('template.status = :status', { status });
        }

        if (category) {
          query.andWhere('template.category = :category', { category });
        }

        return await query
          .orderBy('template.createdAt', 'DESC')
          .limit(limit)
          .offset(offset)
          .getMany();
      } catch (error) {
        logger.error('Error fetching templates', { error: error.message });
        throw new Error('Failed to fetch templates');
      }
    },

    async templatesByName(_, { name }) {
      try {
        return await templateRepository.find({
          where: { name },
          order: { version: 'DESC' }
        });
      } catch (error) {
        logger.error('Error fetching templates by name', { name, error: error.message });
        throw new Error('Failed to fetch templates by name');
      }
    },

    // Preference queries
    async userPreferences(_, { userId }) {
      try {
        return await preferenceRepository.find({
          where: { userId },
          order: { createdAt: 'DESC' }
        });
      } catch (error) {
        logger.error('Error fetching user preferences', { userId, error: error.message });
        throw new Error('Failed to fetch user preferences');
      }
    },

    async preference(_, { id }) {
      try {
        return await preferenceRepository.findOne({
          where: { id }
        });
      } catch (error) {
        logger.error('Error fetching preference', { id, error: error.message });
        throw new Error('Failed to fetch preference');
      }
    },

    // Group queries
    async group(_, { id }) {
      try {
        return await groupRepository.findOne({
          where: { id },
          relations: ['notifications']
        });
      } catch (error) {
        logger.error('Error fetching group', { id, error: error.message });
        throw new Error('Failed to fetch group');
      }
    },

    async groups(_, { status, type, campaignId, limit = 50, offset = 0 }) {
      try {
        const query = groupRepository.createQueryBuilder('group');

        if (status) {
          query.andWhere('group.status = :status', { status });
        }

        if (type) {
          query.andWhere('group.type = :type', { type });
        }

        if (campaignId) {
          query.andWhere('group.campaignId = :campaignId', { campaignId });
        }

        return await query
          .orderBy('group.createdAt', 'DESC')
          .limit(limit)
          .offset(offset)
          .getMany();
      } catch (error) {
        logger.error('Error fetching groups', { error: error.message });
        throw new Error('Failed to fetch groups');
      }
    },

    // Delivery log queries
    async deliveryLogs(_, { notificationId, status, channel, provider, dateFrom, dateTo, limit = 50, offset = 0 }) {
      try {
        const query = deliveryLogRepository.createQueryBuilder('log')
          .leftJoinAndSelect('log.notification', 'notification');

        if (notificationId) {
          query.andWhere('log.notificationId = :notificationId', { notificationId });
        }

        if (status) {
          query.andWhere('log.status = :status', { status });
        }

        if (channel) {
          query.andWhere('log.channel = :channel', { channel });
        }

        if (provider) {
          query.andWhere('log.provider = :provider', { provider });
        }

        if (dateFrom) {
          query.andWhere('log.createdAt >= :dateFrom', { dateFrom });
        }

        if (dateTo) {
          query.andWhere('log.createdAt <= :dateTo', { dateTo });
        }

        return await query
          .orderBy('log.createdAt', 'DESC')
          .limit(limit)
          .offset(offset)
          .getMany();
      } catch (error) {
        logger.error('Error fetching delivery logs', { error: error.message });
        throw new Error('Failed to fetch delivery logs');
      }
    },

    // Health check
    async healthCheck() {
      try {
        return await deliveryService.healthCheck();
      } catch (error) {
        logger.error('Error performing health check', { error: error.message });
        throw new Error('Failed to perform health check');
      }
    }
  },

  Mutation: {
    // Notification mutations
    async sendNotification(_, { input }) {
      try {
        return await notificationService.sendNotification(input);
      } catch (error) {
        logger.error('Error sending notification', { input, error: error.message });
        throw new Error(`Failed to send notification: ${error.message}`);
      }
    },

    async sendBulkNotifications(_, { input }) {
      try {
        return await notificationService.sendBulkNotifications(input);
      } catch (error) {
        logger.error('Error sending bulk notifications', { input, error: error.message });
        throw new Error(`Failed to send bulk notifications: ${error.message}`);
      }
    },

    async markNotificationAsRead(_, { id, userId }) {
      try {
        await notificationService.markAsRead(id, userId);
        return await notificationRepository.findOne({ where: { id } });
      } catch (error) {
        logger.error('Error marking notification as read', { id, userId, error: error.message });
        throw new Error('Failed to mark notification as read');
      }
    },

    async cancelNotification(_, { id }) {
      try {
        const notification = await notificationRepository.findOne({ where: { id } });
        if (!notification) {
          throw new Error('Notification not found');
        }

        notification.status = 'CANCELLED';
        await notificationRepository.save(notification);
        return notification;
      } catch (error) {
        logger.error('Error cancelling notification', { id, error: error.message });
        throw new Error('Failed to cancel notification');
      }
    },

    async retryNotification(_, { id }) {
      try {
        const notification = await notificationRepository.findOne({ where: { id } });
        if (!notification) {
          throw new Error('Notification not found');
        }

        if (!notification.canRetry) {
          throw new Error('Notification cannot be retried');
        }

        notification.resetForRetry();
        await notificationRepository.save(notification);
        
        // Process the notification
        await notificationService.processNotification(notification);
        
        return notification;
      } catch (error) {
        logger.error('Error retrying notification', { id, error: error.message });
        throw new Error(`Failed to retry notification: ${error.message}`);
      }
    },

    // Template mutations
    async createTemplate(_, { input }) {
      try {
        return await templateService.createTemplate(input);
      } catch (error) {
        logger.error('Error creating template', { input, error: error.message });
        throw new Error(`Failed to create template: ${error.message}`);
      }
    },

    async updateTemplate(_, { id, input }) {
      try {
        return await templateService.updateTemplate(id, input);
      } catch (error) {
        logger.error('Error updating template', { id, input, error: error.message });
        throw new Error(`Failed to update template: ${error.message}`);
      }
    },

    async deleteTemplate(_, { id }) {
      try {
        await templateService.deleteTemplate(id);
        return true;
      } catch (error) {
        logger.error('Error deleting template', { id, error: error.message });
        throw new Error('Failed to delete template');
      }
    },

    async publishTemplate(_, { id }) {
      try {
        const template = await templateRepository.findOne({ where: { id } });
        if (!template) {
          throw new Error('Template not found');
        }

        template.publish();
        await templateRepository.save(template);
        return template;
      } catch (error) {
        logger.error('Error publishing template', { id, error: error.message });
        throw new Error('Failed to publish template');
      }
    },

    async archiveTemplate(_, { id }) {
      try {
        const template = await templateRepository.findOne({ where: { id } });
        if (!template) {
          throw new Error('Template not found');
        }

        template.archive();
        await templateRepository.save(template);
        return template;
      } catch (error) {
        logger.error('Error archiving template', { id, error: error.message });
        throw new Error('Failed to archive template');
      }
    },

    async testTemplate(_, { id, variables, locale = 'en' }) {
      try {
        return await templateService.testTemplate(id, variables, locale);
      } catch (error) {
        logger.error('Error testing template', { id, variables, locale, error: error.message });
        throw new Error(`Failed to test template: ${error.message}`);
      }
    },

    // Preference mutations
    async updateUserPreference(_, { userId, input }) {
      try {
        let preference = await preferenceRepository.findOne({
          where: { 
            userId,
            channel: input.channel,
            type: input.type
          }
        });

        if (!preference) {
          preference = preferenceRepository.create({
            userId,
            channel: input.channel,
            type: input.type,
            ...input
          });
        } else {
          Object.assign(preference, input);
        }

        return await preferenceRepository.save(preference);
      } catch (error) {
        logger.error('Error updating user preference', { userId, input, error: error.message });
        throw new Error('Failed to update user preference');
      }
    },

    async optInUser(_, { userId, channel, type }) {
      try {
        let preference = await preferenceRepository.findOne({
          where: { userId, channel, type }
        });

        if (!preference) {
          preference = preferenceRepository.create({
            userId,
            channel,
            type,
            enabled: true,
            status: 'ACTIVE'
          });
        } else {
          preference.optIn();
        }

        return await preferenceRepository.save(preference);
      } catch (error) {
        logger.error('Error opting in user', { userId, channel, type, error: error.message });
        throw new Error('Failed to opt in user');
      }
    },

    async optOutUser(_, { userId, channel, type, reason }) {
      try {
        let preference = await preferenceRepository.findOne({
          where: { userId, channel, type }
        });

        if (!preference) {
          preference = preferenceRepository.create({
            userId,
            channel,
            type,
            enabled: false,
            status: 'INACTIVE'
          });
        } else {
          preference.optOut(reason);
        }

        return await preferenceRepository.save(preference);
      } catch (error) {
        logger.error('Error opting out user', { userId, channel, type, reason, error: error.message });
        throw new Error('Failed to opt out user');
      }
    },

    async blockUser(_, { userId, reason }) {
      try {
        const preferences = await preferenceRepository.find({
          where: { userId }
        });

        for (const preference of preferences) {
          preference.block(reason);
        }

        await preferenceRepository.save(preferences);
        return preferences[0] || null;
      } catch (error) {
        logger.error('Error blocking user', { userId, reason, error: error.message });
        throw new Error('Failed to block user');
      }
    },

    async updateContactInfo(_, { userId, contactInfo }) {
      try {
        const preferences = await preferenceRepository.find({
          where: { userId }
        });

        for (const preference of preferences) {
          preference.updateContactInfo(contactInfo);
        }

        await preferenceRepository.save(preferences);
        return preferences[0] || null;
      } catch (error) {
        logger.error('Error updating contact info', { userId, contactInfo, error: error.message });
        throw new Error('Failed to update contact info');
      }
    },

    // Group mutations
    async createNotificationGroup(_, { input }) {
      try {
        const group = groupRepository.create(input);
        return await groupRepository.save(group);
      } catch (error) {
        logger.error('Error creating notification group', { input, error: error.message });
        throw new Error('Failed to create notification group');
      }
    },

    async startGroup(_, { id }) {
      try {
        const group = await groupRepository.findOne({ where: { id } });
        if (!group) {
          throw new Error('Group not found');
        }

        group.start();
        await groupRepository.save(group);

        // Start processing
        notificationService.processBulkNotifications(id);

        return group;
      } catch (error) {
        logger.error('Error starting group', { id, error: error.message });
        throw new Error('Failed to start group');
      }
    },

    async pauseGroup(_, { id }) {
      try {
        const group = await groupRepository.findOne({ where: { id } });
        if (!group) {
          throw new Error('Group not found');
        }

        group.pause();
        return await groupRepository.save(group);
      } catch (error) {
        logger.error('Error pausing group', { id, error: error.message });
        throw new Error('Failed to pause group');
      }
    },

    async resumeGroup(_, { id }) {
      try {
        const group = await groupRepository.findOne({ where: { id } });
        if (!group) {
          throw new Error('Group not found');
        }

        group.resume();
        await groupRepository.save(group);

        // Resume processing
        notificationService.processBulkNotifications(id);

        return group;
      } catch (error) {
        logger.error('Error resuming group', { id, error: error.message });
        throw new Error('Failed to resume group');
      }
    },

    async cancelGroup(_, { id, reason }) {
      try {
        const group = await groupRepository.findOne({ where: { id } });
        if (!group) {
          throw new Error('Group not found');
        }

        group.cancel(reason);
        return await groupRepository.save(group);
      } catch (error) {
        logger.error('Error cancelling group', { id, reason, error: error.message });
        throw new Error('Failed to cancel group');
      }
    },

    async approveGroup(_, { id }) {
      try {
        const group = await groupRepository.findOne({ where: { id } });
        if (!group) {
          throw new Error('Group not found');
        }

        group.approve('system'); // In real app, get from context
        return await groupRepository.save(group);
      } catch (error) {
        logger.error('Error approving group', { id, error: error.message });
        throw new Error('Failed to approve group');
      }
    },

    // Delivery mutations
    async processDelivery(_, { notificationId }) {
      try {
        return await deliveryService.processDelivery(notificationId);
      } catch (error) {
        logger.error('Error processing delivery', { notificationId, error: error.message });
        throw new Error('Failed to process delivery');
      }
    },

    async processScheduledNotifications() {
      try {
        await notificationService.processScheduledNotifications();
        return await notificationRepository.count({
          where: { status: 'PENDING' }
        });
      } catch (error) {
        logger.error('Error processing scheduled notifications', { error: error.message });
        throw new Error('Failed to process scheduled notifications');
      }
    },

    async processRetryQueue() {
      try {
        await notificationService.retryFailedNotifications();
        return await notificationRepository.count({
          where: { status: 'FAILED' }
        });
      } catch (error) {
        logger.error('Error processing retry queue', { error: error.message });
        throw new Error('Failed to process retry queue');
      }
    },

    // Webhook handling
    async handleWebhook(_, { provider, data }) {
      try {
        // Route to appropriate service based on provider
        switch (provider.toLowerCase()) {
          case 'sendgrid':
            // await emailService.handleSendGridWebhook(data);
            break;
          case 'twilio':
            // await smsService.handleTwilioWebhook(data);
            break;
          case 'firebase':
            // Handle Firebase webhooks
            break;
          default:
            logger.warn('Unknown webhook provider', { provider });
        }
        return true;
      } catch (error) {
        logger.error('Error handling webhook', { provider, error: error.message });
        throw new Error('Failed to handle webhook');
      }
    }
  },

  // Field resolvers for computed properties
  Notification: {
    isScheduled: (notification) => notification.isScheduled,
    isOverdue: (notification) => notification.isOverdue,
    canRetry: (notification) => notification.canRetry,
    isDelivered: (notification) => notification.isDelivered,
    isRead: (notification) => notification.isRead,
  },

  NotificationTemplate: {
    isActive: (template) => template.isActive,
    isDraft: (template) => template.isDraft,
    isPublished: (template) => template.isPublished,
    supportedLocales: (template) => template.supportedLocales,
  },

  NotificationPreference: {
    isOptedIn: (preference) => preference.isOptedIn,
    isOptedOut: (preference) => preference.isOptedOut,
    isBlocked: (preference) => preference.isBlocked,
  },

  NotificationGroup: {
    isDraft: (group) => group.isDraft,
    isScheduled: (group) => group.isScheduled,
    isProcessing: (group) => group.isProcessing,
    isCompleted: (group) => group.isCompleted,
    isCancelled: (group) => group.isCancelled,
    isPaused: (group) => group.isPaused,
    isActive: (group) => group.isActive,
    isFinished: (group) => group.isFinished,
    canStart: (group) => group.canStart,
    canPause: (group) => group.canPause,
    canResume: (group) => group.canResume,
    canCancel: (group) => group.canCancel,
    progress: (group) => group.progress,
    estimatedCompletion: (group) => group.estimatedCompletion,
  },

  DeliveryLog: {
    isSuccessful: (log) => log.isSuccessful,
    isFailed: (log) => log.isFailed,
    isPending: (log) => log.isPending,
    isDeferred: (log) => log.isDeferred,
    hasEngagement: (log) => log.hasEngagement,
    deliveryDuration: (log) => log.deliveryDuration,
    totalDuration: (log) => log.totalDuration,
  },

  // Subscription resolvers (would require subscription server setup)
  Subscription: {
    notificationUpdated: {
      // subscribe: () => pubsub.asyncIterator(['NOTIFICATION_UPDATED']),
    },
    groupStatusChanged: {
      // subscribe: () => pubsub.asyncIterator(['GROUP_STATUS_CHANGED']),
    },
    deliveryStatusChanged: {
      // subscribe: () => pubsub.asyncIterator(['DELIVERY_STATUS_CHANGED']),
    },
  },
};
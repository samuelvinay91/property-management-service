import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from './logger';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  templateId?: string;
  templateData?: Record<string, any>;
  channels?: string[];
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export interface BulkNotificationPayload {
  userIds: string[];
  title: string;
  message: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  templateId?: string;
  templateData?: Record<string, any>;
  channels?: string[];
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  success: boolean;
  notificationId?: string;
  message?: string;
  error?: string;
}

export interface NotificationStatus {
  notificationId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
}

export class NotificationClient {
  private client: AxiosInstance;
  private logger: Logger;
  private serviceName: string;

  constructor(serviceName: string, options: {
    baseURL?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}) {
    this.serviceName = serviceName;
    this.logger = new Logger({ serviceName: `${serviceName}-NotificationClient` });

    const baseURL = options.baseURL || 
                   process.env.NOTIFICATION_SERVICE_URL || 
                   'http://notification-service:3006';

    this.client = axios.create({
      baseURL,
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': serviceName
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const traceId = `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        config.headers['X-Trace-ID'] = traceId;
        
        this.logger.debug('Notification API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          traceId
        });
        
        return config;
      },
      (error) => {
        this.logger.error('Notification API request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('Notification API response', {
          status: response.status,
          traceId: response.config.headers['X-Trace-ID']
        });
        return response;
      },
      async (error) => {
        const traceId = error.config?.headers['X-Trace-ID'];
        
        this.logger.error('Notification API error', error, {
          status: error.response?.status,
          traceId,
          responseData: error.response?.data
        });

        // Retry logic for specific errors
        if (this.shouldRetry(error) && error.config && !error.config._retryCount) {
          error.config._retryCount = 1;
          
          this.logger.info('Retrying notification API request', { traceId });
          
          await this.delay(1000); // 1 second delay
          return this.client.request(error.config);
        }

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Send single notification
  async sendNotification(payload: NotificationPayload): Promise<NotificationResponse> {
    try {
      this.logger.logBusinessEvent('notification_send_requested', {
        userId: payload.userId,
        type: payload.type,
        priority: payload.priority
      });

      const response = await this.client.post('/api/notifications/send', payload);
      
      this.logger.logBusinessEvent('notification_sent', {
        userId: payload.userId,
        notificationId: response.data.notificationId,
        type: payload.type
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to send notification', error, {
        userId: payload.userId,
        type: payload.type
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(payload: BulkNotificationPayload): Promise<NotificationResponse> {
    try {
      this.logger.logBusinessEvent('bulk_notification_send_requested', {
        userCount: payload.userIds.length,
        type: payload.type,
        priority: payload.priority
      });

      const response = await this.client.post('/api/notifications/send-bulk', payload);
      
      this.logger.logBusinessEvent('bulk_notification_sent', {
        userCount: payload.userIds.length,
        notificationId: response.data.notificationId,
        type: payload.type
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to send bulk notifications', error, {
        userCount: payload.userIds.length,
        type: payload.type
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get notification status
  async getNotificationStatus(notificationId: string): Promise<NotificationStatus | null> {
    try {
      const response = await this.client.get(`/api/notifications/${notificationId}/status`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get notification status', error, { notificationId });
      return null;
    }
  }

  // Send email specifically
  async sendEmail(
    userId: string,
    subject: string,
    content: string,
    templateId?: string,
    templateData?: Record<string, any>
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      userId,
      title: subject,
      message: content,
      type: 'email',
      priority: 'normal',
      templateId,
      templateData
    });
  }

  // Send SMS specifically
  async sendSMS(
    userId: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      userId,
      title: 'SMS Notification',
      message,
      type: 'sms',
      priority
    });
  }

  // Send push notification specifically
  async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      userId,
      title,
      message,
      type: 'push',
      priority: 'normal',
      metadata
    });
  }

  // Send in-app notification specifically
  async sendInAppNotification(
    userId: string,
    title: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    metadata?: Record<string, any>
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      userId,
      title,
      message,
      type: 'in_app',
      priority,
      metadata
    });
  }

  // Business-specific notification methods
  async sendWelcomeEmail(userId: string, userName: string): Promise<NotificationResponse> {
    return this.sendEmail(
      userId,
      'Welcome to Rentova!',
      `Welcome ${userName}! We're excited to have you on board.`,
      'welcome_email',
      { userName }
    );
  }

  async sendPasswordResetEmail(userId: string, resetToken: string): Promise<NotificationResponse> {
    return this.sendEmail(
      userId,
      'Password Reset Request',
      'You have requested a password reset.',
      'password_reset_email',
      { resetToken }
    );
  }

  async sendPaymentConfirmation(userId: string, amount: number, propertyName: string): Promise<NotificationResponse> {
    return this.sendEmail(
      userId,
      'Payment Confirmation',
      `Your payment of $${amount} for ${propertyName} has been confirmed.`,
      'payment_confirmation_email',
      { amount, propertyName }
    );
  }

  async sendMaintenanceUpdate(
    userId: string, 
    requestId: string, 
    status: string
  ): Promise<NotificationResponse> {
    return this.sendInAppNotification(
      userId,
      'Maintenance Update',
      `Your maintenance request #${requestId} status has been updated to: ${status}`,
      'normal',
      { requestId, status }
    );
  }

  async sendRentReminder(userId: string, amount: number, dueDate: Date): Promise<NotificationResponse> {
    const formattedDate = dueDate.toLocaleDateString();
    return this.sendEmail(
      userId,
      'Rent Payment Reminder',
      `Your rent payment of $${amount} is due on ${formattedDate}.`,
      'rent_reminder_email',
      { amount, dueDate: formattedDate }
    );
  }

  async sendLeaseExpiration(userId: string, propertyName: string, expirationDate: Date): Promise<NotificationResponse> {
    const formattedDate = expirationDate.toLocaleDateString();
    return this.sendEmail(
      userId,
      'Lease Expiration Notice',
      `Your lease for ${propertyName} expires on ${formattedDate}.`,
      'lease_expiration_email',
      { propertyName, expirationDate: formattedDate }
    );
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      this.logger.error('Notification service health check failed', error);
      return false;
    }
  }
}

// Create service-specific clients
export const createNotificationClient = (serviceName: string): NotificationClient => {
  return new NotificationClient(serviceName);
};

// Export singleton clients for common services
export const authNotificationClient = new NotificationClient('AuthService');
export const propertyNotificationClient = new NotificationClient('PropertyService');
export const tenantNotificationClient = new NotificationClient('TenantService');
export const paymentNotificationClient = new NotificationClient('PaymentService');
export const maintenanceNotificationClient = new NotificationClient('MaintenanceService');
export const bookingNotificationClient = new NotificationClient('BookingService');

export default NotificationClient;
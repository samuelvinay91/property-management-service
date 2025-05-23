import sgMail from '@sendgrid/mail';
import { SES } from 'aws-sdk';
import { DeliveryLog, DeliveryStatus, DeliveryProvider } from '../entities/DeliveryLog';
import { Logger } from '../utils/logger';

export interface EmailRequest {
  to: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  content: string;
  htmlContent?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition?: string;
  }>;
  templateId?: string;
  templateData?: Record<string, any>;
  customHeaders?: Record<string, string>;
  metadata?: Record<string, any>;
  trackOpens?: boolean;
  trackClicks?: boolean;
  unsubscribeGroup?: string;
  categories?: string[];
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: DeliveryProvider;
}

export interface EmailProvider {
  name: DeliveryProvider;
  send(request: EmailRequest): Promise<EmailResponse>;
  isAvailable(): boolean;
  getCredits(): Promise<number>;
}

export class SendGridProvider implements EmailProvider {
  name = DeliveryProvider.SENDGRID;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SendGridProvider');
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async send(request: EmailRequest): Promise<EmailResponse> {
    try {
      const msg: any = {
        to: request.to,
        from: {
          email: request.from || process.env.DEFAULT_FROM_EMAIL,
          name: request.fromName || process.env.DEFAULT_FROM_NAME
        },
        subject: request.subject,
        text: request.content,
        html: request.htmlContent || request.content,
        replyTo: request.replyTo,
        attachments: request.attachments,
        customArgs: request.metadata,
        categories: request.categories,
        trackingSettings: {
          clickTracking: {
            enable: request.trackClicks !== false
          },
          openTracking: {
            enable: request.trackOpens !== false
          }
        }
      };

      if (request.customHeaders) {
        msg.headers = request.customHeaders;
      }

      if (request.templateId) {
        msg.templateId = request.templateId;
        msg.dynamicTemplateData = request.templateData;
      }

      if (request.unsubscribeGroup) {
        msg.asm = {
          groupId: parseInt(request.unsubscribeGroup)
        };
      }

      const [response] = await sgMail.send(msg);

      this.logger.info('Email sent via SendGrid', {
        to: request.to,
        messageId: response.headers['x-message-id'],
        statusCode: response.statusCode
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'],
        provider: this.name
      };

    } catch (error: any) {
      this.logger.error('SendGrid email failed', {
        to: request.to,
        error: error.message,
        code: error.code,
        response: error.response?.body
      });

      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }

  isAvailable(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  async getCredits(): Promise<number> {
    // SendGrid doesn't have a direct credits API
    // Return a default value or implement API call
    return 1000000;
  }
}

export class AWSProvider implements EmailProvider {
  name = DeliveryProvider.AWS_SES;
  private ses: SES;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('AWSProvider');
    this.ses = new SES({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }

  async send(request: EmailRequest): Promise<EmailResponse> {
    try {
      const params: SES.SendEmailRequest = {
        Source: request.from || process.env.DEFAULT_FROM_EMAIL!,
        Destination: {
          ToAddresses: [request.to]
        },
        Message: {
          Subject: {
            Data: request.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Text: {
              Data: request.content,
              Charset: 'UTF-8'
            }
          }
        },
        ReplyToAddresses: request.replyTo ? [request.replyTo] : undefined,
        Tags: request.metadata ? Object.entries(request.metadata).map(([key, value]) => ({
          Name: key,
          Value: String(value)
        })) : undefined
      };

      if (request.htmlContent) {
        params.Message.Body.Html = {
          Data: request.htmlContent,
          Charset: 'UTF-8'
        };
      }

      const result = await this.ses.sendEmail(params).promise();

      this.logger.info('Email sent via AWS SES', {
        to: request.to,
        messageId: result.MessageId
      });

      return {
        success: true,
        messageId: result.MessageId,
        provider: this.name
      };

    } catch (error: any) {
      this.logger.error('AWS SES email failed', {
        to: request.to,
        error: error.message,
        code: error.code
      });

      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }

  isAvailable(): boolean {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  }

  async getCredits(): Promise<number> {
    try {
      const quota = await this.ses.getSendQuota().promise();
      return quota.Max24HourSend || 0;
    } catch {
      return 0;
    }
  }
}

export class EmailService {
  private providers: EmailProvider[];
  private logger: Logger;
  private circuitBreaker: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }>;

  constructor() {
    this.logger = new Logger('EmailService');
    this.providers = [
      new SendGridProvider(),
      new AWSProvider()
    ].filter(provider => provider.isAvailable());

    this.circuitBreaker = new Map();

    if (this.providers.length === 0) {
      this.logger.warn('No email providers configured');
    }
  }

  async sendEmail(request: EmailRequest): Promise<boolean> {
    if (this.providers.length === 0) {
      throw new Error('No email providers available');
    }

    const startTime = Date.now();
    
    // Try each provider in order
    for (const provider of this.providers) {
      if (this.isCircuitBreakerOpen(provider.name)) {
        this.logger.warn('Circuit breaker open for provider', { provider: provider.name });
        continue;
      }

      try {
        const response = await provider.send(request);
        
        if (response.success) {
          this.resetCircuitBreaker(provider.name);
          
          const duration = Date.now() - startTime;
          this.logger.info('Email sent successfully', {
            provider: provider.name,
            to: request.to,
            messageId: response.messageId,
            duration
          });

          // Track delivery metrics
          await this.trackDelivery(request, response, duration);
          
          return true;
        } else {
          this.recordFailure(provider.name);
          this.logger.warn('Email failed with provider', {
            provider: provider.name,
            error: response.error
          });
        }

      } catch (error: any) {
        this.recordFailure(provider.name);
        this.logger.error('Email provider threw exception', {
          provider: provider.name,
          error: error.message
        });
      }
    }

    // All providers failed
    const duration = Date.now() - startTime;
    this.logger.error('All email providers failed', {
      to: request.to,
      providersAttempted: this.providers.length,
      duration
    });

    return false;
  }

  async sendBulkEmails(requests: EmailRequest[], batchSize: number = 10): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 };
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const promises = batch.map(async (request) => {
        try {
          const success = await this.sendEmail(request);
          return success;
        } catch (error) {
          this.logger.error('Bulk email failed', {
            to: request.to,
            error: error.message
          });
          return false;
        }
      });

      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.success++;
        } else {
          results.failed++;
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < requests.length) {
        await this.delay(100);
      }
    }

    this.logger.info('Bulk email completed', {
      total: requests.length,
      success: results.success,
      failed: results.failed
    });

    return results;
  }

  async validateEmailAddress(email: string): Promise<boolean> {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional validation could include:
    // - DNS MX record lookup
    // - SMTP verification
    // - Known disposable email detection
    
    return true;
  }

  async getProviderStats(): Promise<Array<{ provider: string; available: boolean; credits: number; failures: number }>> {
    const stats = [];

    for (const provider of this.providers) {
      const circuitState = this.circuitBreaker.get(provider.name);
      
      stats.push({
        provider: provider.name,
        available: provider.isAvailable() && !this.isCircuitBreakerOpen(provider.name),
        credits: await provider.getCredits(),
        failures: circuitState?.failures || 0
      });
    }

    return stats;
  }

  private isCircuitBreakerOpen(providerName: string): boolean {
    const state = this.circuitBreaker.get(providerName);
    if (!state) return false;

    const now = new Date();
    const timeSinceLastFailure = now.getTime() - state.lastFailure.getTime();
    const resetTimeMs = 5 * 60 * 1000; // 5 minutes

    // Reset circuit breaker after timeout
    if (state.isOpen && timeSinceLastFailure > resetTimeMs) {
      state.isOpen = false;
      state.failures = 0;
      return false;
    }

    return state.isOpen;
  }

  private recordFailure(providerName: string): void {
    const state = this.circuitBreaker.get(providerName) || { failures: 0, lastFailure: new Date(), isOpen: false };
    
    state.failures++;
    state.lastFailure = new Date();
    
    // Open circuit breaker after 3 failures
    if (state.failures >= 3) {
      state.isOpen = true;
      this.logger.warn('Circuit breaker opened for provider', { provider: providerName });
    }

    this.circuitBreaker.set(providerName, state);
  }

  private resetCircuitBreaker(providerName: string): void {
    this.circuitBreaker.delete(providerName);
  }

  private async trackDelivery(request: EmailRequest, response: EmailResponse, duration: number): Promise<void> {
    // This would typically create a DeliveryLog record
    // For now, just log the metrics
    this.logger.info('Email delivery tracked', {
      provider: response.provider,
      messageId: response.messageId,
      duration,
      recipient: request.to
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Webhook handlers for provider notifications
  async handleSendGridWebhook(events: any[]): Promise<void> {
    for (const event of events) {
      await this.processDeliveryEvent({
        messageId: event.sg_message_id,
        status: this.mapSendGridEventToStatus(event.event),
        timestamp: new Date(event.timestamp * 1000),
        reason: event.reason,
        bounceClassification: event.bounce_classification,
        userAgent: event['user-agent'],
        ip: event.ip,
        url: event.url
      });
    }
  }

  async handleAWSWebhook(event: any): Promise<void> {
    // Handle AWS SES notifications
    const message = JSON.parse(event.Message);
    
    await this.processDeliveryEvent({
      messageId: message.mail.messageId,
      status: this.mapAWSEventToStatus(message.eventType),
      timestamp: new Date(message.timestamp),
      reason: message.bounce?.bouncedRecipients?.[0]?.diagnosticCode,
      bounceClassification: message.bounce?.bounceType
    });
  }

  private async processDeliveryEvent(event: any): Promise<void> {
    this.logger.info('Processing delivery event', {
      messageId: event.messageId,
      status: event.status
    });

    // Update notification and delivery log records
    // This would involve database updates
  }

  private mapSendGridEventToStatus(event: string): DeliveryStatus {
    const mapping: Record<string, DeliveryStatus> = {
      'processed': DeliveryStatus.SENT,
      'delivered': DeliveryStatus.DELIVERED,
      'open': DeliveryStatus.OPENED,
      'click': DeliveryStatus.CLICKED,
      'bounce': DeliveryStatus.BOUNCED,
      'dropped': DeliveryStatus.FAILED,
      'deferred': DeliveryStatus.DEFERRED,
      'unsubscribe': DeliveryStatus.UNSUBSCRIBED,
      'spamreport': DeliveryStatus.COMPLAINED
    };

    return mapping[event] || DeliveryStatus.FAILED;
  }

  private mapAWSEventToStatus(eventType: string): DeliveryStatus {
    const mapping: Record<string, DeliveryStatus> = {
      'send': DeliveryStatus.SENT,
      'delivery': DeliveryStatus.DELIVERED,
      'bounce': DeliveryStatus.BOUNCED,
      'complaint': DeliveryStatus.COMPLAINED,
      'reject': DeliveryStatus.REJECTED
    };

    return mapping[eventType] || DeliveryStatus.FAILED;
  }
}
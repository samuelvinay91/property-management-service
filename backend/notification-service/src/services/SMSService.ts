import { Twilio } from 'twilio';
import { DeliveryProvider } from '../entities/DeliveryLog';
import { Logger } from '../utils/logger';

export interface SMSRequest {
  to: string;
  message: string;
  from?: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
  maxPrice?: string;
  validityPeriod?: number;
  statusCallback?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: DeliveryProvider;
  cost?: number;
  segments?: number;
}

export interface SMSProvider {
  name: DeliveryProvider;
  send(request: SMSRequest): Promise<SMSResponse>;
  isAvailable(): boolean;
  getBalance(): Promise<number>;
  validatePhoneNumber(phoneNumber: string): Promise<{ valid: boolean; formatted?: string; carrier?: string; type?: string }>;
}

export class TwilioProvider implements SMSProvider {
  name = DeliveryProvider.TWILIO;
  private client: Twilio;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TwilioProvider');
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
    }
  }

  async send(request: SMSRequest): Promise<SMSResponse> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const messageRequest: any = {
        body: request.message,
        from: request.from || process.env.TWILIO_PHONE_NUMBER,
        to: request.to,
        mediaUrl: request.mediaUrls,
        maxPrice: request.maxPrice,
        validityPeriod: request.validityPeriod,
        statusCallback: request.statusCallback
      };

      const message = await this.client.messages.create(messageRequest);

      this.logger.info('SMS sent via Twilio', {
        to: request.to,
        messageId: message.sid,
        status: message.status,
        segments: message.numSegments
      });

      return {
        success: true,
        messageId: message.sid,
        provider: this.name,
        cost: parseFloat(message.price || '0'),
        segments: parseInt(message.numSegments || '1')
      };

    } catch (error: any) {
      this.logger.error('Twilio SMS failed', {
        to: request.to,
        error: error.message,
        code: error.code,
        moreInfo: error.moreInfo
      });

      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }

  isAvailable(): boolean {
    return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  }

  async getBalance(): Promise<number> {
    try {
      if (!this.client) return 0;
      
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return parseFloat(account.balance || '0');
    } catch (error) {
      this.logger.error('Failed to get Twilio balance', { error: error.message });
      return 0;
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<{ valid: boolean; formatted?: string; carrier?: string; type?: string }> {
    try {
      if (!this.client) {
        return { valid: false };
      }

      const lookup = await this.client.lookups.v1.phoneNumbers(phoneNumber).fetch({
        type: ['carrier'],
        countryCode: 'US'
      });

      return {
        valid: true,
        formatted: lookup.phoneNumber,
        carrier: lookup.carrier?.name,
        type: lookup.carrier?.type
      };

    } catch (error: any) {
      this.logger.warn('Phone number validation failed', {
        phoneNumber,
        error: error.message
      });

      return { valid: false };
    }
  }
}

export class SMSService {
  private providers: SMSProvider[];
  private logger: Logger;
  private circuitBreaker: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }>;
  private rateLimiter: Map<string, { count: number; resetTime: Date }>;

  constructor() {
    this.logger = new Logger('SMSService');
    this.providers = [
      new TwilioProvider()
    ].filter(provider => provider.isAvailable());

    this.circuitBreaker = new Map();
    this.rateLimiter = new Map();

    if (this.providers.length === 0) {
      this.logger.warn('No SMS providers configured');
    }
  }

  async sendSMS(request: SMSRequest): Promise<boolean> {
    if (this.providers.length === 0) {
      throw new Error('No SMS providers available');
    }

    // Validate phone number format
    if (!this.isValidPhoneNumber(request.to)) {
      throw new Error('Invalid phone number format');
    }

    // Check rate limits
    if (!this.checkRateLimit(request.to)) {
      throw new Error('Rate limit exceeded for phone number');
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
          this.incrementRateLimit(request.to);
          
          const duration = Date.now() - startTime;
          this.logger.info('SMS sent successfully', {
            provider: provider.name,
            to: request.to,
            messageId: response.messageId,
            cost: response.cost,
            segments: response.segments,
            duration
          });

          // Track delivery metrics
          await this.trackDelivery(request, response, duration);
          
          return true;
        } else {
          this.recordFailure(provider.name);
          this.logger.warn('SMS failed with provider', {
            provider: provider.name,
            error: response.error
          });
        }

      } catch (error: any) {
        this.recordFailure(provider.name);
        this.logger.error('SMS provider threw exception', {
          provider: provider.name,
          error: error.message
        });
      }
    }

    // All providers failed
    const duration = Date.now() - startTime;
    this.logger.error('All SMS providers failed', {
      to: request.to,
      providersAttempted: this.providers.length,
      duration
    });

    return false;
  }

  async sendBulkSMS(requests: SMSRequest[], batchSize: number = 5, delayMs: number = 1000): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 };
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const promises = batch.map(async (request) => {
        try {
          const success = await this.sendSMS(request);
          return success;
        } catch (error) {
          this.logger.error('Bulk SMS failed', {
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

      // Delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await this.delay(delayMs);
      }
    }

    this.logger.info('Bulk SMS completed', {
      total: requests.length,
      success: results.success,
      failed: results.failed
    });

    return results;
  }

  async validatePhoneNumber(phoneNumber: string): Promise<{ valid: boolean; formatted?: string; carrier?: string; type?: string }> {
    // Try validation with available providers
    for (const provider of this.providers) {
      try {
        const result = await provider.validatePhoneNumber(phoneNumber);
        if (result.valid) {
          return result;
        }
      } catch (error) {
        this.logger.warn('Phone validation failed with provider', {
          provider: provider.name,
          error: error.message
        });
      }
    }

    // Fallback to basic validation
    return {
      valid: this.isValidPhoneNumber(phoneNumber),
      formatted: this.formatPhoneNumber(phoneNumber)
    };
  }

  async getProviderStats(): Promise<Array<{ provider: string; available: boolean; balance: number; failures: number }>> {
    const stats = [];

    for (const provider of this.providers) {
      const circuitState = this.circuitBreaker.get(provider.name);
      
      stats.push({
        provider: provider.name,
        available: provider.isAvailable() && !this.isCircuitBreakerOpen(provider.name),
        balance: await provider.getBalance(),
        failures: circuitState?.failures || 0
      });
    }

    return stats;
  }

  async estimateCost(message: string, recipientCount: number): Promise<{ totalCost: number; costPerMessage: number; segments: number }> {
    // SMS cost estimation (simplified)
    const segments = Math.ceil(message.length / 160);
    const costPerSegment = 0.0075; // $0.0075 per segment (Twilio US pricing)
    const costPerMessage = segments * costPerSegment;
    const totalCost = costPerMessage * recipientCount;

    return {
      totalCost,
      costPerMessage,
      segments
    };
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleaned);
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Basic E.164 formatting
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned; // Add US country code
    }
    
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  private checkRateLimit(phoneNumber: string): boolean {
    const key = phoneNumber;
    const limit = this.rateLimiter.get(key);
    const now = new Date();

    if (!limit) {
      return true;
    }

    // Reset counter if it's a new hour
    if (now >= limit.resetTime) {
      this.rateLimiter.delete(key);
      return true;
    }

    // Check if under rate limit (e.g., 10 SMS per hour per number)
    return limit.count < 10;
  }

  private incrementRateLimit(phoneNumber: string): void {
    const key = phoneNumber;
    const now = new Date();
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000); // Reset in 1 hour

    const current = this.rateLimiter.get(key);
    if (current && now < current.resetTime) {
      current.count++;
    } else {
      this.rateLimiter.set(key, { count: 1, resetTime });
    }
  }

  private isCircuitBreakerOpen(providerName: string): boolean {
    const state = this.circuitBreaker.get(providerName);
    if (!state) return false;

    const now = new Date();
    const timeSinceLastFailure = now.getTime() - state.lastFailure.getTime();
    const resetTimeMs = 10 * 60 * 1000; // 10 minutes

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
    
    // Open circuit breaker after 5 failures
    if (state.failures >= 5) {
      state.isOpen = true;
      this.logger.warn('Circuit breaker opened for SMS provider', { provider: providerName });
    }

    this.circuitBreaker.set(providerName, state);
  }

  private resetCircuitBreaker(providerName: string): void {
    this.circuitBreaker.delete(providerName);
  }

  private async trackDelivery(request: SMSRequest, response: SMSResponse, duration: number): Promise<void> {
    // This would typically create a DeliveryLog record
    this.logger.info('SMS delivery tracked', {
      provider: response.provider,
      messageId: response.messageId,
      duration,
      recipient: request.to,
      cost: response.cost,
      segments: response.segments
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Webhook handlers for provider notifications
  async handleTwilioWebhook(data: any): Promise<void> {
    const messageId = data.MessageSid;
    const status = this.mapTwilioStatusToDeliveryStatus(data.MessageStatus);
    const errorCode = data.ErrorCode;
    const errorMessage = data.ErrorMessage;

    this.logger.info('Processing Twilio webhook', {
      messageId,
      status,
      errorCode,
      errorMessage
    });

    // Update delivery records in database
    await this.processDeliveryEvent({
      messageId,
      status,
      timestamp: new Date(),
      errorCode,
      errorMessage,
      provider: DeliveryProvider.TWILIO
    });
  }

  private mapTwilioStatusToDeliveryStatus(status: string): string {
    const mapping: Record<string, string> = {
      'queued': 'pending',
      'sending': 'processing',
      'sent': 'sent',
      'delivered': 'delivered',
      'undelivered': 'failed',
      'failed': 'failed'
    };

    return mapping[status] || 'failed';
  }

  private async processDeliveryEvent(event: any): Promise<void> {
    this.logger.info('Processing SMS delivery event', {
      messageId: event.messageId,
      status: event.status,
      provider: event.provider
    });

    // Update notification and delivery log records
    // This would involve database updates
  }

  // Utility methods for message optimization
  optimizeMessage(message: string, maxLength: number = 160): { optimized: string; segments: number; savings: number } {
    let optimized = message;
    const original = message;

    // Replace common long phrases with shorter alternatives
    const replacements: Record<string, string> = {
      'your property': 'your prop',
      'maintenance': 'maint',
      'appointment': 'appt',
      'management': 'mgmt',
      'information': 'info',
      'application': 'app',
      'regarding': 're:',
      'please contact': 'contact',
      'as soon as possible': 'ASAP'
    };

    for (const [long, short] of Object.entries(replacements)) {
      optimized = optimized.replace(new RegExp(long, 'gi'), short);
    }

    // Remove unnecessary spaces
    optimized = optimized.replace(/\s+/g, ' ').trim();

    const originalSegments = Math.ceil(original.length / maxLength);
    const optimizedSegments = Math.ceil(optimized.length / maxLength);
    const savings = originalSegments - optimizedSegments;

    return {
      optimized,
      segments: optimizedSegments,
      savings
    };
  }

  // Check for spam keywords that might cause delivery issues
  checkSpamRisk(message: string): { risk: 'low' | 'medium' | 'high'; flags: string[] } {
    const spamKeywords = [
      'urgent', 'act now', 'limited time', 'free', 'winner', 'congratulations',
      'click here', 'call now', 'don\'t miss', 'hurry', 'instant', 'guarantee'
    ];

    const flags: string[] = [];
    const lowerMessage = message.toLowerCase();

    for (const keyword of spamKeywords) {
      if (lowerMessage.includes(keyword)) {
        flags.push(keyword);
      }
    }

    let risk: 'low' | 'medium' | 'high' = 'low';
    if (flags.length >= 3) {
      risk = 'high';
    } else if (flags.length >= 1) {
      risk = 'medium';
    }

    return { risk, flags };
  }
}
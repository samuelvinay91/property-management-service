import admin from 'firebase-admin';
import apn from 'apn';
import { OneSignal } from '@onesignal/node-onesignal';
import { DeliveryProvider } from '../entities/DeliveryLog';
import { Logger } from '../utils/logger';

export interface PushRequest {
  deviceToken?: string;
  deviceTokens?: string[];
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
  clickAction?: string;
  category?: string;
  ttl?: number; // Time to live in seconds
  priority?: 'normal' | 'high';
  collapseKey?: string;
  channelId?: string;
  metadata?: Record<string, any>;
}

export interface PushResponse {
  success: boolean;
  messageId?: string;
  failedTokens?: string[];
  error?: string;
  provider: DeliveryProvider;
  deliveredCount?: number;
  failedCount?: number;
}

export interface PushProvider {
  name: DeliveryProvider;
  send(request: PushRequest): Promise<PushResponse>;
  isAvailable(): boolean;
  validateToken(token: string): boolean;
  getStats(): Promise<{ sent: number; delivered: number; failed: number }>;
}

export class FirebaseProvider implements PushProvider {
  name = DeliveryProvider.FIREBASE;
  private app: admin.app.App | null = null;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('FirebaseProvider');
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (serviceAccountPath || serviceAccountKey) {
        const credential = serviceAccountPath 
          ? admin.credential.cert(serviceAccountPath)
          : admin.credential.cert(JSON.parse(serviceAccountKey!));

        this.app = admin.initializeApp({
          credential,
          projectId: process.env.FIREBASE_PROJECT_ID
        }, 'notification-service');

        this.logger.info('Firebase initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase', { error: error.message });
    }
  }

  async send(request: PushRequest): Promise<PushResponse> {
    try {
      if (!this.app) {
        throw new Error('Firebase not initialized');
      }

      const messaging = admin.messaging(this.app);
      const tokens = this.getTargetTokens(request);

      if (tokens.length === 0) {
        throw new Error('No device tokens provided');
      }

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: request.title,
          body: request.body,
          imageUrl: request.image
        },
        data: request.data ? this.stringifyData(request.data) : undefined,
        android: {
          priority: request.priority === 'high' ? 'high' : 'normal',
          ttl: request.ttl ? request.ttl * 1000 : undefined,
          collapseKey: request.collapseKey,
          notification: {
            channelId: request.channelId || 'default',
            icon: request.icon,
            sound: request.sound || 'default',
            clickAction: request.clickAction,
            badge: request.badge
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: request.title,
                body: request.body
              },
              badge: request.badge,
              sound: request.sound || 'default',
              category: request.category,
              'content-available': 1
            }
          },
          headers: {
            'apns-priority': request.priority === 'high' ? '10' : '5',
            'apns-expiration': request.ttl ? String(Math.floor(Date.now() / 1000) + request.ttl) : undefined,
            'apns-collapse-id': request.collapseKey
          }
        },
        webpush: {
          notification: {
            title: request.title,
            body: request.body,
            icon: request.icon,
            image: request.image,
            badge: request.badge
          },
          headers: {
            TTL: request.ttl ? String(request.ttl) : '3600'
          }
        }
      };

      const response = await messaging.sendMulticast(message);

      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          this.logger.warn('Push notification failed for token', {
            token: tokens[idx],
            error: resp.error?.message
          });
        }
      });

      this.logger.info('Firebase push notifications sent', {
        total: tokens.length,
        successful: response.successCount,
        failed: response.failureCount
      });

      return {
        success: response.successCount > 0,
        provider: this.name,
        deliveredCount: response.successCount,
        failedCount: response.failureCount,
        failedTokens
      };

    } catch (error: any) {
      this.logger.error('Firebase push notification failed', {
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
    return this.app !== null;
  }

  validateToken(token: string): boolean {
    // Basic FCM token validation
    return /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(token) || 
           /^[a-zA-Z0-9_-]{140,}$/.test(token);
  }

  async getStats(): Promise<{ sent: number; delivered: number; failed: number }> {
    // Firebase doesn't provide direct stats API
    // This would typically be tracked in your own database
    return { sent: 0, delivered: 0, failed: 0 };
  }

  private getTargetTokens(request: PushRequest): string[] {
    const tokens: string[] = [];

    if (request.deviceToken) {
      tokens.push(request.deviceToken);
    }

    if (request.deviceTokens) {
      tokens.push(...request.deviceTokens);
    }

    // Remove duplicates and invalid tokens
    return [...new Set(tokens)].filter(token => this.validateToken(token));
  }

  private stringifyData(data: Record<string, any>): Record<string, string> {
    const stringData: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    return stringData;
  }
}

export class APNSProvider implements PushProvider {
  name = DeliveryProvider.APNS;
  private provider: apn.Provider | null = null;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('APNSProvider');
    this.initializeAPNS();
  }

  private initializeAPNS(): void {
    try {
      const keyPath = process.env.APNS_KEY_PATH;
      const keyString = process.env.APNS_KEY;
      const keyId = process.env.APNS_KEY_ID;
      const teamId = process.env.APNS_TEAM_ID;

      if ((keyPath || keyString) && keyId && teamId) {
        const options: apn.ProviderOptions = {
          token: {
            key: keyString || keyPath!,
            keyId,
            teamId
          },
          production: process.env.NODE_ENV === 'production'
        };

        this.provider = new apn.Provider(options);
        this.logger.info('APNS initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize APNS', { error: error.message });
    }
  }

  async send(request: PushRequest): Promise<PushResponse> {
    try {
      if (!this.provider) {
        throw new Error('APNS not initialized');
      }

      const tokens = this.getTargetTokens(request);
      if (tokens.length === 0) {
        throw new Error('No device tokens provided');
      }

      const notification = new apn.Notification();
      notification.alert = {
        title: request.title,
        body: request.body
      };
      notification.badge = request.badge;
      notification.sound = request.sound || 'default';
      notification.category = request.category;
      notification.payload = request.data || {};
      notification.topic = process.env.APNS_BUNDLE_ID!;
      
      if (request.ttl) {
        notification.expiry = Math.floor(Date.now() / 1000) + request.ttl;
      }

      if (request.priority === 'high') {
        notification.priority = 10;
      }

      if (request.collapseKey) {
        notification.collapseId = request.collapseKey;
      }

      const result = await this.provider.send(notification, tokens);

      const failedTokens = result.failed.map(failure => failure.device);

      this.logger.info('APNS push notifications sent', {
        total: tokens.length,
        successful: result.sent.length,
        failed: result.failed.length
      });

      return {
        success: result.sent.length > 0,
        provider: this.name,
        deliveredCount: result.sent.length,
        failedCount: result.failed.length,
        failedTokens
      };

    } catch (error: any) {
      this.logger.error('APNS push notification failed', {
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }

  isAvailable(): boolean {
    return this.provider !== null;
  }

  validateToken(token: string): boolean {
    // APNS device tokens are 64 character hex strings
    return /^[a-fA-F0-9]{64}$/.test(token);
  }

  async getStats(): Promise<{ sent: number; delivered: number; failed: number }> {
    // APNS doesn't provide direct stats API
    return { sent: 0, delivered: 0, failed: 0 };
  }

  private getTargetTokens(request: PushRequest): string[] {
    const tokens: string[] = [];

    if (request.deviceToken) {
      tokens.push(request.deviceToken);
    }

    if (request.deviceTokens) {
      tokens.push(...request.deviceTokens);
    }

    return [...new Set(tokens)].filter(token => this.validateToken(token));
  }
}

export class OneSignalProvider implements PushProvider {
  name = DeliveryProvider.ONE_SIGNAL;
  private client: OneSignal | null = null;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('OneSignalProvider');
    this.initializeOneSignal();
  }

  private initializeOneSignal(): void {
    try {
      const appId = process.env.ONESIGNAL_APP_ID;
      const apiKey = process.env.ONESIGNAL_API_KEY;

      if (appId && apiKey) {
        this.client = new OneSignal({
          appId,
          restApiKey: apiKey
        });
        this.logger.info('OneSignal initialized successfully');
      }
    } catch (error) {
      this.logger.error('Failed to initialize OneSignal', { error: error.message });
    }
  }

  async send(request: PushRequest): Promise<PushResponse> {
    try {
      if (!this.client) {
        throw new Error('OneSignal not initialized');
      }

      const notification: any = {
        app_id: process.env.ONESIGNAL_APP_ID,
        headings: { en: request.title },
        contents: { en: request.body },
        data: request.data,
        large_icon: request.icon,
        big_picture: request.image,
        ios_badgeType: 'SetTo',
        ios_badgeCount: request.badge,
        ios_sound: request.sound,
        android_sound: request.sound,
        android_channel_id: request.channelId,
        priority: request.priority === 'high' ? 10 : 5,
        ttl: request.ttl,
        collapse_id: request.collapseKey
      };

      // Set targeting
      if (request.deviceToken) {
        notification.include_player_ids = [request.deviceToken];
      } else if (request.deviceTokens) {
        notification.include_player_ids = request.deviceTokens;
      } else if (request.userId) {
        notification.include_external_user_ids = [request.userId];
      } else if (request.userIds) {
        notification.include_external_user_ids = request.userIds;
      } else {
        throw new Error('No targeting specified');
      }

      const response = await this.client.createNotification(notification);

      this.logger.info('OneSignal push notification sent', {
        notificationId: response.id,
        recipients: response.recipients
      });

      return {
        success: true,
        messageId: response.id,
        provider: this.name,
        deliveredCount: response.recipients
      };

    } catch (error: any) {
      this.logger.error('OneSignal push notification failed', {
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  validateToken(token: string): boolean {
    // OneSignal player IDs are UUIDs
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  }

  async getStats(): Promise<{ sent: number; delivered: number; failed: number }> {
    // OneSignal provides analytics API
    // This would require additional API calls
    return { sent: 0, delivered: 0, failed: 0 };
  }
}

export class PushNotificationService {
  private providers: PushProvider[];
  private logger: Logger;
  private circuitBreaker: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }>;

  constructor() {
    this.logger = new Logger('PushNotificationService');
    this.providers = [
      new FirebaseProvider(),
      new APNSProvider(),
      new OneSignalProvider()
    ].filter(provider => provider.isAvailable());

    this.circuitBreaker = new Map();

    if (this.providers.length === 0) {
      this.logger.warn('No push notification providers configured');
    }
  }

  async sendPush(request: PushRequest): Promise<boolean> {
    if (this.providers.length === 0) {
      throw new Error('No push notification providers available');
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
          this.logger.info('Push notification sent successfully', {
            provider: provider.name,
            messageId: response.messageId,
            delivered: response.deliveredCount,
            failed: response.failedCount,
            duration
          });

          // Track delivery metrics
          await this.trackDelivery(request, response, duration);
          
          return true;
        } else {
          this.recordFailure(provider.name);
          this.logger.warn('Push notification failed with provider', {
            provider: provider.name,
            error: response.error
          });
        }

      } catch (error: any) {
        this.recordFailure(provider.name);
        this.logger.error('Push notification provider threw exception', {
          provider: provider.name,
          error: error.message
        });
      }
    }

    // All providers failed
    const duration = Date.now() - startTime;
    this.logger.error('All push notification providers failed', {
      providersAttempted: this.providers.length,
      duration
    });

    return false;
  }

  async sendBulkPush(requests: PushRequest[], batchSize: number = 1000): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 };
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const promises = batch.map(async (request) => {
        try {
          const success = await this.sendPush(request);
          return success;
        } catch (error) {
          this.logger.error('Bulk push notification failed', {
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

      // Small delay between batches
      if (i + batchSize < requests.length) {
        await this.delay(100);
      }
    }

    this.logger.info('Bulk push notifications completed', {
      total: requests.length,
      success: results.success,
      failed: results.failed
    });

    return results;
  }

  async validateDeviceToken(token: string, platform?: 'ios' | 'android' | 'web'): Promise<{ valid: boolean; platform?: string }> {
    for (const provider of this.providers) {
      if (provider.validateToken(token)) {
        return { 
          valid: true, 
          platform: this.detectPlatform(token, provider.name) 
        };
      }
    }

    return { valid: false };
  }

  async getProviderStats(): Promise<Array<{ provider: string; available: boolean; failures: number; stats: any }>> {
    const stats = [];

    for (const provider of this.providers) {
      const circuitState = this.circuitBreaker.get(provider.name);
      
      stats.push({
        provider: provider.name,
        available: provider.isAvailable() && !this.isCircuitBreakerOpen(provider.name),
        failures: circuitState?.failures || 0,
        stats: await provider.getStats()
      });
    }

    return stats;
  }

  private detectPlatform(token: string, providerName: string): string {
    switch (providerName) {
      case DeliveryProvider.APNS:
        return 'ios';
      case DeliveryProvider.FIREBASE:
        // FCM tokens can be for any platform
        return 'unknown';
      case DeliveryProvider.ONE_SIGNAL:
        return 'unknown';
      default:
        return 'unknown';
    }
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
      this.logger.warn('Circuit breaker opened for push provider', { provider: providerName });
    }

    this.circuitBreaker.set(providerName, state);
  }

  private resetCircuitBreaker(providerName: string): void {
    this.circuitBreaker.delete(providerName);
  }

  private async trackDelivery(request: PushRequest, response: PushResponse, duration: number): Promise<void> {
    // This would typically create a DeliveryLog record
    this.logger.info('Push notification delivery tracked', {
      provider: response.provider,
      messageId: response.messageId,
      duration,
      delivered: response.deliveredCount,
      failed: response.failedCount
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for token management
  async cleanupInvalidTokens(tokens: string[]): Promise<string[]> {
    const validTokens: string[] = [];

    for (const token of tokens) {
      const validation = await this.validateDeviceToken(token);
      if (validation.valid) {
        validTokens.push(token);
      }
    }

    this.logger.info('Token cleanup completed', {
      total: tokens.length,
      valid: validTokens.length,
      removed: tokens.length - validTokens.length
    });

    return validTokens;
  }

  // Topic-based messaging (for Firebase)
  async sendToTopic(topic: string, notification: Omit<PushRequest, 'deviceToken' | 'deviceTokens' | 'userId' | 'userIds'>): Promise<boolean> {
    const firebaseProvider = this.providers.find(p => p.name === DeliveryProvider.FIREBASE) as FirebaseProvider;
    
    if (!firebaseProvider) {
      throw new Error('Firebase provider not available for topic messaging');
    }

    // This would require additional implementation in FirebaseProvider for topic messaging
    this.logger.info('Topic-based messaging requested', { topic });
    return false;
  }
}
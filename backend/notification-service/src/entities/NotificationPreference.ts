import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { NotificationChannel, NotificationType } from './Notification';

export enum PreferenceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

export enum OptInMethod {
  EXPLICIT = 'explicit', // User explicitly opted in
  IMPLIED = 'implied', // Implied consent (e.g., account creation)
  LEGAL_BASIS = 'legal_basis', // Legal requirement
  LEGITIMATE_INTEREST = 'legitimate_interest'
}

export interface ChannelSettings {
  enabled: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'never';
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
  deliveryWindow?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  rateLimits?: {
    maxPerHour?: number;
    maxPerDay?: number;
    maxPerWeek?: number;
  };
}

export interface TypeSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  priority: 'low' | 'normal' | 'high';
  consolidation?: {
    enabled: boolean;
    windowMinutes: number; // Consolidate notifications within this window
    maxCount: number; // Maximum notifications to consolidate
  };
}

@Entity('notification_preferences')
@Unique(['userId', 'channel', 'type'])
@Index(['userId'])
@Index(['status'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: NotificationChannel, nullable: true })
  channel?: NotificationChannel; // null for global preferences

  @Column({ type: 'enum', enum: NotificationType, nullable: true })
  type?: NotificationType; // null for channel-wide preferences

  @Column({ type: 'enum', enum: PreferenceStatus, default: PreferenceStatus.ACTIVE })
  status: PreferenceStatus;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'json', nullable: true })
  channelSettings?: ChannelSettings;

  @Column({ type: 'json', nullable: true })
  typeSettings?: TypeSettings;

  @Column({ type: 'enum', enum: OptInMethod, default: OptInMethod.IMPLIED })
  optInMethod: OptInMethod;

  @Column({ type: 'timestamp', nullable: true })
  optInDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  optOutDate?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  optOutReason?: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  locale: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'json', nullable: true })
  contactInfo?: {
    email?: string;
    phone?: string;
    deviceTokens?: string[];
  };

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  unsubscribeToken?: string; // For email unsubscribe links

  @Column({ type: 'timestamp', nullable: true })
  lastNotificationAt?: Date;

  @Column({ type: 'int', default: 0 })
  notificationCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  // Computed properties
  get isOptedIn(): boolean {
    return this.enabled && this.status === PreferenceStatus.ACTIVE && this.optOutDate === null;
  }

  get isOptedOut(): boolean {
    return !this.enabled || this.status === PreferenceStatus.INACTIVE || this.optOutDate !== null;
  }

  get isBlocked(): boolean {
    return this.status === PreferenceStatus.BLOCKED;
  }

  get isGlobalPreference(): boolean {
    return this.channel === null && this.type === null;
  }

  get isChannelPreference(): boolean {
    return this.channel !== null && this.type === null;
  }

  get isTypePreference(): boolean {
    return this.channel === null && this.type !== null;
  }

  get isSpecificPreference(): boolean {
    return this.channel !== null && this.type !== null;
  }

  // Helper methods
  optIn(method: OptInMethod = OptInMethod.EXPLICIT): void {
    this.enabled = true;
    this.status = PreferenceStatus.ACTIVE;
    this.optInMethod = method;
    this.optInDate = new Date();
    this.optOutDate = null;
    this.optOutReason = null;
  }

  optOut(reason?: string): void {
    this.enabled = false;
    this.status = PreferenceStatus.INACTIVE;
    this.optOutDate = new Date();
    this.optOutReason = reason;
  }

  block(reason?: string): void {
    this.enabled = false;
    this.status = PreferenceStatus.BLOCKED;
    this.optOutDate = new Date();
    this.optOutReason = reason;
  }

  updateContactInfo(contactInfo: Partial<{ email: string; phone: string; deviceTokens: string[] }>): void {
    this.contactInfo = {
      ...this.contactInfo,
      ...contactInfo
    };
  }

  addDeviceToken(token: string): void {
    if (!this.contactInfo) {
      this.contactInfo = {};
    }
    if (!this.contactInfo.deviceTokens) {
      this.contactInfo.deviceTokens = [];
    }
    if (!this.contactInfo.deviceTokens.includes(token)) {
      this.contactInfo.deviceTokens.push(token);
    }
  }

  removeDeviceToken(token: string): void {
    if (this.contactInfo?.deviceTokens) {
      this.contactInfo.deviceTokens = this.contactInfo.deviceTokens.filter(t => t !== token);
    }
  }

  canReceiveNotification(channel: NotificationChannel, type: NotificationType, currentTime: Date = new Date()): boolean {
    // Check if blocked
    if (this.isBlocked) {
      return false;
    }

    // Check if opted out
    if (this.isOptedOut) {
      return false;
    }

    // Check channel settings
    if (this.channelSettings) {
      if (!this.channelSettings.enabled) {
        return false;
      }

      // Check frequency
      if (this.channelSettings.frequency === 'never') {
        return false;
      }

      // Check quiet hours
      if (this.channelSettings.quietHours?.enabled) {
        const isInQuietHours = this.isInTimeWindow(
          currentTime,
          this.channelSettings.quietHours.startTime,
          this.channelSettings.quietHours.endTime,
          this.channelSettings.quietHours.timezone
        );
        if (isInQuietHours) {
          return false;
        }
      }

      // Check delivery window
      if (this.channelSettings.deliveryWindow?.enabled) {
        const isInDeliveryWindow = this.isInTimeWindow(
          currentTime,
          this.channelSettings.deliveryWindow.startTime,
          this.channelSettings.deliveryWindow.endTime,
          this.channelSettings.deliveryWindow.timezone
        );
        if (!isInDeliveryWindow) {
          return false;
        }
      }
    }

    // Check type settings
    if (this.typeSettings) {
      if (!this.typeSettings.enabled) {
        return false;
      }

      // Check if channel is allowed for this type
      if (this.typeSettings.channels && !this.typeSettings.channels.includes(channel)) {
        return false;
      }
    }

    return true;
  }

  checkRateLimit(channel: NotificationChannel, currentTime: Date = new Date()): { allowed: boolean; reason?: string } {
    if (!this.channelSettings?.rateLimits) {
      return { allowed: true };
    }

    const rateLimits = this.channelSettings.rateLimits;
    const now = currentTime.getTime();

    // This is a simplified rate limit check
    // In production, you'd want to track actual notification counts in a separate table
    if (rateLimits.maxPerHour) {
      const hourAgo = now - 60 * 60 * 1000;
      // Check if exceeded hourly limit (implementation would need actual tracking)
    }

    if (rateLimits.maxPerDay) {
      const dayAgo = now - 24 * 60 * 60 * 1000;
      // Check if exceeded daily limit (implementation would need actual tracking)
    }

    if (rateLimits.maxPerWeek) {
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      // Check if exceeded weekly limit (implementation would need actual tracking)
    }

    return { allowed: true };
  }

  private isInTimeWindow(currentTime: Date, startTime: string, endTime: string, timezone: string): boolean {
    // This is a simplified implementation
    // In production, you'd want to use a proper timezone library like date-fns-tz
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes <= endMinutes) {
      // Same day window
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Crosses midnight
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  generateUnsubscribeToken(): string {
    const crypto = require('crypto');
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
    return this.unsubscribeToken;
  }

  incrementNotificationCount(): void {
    this.notificationCount++;
    this.lastNotificationAt = new Date();
  }
}
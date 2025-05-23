import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { NotificationTemplate } from './NotificationTemplate';
import { DeliveryLog } from './DeliveryLog';
import { NotificationGroup } from './NotificationGroup';

export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationType {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  SYSTEM = 'system',
  REMINDER = 'reminder'
}

@Entity('notifications')
@Index(['recipientId', 'channel'])
@Index(['status', 'scheduledAt'])
@Index(['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  recipientId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientEmail?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientDeviceToken?: string;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority: NotificationPriority;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.TRANSACTIONAL })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  templateVariables?: Record<string, any>;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  locale: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt?: Date;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalId?: string; // For tracking with external providers

  @Column({ type: 'varchar', length: 255, nullable: true })
  correlationId?: string; // For grouping related notifications

  @Column({ type: 'varchar', length: 255, nullable: true })
  campaignId?: string; // For marketing campaigns

  @ManyToOne(() => NotificationTemplate, { nullable: true })
  template?: NotificationTemplate;

  @Column({ type: 'uuid', nullable: true })
  templateId?: string;

  @ManyToOne(() => NotificationGroup, group => group.notifications, { nullable: true })
  group?: NotificationGroup;

  @Column({ type: 'uuid', nullable: true })
  groupId?: string;

  @OneToMany(() => DeliveryLog, log => log.notification)
  deliveryLogs: DeliveryLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  // Computed properties
  get isScheduled(): boolean {
    return this.scheduledAt !== null && this.scheduledAt > new Date();
  }

  get isOverdue(): boolean {
    return this.scheduledAt !== null && this.scheduledAt < new Date() && this.status === NotificationStatus.PENDING;
  }

  get canRetry(): boolean {
    return this.status === NotificationStatus.FAILED && this.retryCount < this.maxRetries;
  }

  get isDelivered(): boolean {
    return this.status === NotificationStatus.DELIVERED || this.deliveredAt !== null;
  }

  get isRead(): boolean {
    return this.readAt !== null;
  }

  // Helper methods
  markAsSent(): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
  }

  markAsDelivered(): void {
    this.status = NotificationStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  markAsRead(): void {
    this.readAt = new Date();
  }

  markAsFailed(reason: string): void {
    this.status = NotificationStatus.FAILED;
    this.failureReason = reason;
    this.retryCount++;
    
    if (this.canRetry) {
      // Exponential backoff: 5min, 15min, 45min
      const delayMinutes = 5 * Math.pow(3, this.retryCount - 1);
      this.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    }
  }

  resetForRetry(): void {
    this.status = NotificationStatus.PENDING;
    this.failureReason = null;
    this.nextRetryAt = null;
  }
}
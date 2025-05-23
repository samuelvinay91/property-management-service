import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { Notification, NotificationChannel } from './Notification';

export enum DeliveryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  FAILED = 'failed',
  REJECTED = 'rejected',
  DEFERRED = 'deferred',
  OPENED = 'opened',
  CLICKED = 'clicked',
  UNSUBSCRIBED = 'unsubscribed',
  COMPLAINED = 'complained'
}

export enum DeliveryProvider {
  SENDGRID = 'sendgrid',
  AWS_SES = 'aws_ses',
  TWILIO = 'twilio',
  FIREBASE = 'firebase',
  APNS = 'apns',
  ONE_SIGNAL = 'one_signal',
  INTERNAL = 'internal'
}

export interface DeliveryMetrics {
  attemptNumber: number;
  latencyMs: number;
  retryDelayMs?: number;
  httpStatusCode?: number;
  responseTime?: number;
  providerMessageId?: string;
  providerResponse?: any;
}

export interface DeliveryContext {
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  clickedLinks?: string[];
  openedAt?: Date;
  clickedAt?: Date;
}

@Entity('delivery_logs')
@Index(['notificationId'])
@Index(['status', 'createdAt'])
@Index(['provider', 'providerMessageId'])
@Index(['channel', 'status'])
export class DeliveryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Notification, notification => notification.deliveryLogs, {
    onDelete: 'CASCADE'
  })
  notification: Notification;

  @Column({ type: 'uuid' })
  @Index()
  notificationId: string;

  @Column({ type: 'enum', enum: DeliveryStatus })
  status: DeliveryStatus;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: DeliveryProvider })
  provider: DeliveryProvider;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerMessageId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerBatchId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientAddress: string; // email, phone number, device token

  @Column({ type: 'json' })
  metrics: DeliveryMetrics;

  @Column({ type: 'json', nullable: true })
  context?: DeliveryContext;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  errorCode?: string;

  @Column({ type: 'text', nullable: true })
  rawResponse?: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  bouncedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  openedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  clickedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt?: Date;

  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  @Column({ type: 'boolean', default: false })
  isRetry: boolean;

  @Column({ type: 'uuid', nullable: true })
  originalDeliveryLogId?: string; // Reference to first attempt

  @Column({ type: 'float', nullable: true })
  cost?: number; // Cost in cents/smallest currency unit

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'json', nullable: true })
  webhookData?: any; // Store webhook payload for debugging

  // Computed properties
  get isSuccessful(): boolean {
    return [DeliveryStatus.SENT, DeliveryStatus.DELIVERED].includes(this.status);
  }

  get isFailed(): boolean {
    return [
      DeliveryStatus.FAILED,
      DeliveryStatus.BOUNCED,
      DeliveryStatus.REJECTED
    ].includes(this.status);
  }

  get isPending(): boolean {
    return [DeliveryStatus.PENDING, DeliveryStatus.PROCESSING].includes(this.status);
  }

  get isDeferred(): boolean {
    return this.status === DeliveryStatus.DEFERRED;
  }

  get hasEngagement(): boolean {
    return [DeliveryStatus.OPENED, DeliveryStatus.CLICKED].includes(this.status);
  }

  get deliveryDuration(): number | null {
    if (!this.sentAt || !this.deliveredAt) {
      return null;
    }
    return this.deliveredAt.getTime() - this.sentAt.getTime();
  }

  get totalDuration(): number {
    const endTime = this.deliveredAt || this.failedAt || this.bouncedAt || new Date();
    return endTime.getTime() - this.createdAt.getTime();
  }

  // Helper methods
  markAsSent(providerMessageId?: string, providerResponse?: any): void {
    this.status = DeliveryStatus.SENT;
    this.sentAt = new Date();
    this.providerMessageId = providerMessageId;
    
    if (providerResponse) {
      this.rawResponse = JSON.stringify(providerResponse);
    }
  }

  markAsDelivered(deliveryTime?: Date): void {
    this.status = DeliveryStatus.DELIVERED;
    this.deliveredAt = deliveryTime || new Date();
  }

  markAsFailed(errorMessage: string, errorCode?: string, httpStatusCode?: number): void {
    this.status = DeliveryStatus.FAILED;
    this.failedAt = new Date();
    this.errorMessage = errorMessage;
    this.errorCode = errorCode;
    
    if (httpStatusCode) {
      this.metrics = {
        ...this.metrics,
        httpStatusCode
      };
    }
  }

  markAsBounced(bounceReason: string, bounceTime?: Date): void {
    this.status = DeliveryStatus.BOUNCED;
    this.bouncedAt = bounceTime || new Date();
    this.errorMessage = bounceReason;
  }

  markAsOpened(openTime?: Date, context?: Partial<DeliveryContext>): void {
    this.status = DeliveryStatus.OPENED;
    this.openedAt = openTime || new Date();
    
    if (context) {
      this.context = {
        ...this.context,
        ...context,
        openedAt: this.openedAt
      };
    }
  }

  markAsClicked(clickTime?: Date, clickedLink?: string, context?: Partial<DeliveryContext>): void {
    this.status = DeliveryStatus.CLICKED;
    this.clickedAt = clickTime || new Date();
    
    if (context || clickedLink) {
      this.context = {
        ...this.context,
        ...context,
        clickedAt: this.clickedAt
      };
      
      if (clickedLink) {
        if (!this.context.clickedLinks) {
          this.context.clickedLinks = [];
        }
        if (!this.context.clickedLinks.includes(clickedLink)) {
          this.context.clickedLinks.push(clickedLink);
        }
      }
    }
  }

  updateMetrics(metrics: Partial<DeliveryMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...metrics
    };
  }

  addWebhookData(data: any): void {
    this.webhookData = {
      ...this.webhookData,
      [new Date().toISOString()]: data
    };
  }

  static createForRetry(originalLog: DeliveryLog, attemptNumber: number): DeliveryLog {
    const retryLog = new DeliveryLog();
    retryLog.notificationId = originalLog.notificationId;
    retryLog.channel = originalLog.channel;
    retryLog.provider = originalLog.provider;
    retryLog.recipientAddress = originalLog.recipientAddress;
    retryLog.status = DeliveryStatus.PENDING;
    retryLog.attemptNumber = attemptNumber;
    retryLog.isRetry = true;
    retryLog.originalDeliveryLogId = originalLog.originalDeliveryLogId || originalLog.id;
    retryLog.metrics = {
      attemptNumber,
      latencyMs: 0
    };
    
    return retryLog;
  }

  getCostInMajorUnit(): number | null {
    if (this.cost === null || this.cost === undefined) {
      return null;
    }
    
    // Convert from smallest unit (cents) to major unit (dollars)
    return this.cost / 100;
  }

  getDeliveryRate(): number {
    // This would typically be calculated across multiple logs
    // Return 1.0 for successful delivery, 0.0 for failed
    return this.isSuccessful ? 1.0 : 0.0;
  }

  getBounceRate(): number {
    // This would typically be calculated across multiple logs
    // Return 1.0 for bounced, 0.0 for not bounced
    return this.status === DeliveryStatus.BOUNCED ? 1.0 : 0.0;
  }

  getEngagementRate(): number {
    // This would typically be calculated across multiple logs
    // Return 1.0 for engaged (opened/clicked), 0.0 for not engaged
    return this.hasEngagement ? 1.0 : 0.0;
  }
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Notification, NotificationChannel, NotificationType, NotificationPriority } from './Notification';

export enum GroupStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export enum GroupType {
  CAMPAIGN = 'campaign',
  BULK = 'bulk',
  SEQUENCE = 'sequence',
  TRIGGER = 'trigger',
  BROADCAST = 'broadcast'
}

export interface GroupSettings {
  batchSize: number;
  batchDelayMs: number;
  maxRetries: number;
  retryDelayMs: number;
  enableRateLimiting: boolean;
  rateLimitPerSecond?: number;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  suppressDuplicates: boolean;
  respectUserPreferences: boolean;
  trackingEnabled: boolean;
  unsubscribeEnabled: boolean;
}

export interface Targeting {
  userIds?: string[];
  userSegments?: string[];
  filters?: {
    properties?: Record<string, any>;
    tags?: string[];
    location?: {
      countries?: string[];
      cities?: string[];
      regions?: string[];
    };
    behavior?: {
      lastLoginAfter?: Date;
      lastLoginBefore?: Date;
      registeredAfter?: Date;
      registeredBefore?: Date;
    };
  };
  exclusions?: {
    userIds?: string[];
    userSegments?: string[];
    optedOutCategories?: string[];
  };
}

export interface Schedule {
  sendAt?: Date;
  timezone: string;
  sendImmediately: boolean;
  respectQuietHours: boolean;
  staggerDelivery?: {
    enabled: boolean;
    durationMinutes: number;
    distribution: 'even' | 'random' | 'peak_hours';
  };
  recurring?: {
    enabled: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    endDate?: Date;
    maxOccurrences?: number;
  };
}

export interface GroupMetrics {
  totalRecipients: number;
  targetedRecipients: number;
  eligibleRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  bouncedCount: number;
  openedCount: number;
  clickedCount: number;
  unsubscribedCount: number;
  complainedCount: number;
  costTotal: number;
  currency: string;
}

@Entity('notification_groups')
@Index(['status', 'scheduledAt'])
@Index(['type', 'createdAt'])
@Index(['campaignId'])
export class NotificationGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: GroupType })
  type: GroupType;

  @Column({ type: 'enum', enum: GroupStatus, default: GroupStatus.DRAFT })
  status: GroupStatus;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationType })
  notificationType: NotificationType;

  @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority: NotificationPriority;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  campaignId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  templateId?: string;

  @Column({ type: 'json' })
  targeting: Targeting;

  @Column({ type: 'json' })
  schedule: Schedule;

  @Column({ type: 'json' })
  settings: GroupSettings;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt?: Date;

  @Column({ type: 'json', nullable: true })
  metrics?: GroupMetrics;

  @Column({ type: 'json', nullable: true })
  templateVariables?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'int', default: 0 })
  currentBatch: number;

  @Column({ type: 'int', default: 0 })
  processedCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastProcessedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextBatchAt?: Date;

  @OneToMany(() => Notification, notification => notification.group)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  // Computed properties
  get isDraft(): boolean {
    return this.status === GroupStatus.DRAFT;
  }

  get isScheduled(): boolean {
    return this.status === GroupStatus.SCHEDULED;
  }

  get isProcessing(): boolean {
    return this.status === GroupStatus.PROCESSING;
  }

  get isCompleted(): boolean {
    return this.status === GroupStatus.COMPLETED;
  }

  get isCancelled(): boolean {
    return this.status === GroupStatus.CANCELLED;
  }

  get isPaused(): boolean {
    return this.status === GroupStatus.PAUSED;
  }

  get isActive(): boolean {
    return [GroupStatus.SCHEDULED, GroupStatus.PROCESSING].includes(this.status);
  }

  get isFinished(): boolean {
    return [GroupStatus.COMPLETED, GroupStatus.CANCELLED].includes(this.status);
  }

  get canStart(): boolean {
    return this.status === GroupStatus.SCHEDULED && 
           (!this.scheduledAt || this.scheduledAt <= new Date());
  }

  get canPause(): boolean {
    return [GroupStatus.SCHEDULED, GroupStatus.PROCESSING].includes(this.status);
  }

  get canResume(): boolean {
    return this.status === GroupStatus.PAUSED;
  }

  get canCancel(): boolean {
    return [GroupStatus.DRAFT, GroupStatus.SCHEDULED, GroupStatus.PROCESSING, GroupStatus.PAUSED].includes(this.status);
  }

  get progress(): number {
    if (!this.metrics?.targetedRecipients || this.metrics.targetedRecipients === 0) {
      return 0;
    }
    return (this.processedCount / this.metrics.targetedRecipients) * 100;
  }

  get estimatedCompletion(): Date | null {
    if (!this.isProcessing || !this.metrics?.targetedRecipients || this.processedCount === 0) {
      return null;
    }

    const remaining = this.metrics.targetedRecipients - this.processedCount;
    const processingTime = Date.now() - (this.startedAt?.getTime() || Date.now());
    const rate = this.processedCount / (processingTime / 1000); // per second
    
    if (rate <= 0) {
      return null;
    }

    const estimatedSeconds = remaining / rate;
    return new Date(Date.now() + estimatedSeconds * 1000);
  }

  // Helper methods
  schedule(sendAt?: Date): void {
    this.status = GroupStatus.SCHEDULED;
    this.scheduledAt = sendAt || new Date();
  }

  start(): void {
    if (!this.canStart) {
      throw new Error(`Cannot start group in status: ${this.status}`);
    }

    this.status = GroupStatus.PROCESSING;
    this.startedAt = new Date();
    this.currentBatch = 0;
    this.processedCount = 0;
  }

  pause(): void {
    if (!this.canPause) {
      throw new Error(`Cannot pause group in status: ${this.status}`);
    }

    this.status = GroupStatus.PAUSED;
    this.pausedAt = new Date();
  }

  resume(): void {
    if (!this.canResume) {
      throw new Error(`Cannot resume group in status: ${this.status}`);
    }

    this.status = GroupStatus.PROCESSING;
    this.pausedAt = null;
  }

  cancel(reason?: string): void {
    if (!this.canCancel) {
      throw new Error(`Cannot cancel group in status: ${this.status}`);
    }

    this.status = GroupStatus.CANCELLED;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
  }

  complete(): void {
    this.status = GroupStatus.COMPLETED;
    this.completedAt = new Date();
  }

  updateMetrics(metrics: Partial<GroupMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...metrics
    } as GroupMetrics;
  }

  incrementProcessedCount(count: number = 1): void {
    this.processedCount += count;
    this.lastProcessedAt = new Date();
  }

  nextBatch(): void {
    this.currentBatch++;
    
    if (this.settings.batchDelayMs > 0) {
      this.nextBatchAt = new Date(Date.now() + this.settings.batchDelayMs);
    }
  }

  calculateNextBatchTime(): Date {
    const baseDelay = this.settings.batchDelayMs || 0;
    
    // Add stagger delay if enabled
    if (this.schedule.staggerDelivery?.enabled) {
      const staggerWindow = this.schedule.staggerDelivery.durationMinutes * 60 * 1000;
      const batchCount = Math.ceil((this.metrics?.targetedRecipients || 0) / this.settings.batchSize);
      const staggerDelay = staggerWindow / batchCount;
      
      return new Date(Date.now() + baseDelay + (staggerDelay * this.currentBatch));
    }

    return new Date(Date.now() + baseDelay);
  }

  getTargetedUsers(): string[] {
    const userIds: string[] = [];

    // Direct user IDs
    if (this.targeting.userIds) {
      userIds.push(...this.targeting.userIds);
    }

    // This would typically involve querying a user service for segment members
    // For now, return the direct user IDs
    return [...new Set(userIds)]; // Remove duplicates
  }

  getExcludedUsers(): string[] {
    const excludedIds: string[] = [];

    if (this.targeting.exclusions?.userIds) {
      excludedIds.push(...this.targeting.exclusions.userIds);
    }

    return [...new Set(excludedIds)];
  }

  approve(approvedBy: string): void {
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
  }

  isApproved(): boolean {
    return this.approvedAt !== null;
  }

  requiresApproval(): boolean {
    // Define approval requirements based on business rules
    const largeAudience = (this.metrics?.targetedRecipients || 0) > 10000;
    const isMarketing = this.notificationType === NotificationType.MARKETING;
    const isBroadcast = this.type === GroupType.BROADCAST;

    return largeAudience || isMarketing || isBroadcast;
  }

  estimateCost(): number {
    // This would integrate with provider pricing
    // Simplified calculation for example
    const baseEmailCost = 0.001; // $0.001 per email
    const baseSMSCost = 0.05; // $0.05 per SMS
    const basePushCost = 0.0001; // $0.0001 per push

    let unitCost = 0;
    switch (this.channel) {
      case NotificationChannel.EMAIL:
        unitCost = baseEmailCost;
        break;
      case NotificationChannel.SMS:
        unitCost = baseSMSCost;
        break;
      case NotificationChannel.PUSH:
        unitCost = basePushCost;
        break;
      default:
        unitCost = 0;
    }

    return (this.metrics?.targetedRecipients || 0) * unitCost;
  }
}
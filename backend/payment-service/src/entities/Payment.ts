import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { PaymentMethod } from './PaymentMethod';
import { Subscription } from './Subscription';
import { Refund } from './Refund';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  DISPUTED = 'DISPUTED'
}

export enum PaymentType {
  RENT = 'RENT',
  SECURITY_DEPOSIT = 'SECURITY_DEPOSIT',
  APPLICATION_FEE = 'APPLICATION_FEE',
  PET_DEPOSIT = 'PET_DEPOSIT',
  LATE_FEE = 'LATE_FEE',
  MAINTENANCE_FEE = 'MAINTENANCE_FEE',
  UTILITY_BILL = 'UTILITY_BILL',
  PARKING_FEE = 'PARKING_FEE',
  AMENITY_FEE = 'AMENITY_FEE',
  OTHER = 'OTHER'
}

export enum PaymentFrequency {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY'
}

@Entity('payments')
@Index(['tenantId'])
@Index(['propertyId'])
@Index(['unitId'])
@Index(['status'])
@Index(['type'])
@Index(['dueDate'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string; // Reference to tenant

  @Column()
  propertyId: string; // Reference to property

  @Column({ nullable: true })
  unitId?: string; // Reference to unit

  @Column({ nullable: true })
  leaseId?: string; // Reference to lease

  @Column({
    type: 'enum',
    enum: PaymentType
  })
  type: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
    default: PaymentFrequency.ONE_TIME
  })
  frequency: PaymentFrequency;

  // Amount details
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  feeAmount: number; // Processing fees

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  lateFeeAmount: number;

  // Payment dates
  @Column()
  dueDate: Date;

  @Column({ nullable: true })
  paidDate?: Date;

  @Column({ nullable: true })
  scheduledDate?: Date; // For recurring payments

  // Payment method
  @Column({ nullable: true })
  paymentMethodId?: string;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod?: PaymentMethod;

  // External payment processor data
  @Column({ nullable: true })
  stripePaymentIntentId?: string;

  @Column({ nullable: true })
  stripeChargeId?: string;

  @Column({ nullable: true })
  externalTransactionId?: string;

  @Column({ nullable: true })
  externalPaymentId?: string;

  // Metadata
  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('simple-json', { nullable: true })
  metadata?: Record<string, any>;

  // Receipt and invoice
  @Column({ nullable: true })
  receiptNumber?: string;

  @Column({ nullable: true })
  invoiceNumber?: string;

  @Column({ nullable: true })
  receiptUrl?: string;

  // Recurring payment setup
  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringId?: string; // Parent recurring payment ID

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription?: Subscription;

  @Column({ nullable: true })
  subscriptionId?: string;

  @Column({ nullable: true })
  nextPaymentDate?: Date;

  // Auto-payment settings
  @Column({ default: false })
  isAutoPay: boolean;

  @Column('int', { default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  lastRetryDate?: Date;

  @Column({ nullable: true })
  nextRetryDate?: Date;

  // Dispute information
  @Column({ nullable: true })
  disputeId?: string;

  @Column({ nullable: true })
  disputeReason?: string;

  @Column({ nullable: true })
  disputeDate?: Date;

  // Refund information
  @Column({ nullable: true })
  refundId?: string;

  @Column({ nullable: true })
  refundReason?: string;

  @Column({ nullable: true })
  refundDate?: Date;

  // Processing information
  @Column({ nullable: true })
  processorFee?: number;

  @Column({ nullable: true })
  netAmount?: number; // Amount after fees

  @Column({ nullable: true })
  currency?: string;

  @Column({ nullable: true })
  exchangeRate?: number;

  // System fields
  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Refund, refund => refund.payment)
  refunds: Refund[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get totalAmount(): number {
    return this.amount + this.lateFeeAmount + this.feeAmount;
  }

  get remainingAmount(): number {
    return this.totalAmount - this.paidAmount;
  }

  get isOverdue(): boolean {
    return this.status === PaymentStatus.PENDING && this.dueDate < new Date();
  }

  get daysPastDue(): number {
    if (!this.isOverdue) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  get isPartiallyPaid(): boolean {
    return this.paidAmount > 0 && this.paidAmount < this.totalAmount;
  }

  get isFullyPaid(): boolean {
    return this.paidAmount >= this.totalAmount;
  }

  get paymentProgress(): number {
    return (this.paidAmount / this.totalAmount) * 100;
  }

  get daysUntilDue(): number {
    const today = new Date();
    const diffTime = this.dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isDueSoon(): boolean {
    return this.daysUntilDue <= 7 && this.daysUntilDue > 0;
  }

  get canRetry(): boolean {
    return this.status === PaymentStatus.FAILED && this.retryCount < 3;
  }

  get formattedAmount(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency || 'USD'
    }).format(this.amount);
  }
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Payment } from './Payment';

export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum RefundReason {
  DUPLICATE_CHARGE = 'DUPLICATE_CHARGE',
  FRAUDULENT = 'FRAUDULENT',
  REQUESTED_BY_CUSTOMER = 'REQUESTED_BY_CUSTOMER',
  SUBSCRIPTION_CANCELLATION = 'SUBSCRIPTION_CANCELLATION',
  OVERPAYMENT = 'OVERPAYMENT',
  OTHER = 'OTHER'
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payment, payment => payment.refunds)
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column('uuid')
  paymentId: string;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING
  })
  status: RefundStatus;

  @Column({
    type: 'enum',
    enum: RefundReason
  })
  reason: RefundReason;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ length: 500, nullable: true })
  stripeRefundId?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  @Column('uuid')
  initiatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
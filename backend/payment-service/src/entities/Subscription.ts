import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Payment } from './Payment';
import { PaymentMethod } from './PaymentMethod';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  EXPIRED = 'EXPIRED'
}

export enum BillingInterval {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  propertyId: string;

  @Column('uuid')
  landlordId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY
  })
  billingInterval: BillingInterval;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'date' })
  nextBillingDate: Date;

  @Column({ type: 'int', default: 1 })
  dayOfMonth: number;

  @Column({ length: 500, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ length: 500, nullable: true })
  stripePriceId?: string;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod?: PaymentMethod;

  @Column('uuid', { nullable: true })
  paymentMethodId?: string;

  @Column({ type: 'boolean', default: true })
  autoRenew: boolean;

  @Column({ type: 'int', default: 0 })
  failedPaymentAttempts: number;

  @Column({ type: 'int', default: 3 })
  maxFailedAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPaymentDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => Payment, payment => payment.subscription)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
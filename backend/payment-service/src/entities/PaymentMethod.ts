import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Payment } from './Payment';

export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  ACH = 'ACH'
}

export enum PaymentMethodStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  FAILED_VERIFICATION = 'FAILED_VERIFICATION'
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodType
  })
  type: PaymentMethodType;

  @Column({
    type: 'enum',
    enum: PaymentMethodStatus,
    default: PaymentMethodStatus.ACTIVE
  })
  status: PaymentMethodStatus;

  @Column({ length: 100 })
  nickname: string;

  @Column({ length: 500, nullable: true })
  stripePaymentMethodId?: string;

  @Column({ length: 4, nullable: true })
  last4?: string;

  @Column({ length: 50, nullable: true })
  brand?: string;

  @Column({ type: 'int', nullable: true })
  expiryMonth?: number;

  @Column({ type: 'int', nullable: true })
  expiryYear?: number;

  @Column({ length: 100, nullable: true })
  bankName?: string;

  @Column({ length: 20, nullable: true })
  accountType?: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => Payment, payment => payment.paymentMethod)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
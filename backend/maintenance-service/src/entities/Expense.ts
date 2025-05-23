import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from 'type-graphql';
import { WorkOrder } from './WorkOrder';
import { Vendor } from './Vendor';

export enum ExpenseType {
  LABOR = 'LABOR',
  MATERIALS = 'MATERIALS',
  EQUIPMENT = 'EQUIPMENT',
  PERMITS = 'PERMITS',
  TRAVEL = 'TRAVEL',
  EMERGENCY_FEE = 'EMERGENCY_FEE',
  OTHER = 'OTHER'
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

registerEnumType(ExpenseType, { name: 'ExpenseType' });
registerEnumType(ExpenseStatus, { name: 'ExpenseStatus' });

@Entity('expenses')
@ObjectType()
export class Expense {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => WorkOrder)
  @ManyToOne(() => WorkOrder, workOrder => workOrder.expenses)
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Field()
  @Column()
  workOrderId: string;

  @Field(() => Vendor, { nullable: true })
  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendorId' })
  vendor?: Vendor;

  @Field({ nullable: true })
  @Column({ nullable: true })
  vendorId?: string;

  @Field()
  @Column()
  description: string;

  @Field(() => ExpenseType)
  @Column({
    type: 'enum',
    enum: ExpenseType
  })
  type: ExpenseType;

  @Field(() => ExpenseStatus)
  @Column({
    type: 'enum',
    enum: ExpenseStatus,
    default: ExpenseStatus.PENDING
  })
  status: ExpenseStatus;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  quantity?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  unit?: string; // hours, each, sq ft, etc.

  @Field()
  @Column({ type: 'timestamp' })
  expenseDate: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  invoiceNumber?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  receiptUrl?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  invoiceUrl?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field()
  @Column()
  submittedBy: string; // User ID

  @Field({ nullable: true })
  @Column({ nullable: true })
  approvedBy?: string; // User ID

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Field()
  @Column({ default: false })
  isBillable: boolean; // To tenant

  @Field()
  @Column({ default: false })
  isReimbursable: boolean; // To employee/vendor

  @Field({ nullable: true })
  @Column({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  subcategory?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  glAccount?: string; // General ledger account

  @Field({ nullable: true })
  @Column({ nullable: true })
  taxAmount?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  taxRate?: number;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
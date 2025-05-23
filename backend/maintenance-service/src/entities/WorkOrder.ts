import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from 'type-graphql';
import { MaintenanceRequest } from './MaintenanceRequest';
import { Vendor } from './Vendor';
import { Asset } from './Asset';
import { WorkOrderAttachment } from './WorkOrderAttachment';
import { Expense } from './Expense';

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REQUIRES_APPROVAL = 'REQUIRES_APPROVAL'
}

export enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY'
}

export enum WorkOrderType {
  REACTIVE = 'REACTIVE',
  PREVENTIVE = 'PREVENTIVE',
  INSPECTION = 'INSPECTION',
  EMERGENCY = 'EMERGENCY'
}

registerEnumType(WorkOrderStatus, { name: 'WorkOrderStatus' });
registerEnumType(WorkOrderPriority, { name: 'WorkOrderPriority' });
registerEnumType(WorkOrderType, { name: 'WorkOrderType' });

@Entity('work_orders')
@ObjectType()
export class WorkOrder {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column('text')
  description: string;

  @Field(() => WorkOrderType)
  @Column({
    type: 'enum',
    enum: WorkOrderType,
    default: WorkOrderType.REACTIVE
  })
  type: WorkOrderType;

  @Field(() => WorkOrderStatus)
  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING
  })
  status: WorkOrderStatus;

  @Field(() => WorkOrderPriority)
  @Column({
    type: 'enum',
    enum: WorkOrderPriority,
    default: WorkOrderPriority.MEDIUM
  })
  priority: WorkOrderPriority;

  @Field()
  @Column()
  propertyId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  unitId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  tenantId?: string;

  @Field()
  @Column()
  requestedBy: string; // User ID who created the work order

  @Field({ nullable: true })
  @Column({ nullable: true })
  assignedTo?: string; // User ID of assigned technician

  @Field(() => Vendor, { nullable: true })
  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendorId' })
  vendor?: Vendor;

  @Field({ nullable: true })
  @Column({ nullable: true })
  vendorId?: string;

  @Field(() => Asset, { nullable: true })
  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'assetId' })
  asset?: Asset;

  @Field({ nullable: true })
  @Column({ nullable: true })
  assetId?: string;

  @Field(() => MaintenanceRequest, { nullable: true })
  @ManyToOne(() => MaintenanceRequest, { nullable: true })
  @JoinColumn({ name: 'maintenanceRequestId' })
  maintenanceRequest?: MaintenanceRequest;

  @Field({ nullable: true })
  @Column({ nullable: true })
  maintenanceRequestId?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  scheduledDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  completionNotes?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  estimatedHours?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  actualHours?: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  location?: string; // Specific location within property

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @Field(() => [WorkOrderAttachment])
  @OneToMany(() => WorkOrderAttachment, attachment => attachment.workOrder)
  attachments: WorkOrderAttachment[];

  @Field(() => [Expense])
  @OneToMany(() => Expense, expense => expense.workOrder)
  expenses: Expense[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  approvedBy?: string; // For high-cost work orders

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
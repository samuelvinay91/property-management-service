import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from 'type-graphql';
import { Asset } from './Asset';
import { WorkOrder } from './WorkOrder';

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

export enum ScheduleFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY',
  CUSTOM = 'CUSTOM'
}

registerEnumType(ScheduleStatus, { name: 'ScheduleStatus' });
registerEnumType(ScheduleFrequency, { name: 'ScheduleFrequency' });

@Entity('maintenance_schedules')
@ObjectType()
export class MaintenanceSchedule {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => ScheduleStatus)
  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.ACTIVE
  })
  status: ScheduleStatus;

  @Field(() => ScheduleFrequency)
  @Column({
    type: 'enum',
    enum: ScheduleFrequency
  })
  frequency: ScheduleFrequency;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  intervalDays?: number; // For custom frequency

  @Field()
  @Column()
  propertyId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  unitId?: string;

  @Field(() => Asset, { nullable: true })
  @ManyToOne(() => Asset, asset => asset.maintenanceSchedules, { nullable: true })
  @JoinColumn({ name: 'assetId' })
  asset?: Asset;

  @Field({ nullable: true })
  @Column({ nullable: true })
  assetId?: string;

  @Field()
  @Column()
  createdBy: string; // User ID

  @Field({ nullable: true })
  @Column({ nullable: true })
  assignedTo?: string; // Default assignee

  @Field({ nullable: true })
  @Column({ nullable: true })
  vendorId?: string; // Default vendor

  @Field()
  @Column({ type: 'timestamp' })
  startDate: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  nextDueDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastCompletedDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  leadTimeDays?: number; // Days before due date to create work order

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  estimatedDuration?: number; // Minutes

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost?: number;

  @Field()
  @Column('text')
  workDescription: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Field(() => [String])
  @Column('json')
  requiredSkills: string[]; // Skills needed for this maintenance

  @Field(() => [String])
  @Column('json')
  requiredTools: string[]; // Tools needed

  @Field(() => [String])
  @Column('json')
  requiredParts: string[]; // Parts that might be needed

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  checklist?: string[]; // Maintenance checklist

  @Field()
  @Column({ default: true })
  autoCreateWorkOrder: boolean;

  @Field()
  @Column({ default: false })
  requiresApproval: boolean;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  priority?: number; // 1-5, higher = more important

  @Field({ nullable: true })
  @Column({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  notifications?: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
    recipients?: string[];
  };

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @Field(() => [WorkOrder])
  @OneToMany(() => WorkOrder, workOrder => workOrder.id)
  generatedWorkOrders: WorkOrder[];

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  completedCount?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  skippedCount?: number;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastModifiedDate?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastModifiedBy?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
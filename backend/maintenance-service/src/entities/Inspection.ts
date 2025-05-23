import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from 'type-graphql';
import { WorkOrder } from './WorkOrder';

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export enum InspectionType {
  ROUTINE = 'ROUTINE',
  MOVE_IN = 'MOVE_IN',
  MOVE_OUT = 'MOVE_OUT',
  ANNUAL = 'ANNUAL',
  SAFETY = 'SAFETY',
  MAINTENANCE = 'MAINTENANCE',
  INSURANCE = 'INSURANCE',
  GOVERNMENT = 'GOVERNMENT',
  EMERGENCY = 'EMERGENCY'
}

export enum InspectionResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  CONDITIONAL_PASS = 'CONDITIONAL_PASS',
  NEEDS_FOLLOW_UP = 'NEEDS_FOLLOW_UP'
}

registerEnumType(InspectionStatus, { name: 'InspectionStatus' });
registerEnumType(InspectionType, { name: 'InspectionType' });
registerEnumType(InspectionResult, { name: 'InspectionResult' });

@Entity('inspections')
@ObjectType()
export class Inspection {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field(() => InspectionType)
  @Column({
    type: 'enum',
    enum: InspectionType,
    default: InspectionType.ROUTINE
  })
  type: InspectionType;

  @Field(() => InspectionStatus)
  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.SCHEDULED
  })
  status: InspectionStatus;

  @Field()
  @Column()
  propertyId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  unitId?: string;

  @Field()
  @Column()
  scheduledBy: string; // User ID who scheduled

  @Field({ nullable: true })
  @Column({ nullable: true })
  inspectorId?: string; // User ID of inspector

  @Field({ nullable: true })
  @Column({ nullable: true })
  inspectorName?: string;

  @Field()
  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  estimatedDuration?: number; // Minutes

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  actualDuration?: number; // Minutes

  @Field(() => [String])
  @Column('json')
  checklistItems: string[]; // Array of inspection items

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  checklistResults?: Record<string, any>; // Results for each item

  @Field(() => InspectionResult, { nullable: true })
  @Column({
    type: 'enum',
    enum: InspectionResult,
    nullable: true
  })
  overallResult?: InspectionResult;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallScore?: number; // 0-100

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  findings?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  recommendations?: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  deficiencies?: Array<{
    item: string;
    severity: string;
    description: string;
    photo?: string;
  }>;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  photos?: string[]; // Inspection photos

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  documents?: string[]; // Reports, certifications

  @Field({ nullable: true })
  @Column({ nullable: true })
  tenantPresent?: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  tenantSignature?: string; // Digital signature data

  @Field({ nullable: true })
  @Column({ nullable: true })
  inspectorSignature?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  reportGeneratedAt?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reportUrl?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  followUpDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  followUpNotes?: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @Field(() => [WorkOrder])
  @OneToMany(() => WorkOrder, workOrder => workOrder.id)
  generatedWorkOrders: WorkOrder[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
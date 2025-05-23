import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from 'type-graphql';
import { WorkOrder } from './WorkOrder';

export enum RequestStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  WORK_ORDER_CREATED = 'WORK_ORDER_CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY'
}

export enum RequestCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCE = 'APPLIANCE',
  FLOORING = 'FLOORING',
  PAINTING = 'PAINTING',
  PEST_CONTROL = 'PEST_CONTROL',
  SECURITY = 'SECURITY',
  LANDSCAPING = 'LANDSCAPING',
  CLEANING = 'CLEANING',
  GENERAL = 'GENERAL',
  OTHER = 'OTHER'
}

registerEnumType(RequestStatus, { name: 'RequestStatus' });
registerEnumType(RequestPriority, { name: 'RequestPriority' });
registerEnumType(RequestCategory, { name: 'RequestCategory' });

@Entity('maintenance_requests')
@ObjectType()
export class MaintenanceRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column('text')
  description: string;

  @Field(() => RequestCategory)
  @Column({
    type: 'enum',
    enum: RequestCategory,
    default: RequestCategory.GENERAL
  })
  category: RequestCategory;

  @Field(() => RequestPriority)
  @Column({
    type: 'enum',
    enum: RequestPriority,
    default: RequestPriority.MEDIUM
  })
  priority: RequestPriority;

  @Field(() => RequestStatus)
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.SUBMITTED
  })
  status: RequestStatus;

  @Field()
  @Column()
  propertyId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  unitId?: string;

  @Field()
  @Column()
  requestedBy: string; // Tenant or property manager ID

  @Field()
  @Column()
  requestedByType: string; // 'tenant' or 'property_manager'

  @Field({ nullable: true })
  @Column({ nullable: true })
  contactPhone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  contactEmail?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  preferredSchedule?: string; // JSON string with preferred times

  @Field({ nullable: true })
  @Column({ nullable: true })
  location?: string; // Specific location within unit/property

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  photos?: string[]; // Array of photo URLs

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  tenantNotes?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  managerNotes?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reviewedBy?: string; // Property manager who reviewed

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Field()
  @Column({ default: false })
  isEmergency: boolean;

  @Field()
  @Column({ default: false })
  allowEntry: boolean; // Tenant permission for entry

  @Field({ nullable: true })
  @Column({ nullable: true })
  entryInstructions?: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @Field(() => [WorkOrder])
  @OneToMany(() => WorkOrder, workOrder => workOrder.maintenanceRequest)
  workOrders: WorkOrder[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
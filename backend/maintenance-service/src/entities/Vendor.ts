import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from 'type-graphql';
import { WorkOrder } from './WorkOrder';

export enum VendorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_APPROVAL = 'PENDING_APPROVAL'
}

export enum VendorType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY'
}

registerEnumType(VendorStatus, { name: 'VendorStatus' });
registerEnumType(VendorType, { name: 'VendorType' });

@Entity('vendors')
@ObjectType()
export class Vendor {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field(() => VendorType)
  @Column({
    type: 'enum',
    enum: VendorType,
    default: VendorType.COMPANY
  })
  type: VendorType;

  @Field(() => VendorStatus)
  @Column({
    type: 'enum',
    enum: VendorStatus,
    default: VendorStatus.PENDING_APPROVAL
  })
  status: VendorStatus;

  @Field()
  @Column()
  contactPerson: string;

  @Field()
  @Column()
  email: string;

  @Field()
  @Column()
  phone: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  alternatePhone?: string;

  @Field()
  @Column('text')
  address: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  zipCode?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  licenseNumber?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  licenseExpiry?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  insuranceProvider?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  insuranceExpiry?: Date;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  insuranceAmount?: number;

  @Field(() => [String])
  @Column('json')
  specialties: string[]; // Array of specialties (plumbing, electrical, etc.)

  @Field(() => [String])
  @Column('json')
  serviceAreas: string[]; // Array of service area zip codes or cities

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number; // Average rating 0-5

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  totalJobs?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  completedJobs?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageResponseTime?: number; // Hours

  @Field()
  @Column({ default: false })
  isPreferred: boolean;

  @Field()
  @Column({ default: false })
  isEmergencyAvailable: boolean;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hourlyRate?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  emergencyRate?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  minimumCharge?: number;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  availability?: Record<string, any>; // Weekly schedule

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  paymentTerms?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  taxId?: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  documents?: string[]; // Array of document URLs

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @Field(() => [WorkOrder])
  @OneToMany(() => WorkOrder, workOrder => workOrder.vendor)
  workOrders: WorkOrder[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from 'type-graphql';
import { WorkOrder } from './WorkOrder';
import { MaintenanceSchedule } from './MaintenanceSchedule';

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  RETIRED = 'RETIRED'
}

export enum AssetCondition {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  CRITICAL = 'CRITICAL'
}

registerEnumType(AssetStatus, { name: 'AssetStatus' });
registerEnumType(AssetCondition, { name: 'AssetCondition' });

@Entity('assets')
@ObjectType()
export class Asset {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column()
  assetTag: string; // Unique identifier

  @Field()
  @Column()
  category: string; // HVAC, Appliance, Plumbing, etc.

  @Field({ nullable: true })
  @Column({ nullable: true })
  subcategory?: string;

  @Field()
  @Column()
  propertyId: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  unitId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  location?: string; // Specific location within property

  @Field({ nullable: true })
  @Column({ nullable: true })
  manufacturer?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  model?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  serialNumber?: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  purchaseDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  installationDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  warrantyExpiry?: Date;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchasePrice?: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentValue?: number;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  expectedLifeYears?: number;

  @Field(() => AssetStatus)
  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.ACTIVE
  })
  status: AssetStatus;

  @Field(() => AssetCondition)
  @Column({
    type: 'enum',
    enum: AssetCondition,
    default: AssetCondition.GOOD
  })
  condition: AssetCondition;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastInspectionDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  nextInspectionDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastMaintenanceDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  nextMaintenanceDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  maintenanceIntervalDays?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  maintenanceInstructions?: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  specifications?: Record<string, any>; // Technical specifications

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  documents?: string[]; // Manuals, warranties, etc.

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  photos?: string[]; // Asset photos

  @Field({ nullable: true })
  @Column({ nullable: true })
  qrCode?: string; // For mobile scanning

  @Field({ nullable: true })
  @Column({ nullable: true })
  barcodeData?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @Field(() => [WorkOrder])
  @OneToMany(() => WorkOrder, workOrder => workOrder.asset)
  workOrders: WorkOrder[];

  @Field(() => [MaintenanceSchedule])
  @OneToMany(() => MaintenanceSchedule, schedule => schedule.asset)
  maintenanceSchedules: MaintenanceSchedule[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
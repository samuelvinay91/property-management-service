import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Property } from './Property';

export enum UnitType {
  STUDIO = 'STUDIO',
  ONE_BEDROOM = 'ONE_BEDROOM',
  TWO_BEDROOM = 'TWO_BEDROOM',
  THREE_BEDROOM = 'THREE_BEDROOM',
  FOUR_BEDROOM = 'FOUR_BEDROOM',
  FIVE_PLUS_BEDROOM = 'FIVE_PLUS_BEDROOM',
  LOFT = 'LOFT',
  PENTHOUSE = 'PENTHOUSE',
  BASEMENT = 'BASEMENT',
  COMMERCIAL = 'COMMERCIAL',
  OFFICE = 'OFFICE',
  RETAIL = 'RETAIL',
  STORAGE = 'STORAGE'
}

export enum UnitStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
  OFF_MARKET = 'OFF_MARKET',
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  READY_TO_RENT = 'READY_TO_RENT'
}

@Entity('units')
@Index(['propertyId'])
@Index(['unitNumber'])
@Index(['unitType'])
@Index(['status'])
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  propertyId: string;

  @ManyToOne(() => Property, property => property.units, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  unitNumber: string;

  @Column({ nullable: true })
  unitName?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: UnitType
  })
  unitType: UnitType;

  @Column({
    type: 'enum',
    enum: UnitStatus,
    default: UnitStatus.OFF_MARKET
  })
  status: UnitStatus;

  // Unit Details
  @Column('int')
  bedrooms: number;

  @Column('decimal', { precision: 3, scale: 1 })
  bathrooms: number;

  @Column('int')
  squareFootage: number;

  @Column('int', { nullable: true })
  floor?: number;

  @Column({ nullable: true })
  balcony?: boolean;

  @Column({ nullable: true })
  patio?: boolean;

  @Column({ nullable: true })
  privateEntrance?: boolean;

  @Column({ nullable: true })
  washerDryerInUnit?: boolean;

  @Column({ nullable: true })
  dishwasher?: boolean;

  @Column({ nullable: true })
  airConditioning?: boolean;

  @Column({ nullable: true })
  heating?: boolean;

  @Column({ nullable: true })
  fireplace?: boolean;

  @Column({ nullable: true })
  walkInCloset?: boolean;

  // Rental Information
  @Column('decimal', { precision: 10, scale: 2 })
  rentAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  securityDeposit?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  petDeposit?: number;

  // Current Lease Information
  @Column({ nullable: true })
  currentTenantId?: string; // Reference to tenant

  @Column({ nullable: true })
  leaseStartDate?: Date;

  @Column({ nullable: true })
  leaseEndDate?: Date;

  @Column({ nullable: true })
  availableDate?: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentRent?: number;

  // Unit Features
  @Column('text', { array: true, default: [] })
  features: string[];

  @Column('text', { array: true, default: [] })
  appliances: string[];

  @Column('text', { array: true, default: [] })
  utilities: string[];

  // Maintenance
  @Column({ nullable: true })
  lastInspectionDate?: Date;

  @Column({ nullable: true })
  nextInspectionDate?: Date;

  @Column('text', { nullable: true })
  maintenanceNotes?: string;

  // Marketing
  @Column('text', { array: true, default: [] })
  images: string[];

  @Column({ nullable: true })
  virtualTourUrl?: string;

  @Column({ nullable: true })
  floorPlanUrl?: string;

  // Analytics
  @Column('int', { default: 0 })
  viewCount: number;

  @Column('int', { default: 0 })
  inquiryCount: number;

  @Column({ nullable: true })
  lastViewedAt?: Date;

  // System fields
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isAvailable(): boolean {
    return this.status === UnitStatus.AVAILABLE && this.isActive;
  }

  get isOccupied(): boolean {
    return this.status === UnitStatus.OCCUPIED && !!this.currentTenantId;
  }

  get daysUntilAvailable(): number {
    if (!this.availableDate) return 0;
    const today = new Date();
    const diffTime = this.availableDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get leaseExpiresSoon(): boolean {
    if (!this.leaseEndDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.leaseEndDate <= thirtyDaysFromNow && this.leaseEndDate > new Date();
  }

  get monthsRemainingOnLease(): number {
    if (!this.leaseEndDate) return 0;
    const today = new Date();
    const diffTime = this.leaseEndDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  get rentPerSquareFoot(): number {
    if (!this.squareFootage || this.squareFootage === 0) return 0;
    return this.rentAmount / this.squareFootage;
  }

  get unitDisplayName(): string {
    return this.unitName || `Unit ${this.unitNumber}`;
  }

  get bedroomBathroomDisplay(): string {
    const bedDisplay = this.bedrooms === 0 ? 'Studio' : `${this.bedrooms} bed`;
    const bathDisplay = this.bathrooms === 1 ? '1 bath' : `${this.bathrooms} baths`;
    return `${bedDisplay}, ${bathDisplay}`;
  }
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PropertyImage } from './PropertyImage';
import { PropertyDocument } from './PropertyDocument';
import { Unit } from './Unit';
import { PropertyAmenity } from './PropertyAmenity';

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  DUPLEX = 'DUPLEX',
  STUDIO = 'STUDIO',
  COMMERCIAL = 'COMMERCIAL',
  OFFICE = 'OFFICE',
  RETAIL = 'RETAIL',
  WAREHOUSE = 'WAREHOUSE'
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  DRAFT = 'DRAFT'
}

export enum ListingStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  PENDING = 'PENDING',
  OFF_MARKET = 'OFF_MARKET',
  MAINTENANCE = 'MAINTENANCE'
}

@Entity('properties')
@Index(['ownerId'])
@Index(['propertyType'])
@Index(['status'])
@Index(['city', 'state'])
@Index(['zipCode'])
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  ownerId: string; // Reference to user ID in auth service

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: PropertyType
  })
  propertyType: PropertyType;

  @Column({
    type: 'enum',
    enum: PropertyStatus,
    default: PropertyStatus.DRAFT
  })
  status: PropertyStatus;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.OFF_MARKET
  })
  listingStatus: ListingStatus;

  // Address Information
  @Column()
  streetAddress: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  zipCode: string;

  @Column()
  country: string;

  // Geographic coordinates for mapping
  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // Property Details
  @Column('int', { default: 1 })
  bedrooms: number;

  @Column('decimal', { precision: 3, scale: 1, default: 1.0 })
  bathrooms: number;

  @Column('int', { nullable: true })
  squareFootage?: number;

  @Column('int', { nullable: true })
  lotSize?: number;

  @Column('int', { nullable: true })
  yearBuilt?: number;

  @Column('int', { default: 0 })
  parkingSpaces: number;

  @Column({ default: false })
  petFriendly: boolean;

  @Column({ default: false })
  smokingAllowed: boolean;

  @Column({ default: false })
  furnished: boolean;

  // Financial Information
  @Column('decimal', { precision: 10, scale: 2 })
  rentAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  securityDeposit?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  applicationFee?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  petDeposit?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  propertyValue?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  monthlyMortgage?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  propertyTaxes?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  insurance?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  hoaFees?: number;

  // Lease Terms
  @Column('int', { default: 12 })
  minLeaseTermMonths: number;

  @Column('int', { default: 12 })
  maxLeaseTermMonths: number;

  @Column({ nullable: true })
  availableDate?: Date;

  // Utilities
  @Column({ default: false })
  electricityIncluded: boolean;

  @Column({ default: false })
  gasIncluded: boolean;

  @Column({ default: false })
  waterIncluded: boolean;

  @Column({ default: false })
  internetIncluded: boolean;

  @Column({ default: false })
  cableIncluded: boolean;

  @Column({ default: false })
  trashIncluded: boolean;

  // Property Features
  @Column('text', { array: true, default: [] })
  features: string[];

  @Column('text', { array: true, default: [] })
  appliances: string[];

  @Column('text', { array: true, default: [] })
  floorTypes: string[];

  // Marketing
  @Column({ nullable: true })
  virtualTourUrl?: string;

  @Column({ nullable: true })
  videoUrl?: string;

  @Column('text', { array: true, default: [] })
  keywords: string[];

  // Analytics
  @Column('int', { default: 0 })
  viewCount: number;

  @Column('int', { default: 0 })
  inquiryCount: number;

  @Column('int', { default: 0 })
  applicationCount: number;

  @Column({ nullable: true })
  lastViewedAt?: Date;

  // SEO and Marketing
  @Column({ nullable: true })
  metaTitle?: string;

  @Column('text', { nullable: true })
  metaDescription?: string;

  @Column({ nullable: true })
  slug?: string;

  // System fields
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => PropertyImage, image => image.property, { cascade: true })
  images: PropertyImage[];

  @OneToMany(() => PropertyDocument, document => document.property, { cascade: true })
  documents: PropertyDocument[];

  @OneToMany(() => Unit, unit => unit.property, { cascade: true })
  units: Unit[];

  @OneToMany(() => PropertyAmenity, amenity => amenity.property, { cascade: true })
  amenities: PropertyAmenity[];

  // Computed properties
  get fullAddress(): string {
    const parts = [this.streetAddress];
    if (this.addressLine2) parts.push(this.addressLine2);
    parts.push(`${this.city}, ${this.state} ${this.zipCode}`);
    return parts.join(', ');
  }

  get totalMonthlyExpenses(): number {
    const expenses = [
      this.monthlyMortgage || 0,
      this.propertyTaxes || 0,
      this.insurance || 0,
      this.hoaFees || 0
    ];
    return expenses.reduce((sum, expense) => sum + expense, 0);
  }

  get netCashFlow(): number {
    return this.rentAmount - this.totalMonthlyExpenses;
  }

  get capRate(): number {
    if (!this.propertyValue || this.propertyValue === 0) return 0;
    const annualIncome = this.rentAmount * 12;
    const annualExpenses = this.totalMonthlyExpenses * 12;
    return ((annualIncome - annualExpenses) / this.propertyValue) * 100;
  }

  get isAvailable(): boolean {
    return this.listingStatus === ListingStatus.AVAILABLE && 
           this.status === PropertyStatus.ACTIVE &&
           this.isPublished &&
           this.isActive;
  }
}
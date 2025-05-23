import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Property } from './Property';

export enum AmenityCategory {
  BUILDING = 'BUILDING',
  UNIT = 'UNIT',
  OUTDOOR = 'OUTDOOR',
  PARKING = 'PARKING',
  FITNESS = 'FITNESS',
  ENTERTAINMENT = 'ENTERTAINMENT',
  BUSINESS = 'BUSINESS',
  SAFETY = 'SAFETY',
  ACCESSIBILITY = 'ACCESSIBILITY',
  UTILITIES = 'UTILITIES',
  APPLIANCES = 'APPLIANCES',
  OTHER = 'OTHER'
}

@Entity('property_amenities')
@Index(['propertyId'])
@Index(['category'])
export class PropertyAmenity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  propertyId: string;

  @ManyToOne(() => Property, property => property.amenities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AmenityCategory
  })
  category: AmenityCategory;

  @Column({ default: true })
  isIncluded: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  additionalCost?: number;

  @Column({ nullable: true })
  iconName?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column('int', { default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isHighlight: boolean; // Featured amenity

  // Operating hours (for amenities like pools, gyms)
  @Column('simple-json', { nullable: true })
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };

  // Capacity and restrictions
  @Column('int', { nullable: true })
  capacity?: number;

  @Column('int', { nullable: true })
  ageRestriction?: number;

  @Column({ default: false })
  requiresReservation: boolean;

  @Column({ default: false })
  requiresDeposit: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  depositAmount?: number;

  // Maintenance
  @Column({ nullable: true })
  lastMaintenanceDate?: Date;

  @Column({ nullable: true })
  nextMaintenanceDate?: Date;

  @Column('text', { nullable: true })
  maintenanceNotes?: string;

  @Column({ default: true })
  isOperational: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isAvailable(): boolean {
    return this.isActive && this.isOperational;
  }

  get hasCost(): boolean {
    return !!this.additionalCost && this.additionalCost > 0;
  }

  get costDisplay(): string {
    if (!this.hasCost) return 'Included';
    return `$${this.additionalCost}/month`;
  }

  get needsMaintenance(): boolean {
    if (!this.nextMaintenanceDate) return false;
    return this.nextMaintenanceDate <= new Date();
  }

  get isOverdueMaintenance(): boolean {
    if (!this.nextMaintenanceDate) return false;
    const today = new Date();
    return this.nextMaintenanceDate < today;
  }

  get categoryDisplay(): string {
    return this.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}

// Common amenities by category for reference
export const COMMON_AMENITIES = {
  [AmenityCategory.BUILDING]: [
    'Elevator',
    'Lobby',
    'Concierge',
    'Mail Room',
    'Package Room',
    'Laundry Room',
    'Storage Units',
    'Bike Storage',
    'Rooftop Access'
  ],
  [AmenityCategory.UNIT]: [
    'Hardwood Floors',
    'Carpet',
    'Tile Floors',
    'High Ceilings',
    'Walk-in Closet',
    'Balcony',
    'Patio',
    'Private Entrance',
    'Fireplace',
    'Central Air',
    'Ceiling Fans'
  ],
  [AmenityCategory.OUTDOOR]: [
    'Swimming Pool',
    'Hot Tub',
    'BBQ Area',
    'Outdoor Kitchen',
    'Garden',
    'Playground',
    'Dog Run',
    'Tennis Court',
    'Basketball Court',
    'Jogging Trail'
  ],
  [AmenityCategory.PARKING]: [
    'Garage Parking',
    'Covered Parking',
    'Street Parking',
    'Valet Parking',
    'Electric Vehicle Charging',
    'Guest Parking'
  ],
  [AmenityCategory.FITNESS]: [
    'Fitness Center',
    'Yoga Studio',
    'Spin Room',
    'Personal Training',
    'Sauna',
    'Steam Room'
  ],
  [AmenityCategory.ENTERTAINMENT]: [
    'Club Room',
    'Game Room',
    'Movie Theater',
    'Library',
    'Music Room',
    'Party Room'
  ],
  [AmenityCategory.BUSINESS]: [
    'Business Center',
    'Conference Room',
    'Co-working Space',
    'High-Speed Internet',
    'WiFi'
  ],
  [AmenityCategory.SAFETY]: [
    'Security System',
    'Doorman',
    'Keycard Access',
    'Security Cameras',
    'Gated Community',
    'Emergency Lighting'
  ],
  [AmenityCategory.ACCESSIBILITY]: [
    'Wheelchair Accessible',
    'Elevator',
    'Accessible Parking',
    'Accessible Bathrooms',
    'Wide Doorways'
  ],
  [AmenityCategory.UTILITIES]: [
    'Electricity Included',
    'Gas Included',
    'Water Included',
    'Trash Included',
    'Internet Included',
    'Cable Included'
  ],
  [AmenityCategory.APPLIANCES]: [
    'Refrigerator',
    'Dishwasher',
    'Microwave',
    'Washer/Dryer',
    'Oven/Range',
    'Garbage Disposal',
    'Air Conditioning'
  ]
};
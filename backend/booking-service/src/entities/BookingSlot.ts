import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './Booking';
import { AvailabilityTemplate } from './AvailabilityTemplate';

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
  TENTATIVE = 'TENTATIVE'
}

export enum SlotType {
  REGULAR = 'REGULAR',
  BREAK = 'BREAK',
  LUNCH = 'LUNCH',
  BUFFER = 'BUFFER',
  MAINTENANCE = 'MAINTENANCE',
  SPECIAL = 'SPECIAL'
}

@Entity('booking_slots')
export class BookingSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'integer', default: 60 })
  duration: number; // in minutes

  @Column({ type: 'enum', enum: SlotStatus, default: SlotStatus.AVAILABLE })
  status: SlotStatus;

  @Column({ type: 'enum', enum: SlotType, default: SlotType.REGULAR })
  type: SlotType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceId: string; // Could be user ID, room ID, equipment ID, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceType: string; // 'user', 'room', 'vehicle', 'equipment', etc.

  @Column({ type: 'uuid', nullable: true })
  propertyId: string;

  @Column({ type: 'uuid', nullable: true })
  unitId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string;

  @Column({ type: 'integer', default: 1 })
  capacity: number; // Number of bookings this slot can handle

  @Column({ type: 'integer', default: 0 })
  bookedCount: number; // Current number of bookings

  @Column({ type: 'boolean', default: true })
  isBookable: boolean;

  @Column({ type: 'boolean', default: false })
  requiresApproval: boolean;

  @Column({ type: 'jsonb', nullable: true })
  allowedBookingTypes: string[]; // Types of bookings allowed for this slot

  @Column({ type: 'integer', nullable: true })
  minBookingDuration: number; // Minimum booking duration in minutes

  @Column({ type: 'integer', nullable: true })
  maxBookingDuration: number; // Maximum booking duration in minutes

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number; // Cost for booking this slot

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  pricing: Record<string, any>; // Complex pricing rules

  @Column({ type: 'text', nullable: true })
  bookingRules: string; // Rules and restrictions for booking

  @Column({ type: 'jsonb', nullable: true })
  requiredCapabilities: string[]; // Required skills/capabilities for bookings

  @Column({ type: 'integer', nullable: true })
  bufferTimeBefore: number; // Buffer time before slot in minutes

  @Column({ type: 'integer', nullable: true })
  bufferTimeAfter: number; // Buffer time after slot in minutes

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recurringPattern: string; // RRULE string

  @Column({ type: 'uuid', nullable: true })
  parentSlotId: string; // For recurring instances

  @Column({ type: 'varchar', length: 255, nullable: true })
  blockedReason: string; // Reason if slot is blocked

  @Column({ type: 'varchar', length: 255, nullable: true })
  blockedBy: string; // Who blocked the slot

  @Column({ type: 'timestamp', nullable: true })
  blockedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Booking, booking => booking.slot)
  bookings: Booking[];

  @ManyToOne(() => AvailabilityTemplate, template => template.slots, { nullable: true })
  @JoinColumn({ name: 'templateId' })
  template: AvailabilityTemplate;

  @Column({ type: 'uuid', nullable: true })
  templateId: string;

  @OneToMany(() => BookingSlot, slot => slot.parentSlotId)
  recurringInstances: BookingSlot[];
}
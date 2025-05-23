import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BookingSlot } from './BookingSlot';

export enum TemplateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT'
}

export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6
}

@Entity('availability_templates')
export class AvailabilityTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.ACTIVE })
  status: TemplateStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceId: string; // User ID, room ID, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceType: string; // 'user', 'room', 'vehicle', etc.

  @Column({ type: 'uuid', nullable: true })
  propertyId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'date', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo: Date;

  @Column({ type: 'jsonb', nullable: true })
  weeklySchedule: Record<string, {
    isAvailable: boolean;
    timeSlots: Array<{
      startTime: string; // HH:mm format
      endTime: string;   // HH:mm format
      slotDuration?: number; // minutes
      breakDuration?: number; // minutes between slots
      capacity?: number;
      isBookable?: boolean;
      allowedBookingTypes?: string[];
      cost?: number;
      currency?: string;
    }>;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  holidayOverrides: Array<{
    date: string; // YYYY-MM-DD format
    isAvailable: boolean;
    reason?: string;
    timeSlots?: Array<{
      startTime: string;
      endTime: string;
      slotDuration?: number;
      capacity?: number;
      isBookable?: boolean;
    }>;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  specialDates: Array<{
    date: string; // YYYY-MM-DD format
    name: string;
    isAvailable: boolean;
    timeSlots?: Array<{
      startTime: string;
      endTime: string;
      slotDuration?: number;
      capacity?: number;
      cost?: number;
    }>;
  }>;

  @Column({ type: 'integer', default: 30 })
  defaultSlotDuration: number; // in minutes

  @Column({ type: 'integer', default: 0 })
  defaultBreakDuration: number; // in minutes

  @Column({ type: 'integer', default: 1 })
  defaultCapacity: number;

  @Column({ type: 'integer', nullable: true })
  minBookingNotice: number; // hours

  @Column({ type: 'integer', nullable: true })
  maxAdvanceBooking: number; // days

  @Column({ type: 'boolean', default: true })
  allowBackToBackBookings: boolean;

  @Column({ type: 'integer', nullable: true })
  bufferTimeBetweenBookings: number; // minutes

  @Column({ type: 'jsonb', nullable: true })
  defaultBookingTypes: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  defaultCost: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  defaultCurrency: string;

  @Column({ type: 'jsonb', nullable: true })
  autoApprovalRules: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  requiresApproval: boolean;

  @Column({ type: 'jsonb', nullable: true })
  notificationSettings: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  bookingInstructions: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255 })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => BookingSlot, slot => slot.template)
  slots: BookingSlot[];

  // Computed fields (not stored in DB)
  get isCurrentlyActive(): boolean {
    const now = new Date();
    const fromDate = this.effectiveFrom ? new Date(this.effectiveFrom) : null;
    const toDate = this.effectiveTo ? new Date(this.effectiveTo) : null;

    if (this.status !== TemplateStatus.ACTIVE) return false;
    if (fromDate && now < fromDate) return false;
    if (toDate && now > toDate) return false;
    
    return true;
  }
}
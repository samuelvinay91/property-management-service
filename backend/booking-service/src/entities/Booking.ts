import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BookingSlot } from './BookingSlot';
import { Participant } from './Participant';

export enum BookingType {
  PROPERTY_VIEWING = 'PROPERTY_VIEWING',
  MAINTENANCE_APPOINTMENT = 'MAINTENANCE_APPOINTMENT',
  INSPECTION = 'INSPECTION',
  MOVE_IN = 'MOVE_IN',
  MOVE_OUT = 'MOVE_OUT',
  CONSULTATION = 'CONSULTATION',
  MEETING = 'MEETING',
  PROPERTY_TOUR = 'PROPERTY_TOUR',
  VIRTUAL_TOUR = 'VIRTUAL_TOUR',
  OTHER = 'OTHER'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

export enum BookingPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: BookingType })
  type: BookingType;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'enum', enum: BookingPriority, default: BookingPriority.MEDIUM })
  priority: BookingPriority;

  @Column({ type: 'uuid' })
  propertyId: string;

  @Column({ type: 'uuid', nullable: true })
  unitId: string;

  @Column({ type: 'varchar', length: 255 })
  requestedBy: string;

  @Column({ type: 'varchar', length: 100 })
  requestedByType: string; // 'tenant', 'owner', 'agent', 'vendor', etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'integer', default: 60 })
  duration: number; // in minutes

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  virtualMeetingUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  virtualMeetingId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  virtualMeetingPassword: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string;

  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ type: 'jsonb', nullable: true })
  requirements: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  attendeeInstructions: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recurringPattern: string; // RRULE string

  @Column({ type: 'uuid', nullable: true })
  parentBookingId: string; // For recurring instances

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  requiresConfirmation: boolean;

  @Column({ type: 'boolean', default: true })
  allowRescheduling: boolean;

  @Column({ type: 'integer', nullable: true })
  minNoticeHours: number; // Minimum hours before booking can be cancelled/rescheduled

  @Column({ type: 'integer', nullable: true })
  maxAdvanceBookingDays: number; // Maximum days in advance booking can be made

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancellationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  confirmedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelledBy: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  completionNotes: string;

  @Column({ type: 'integer', nullable: true })
  rating: number; // 1-5 star rating

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  reminders: Array<{
    type: 'email' | 'sms' | 'push';
    minutesBefore: number;
    sent: boolean;
    sentAt?: Date;
  }>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  calendarEventId: string; // External calendar event ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => BookingSlot, slot => slot.bookings, { nullable: true })
  @JoinColumn({ name: 'slotId' })
  slot: BookingSlot;

  @Column({ type: 'uuid', nullable: true })
  slotId: string;

  @OneToMany(() => Participant, participant => participant.booking, { cascade: true })
  participants: Participant[];

  @OneToMany(() => Booking, booking => booking.parentBookingId)
  recurringInstances: Booking[];
}
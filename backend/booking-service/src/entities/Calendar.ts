import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BookingSlot } from './BookingSlot';

export enum CalendarType {
  PERSONAL = 'PERSONAL',
  SHARED = 'SHARED',
  RESOURCE = 'RESOURCE',
  PROPERTY = 'PROPERTY',
  TEAM = 'TEAM'
}

export enum CalendarStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

@Entity('calendars')
export class Calendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CalendarType })
  type: CalendarType;

  @Column({ type: 'enum', enum: CalendarStatus, default: CalendarStatus.ACTIVE })
  status: CalendarStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ownerId: string; // User who owns this calendar

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceId: string; // Resource this calendar represents (room, vehicle, etc.)

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceType: string;

  @Column({ type: 'uuid', nullable: true })
  propertyId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string; // Hex color for UI display

  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ type: 'boolean', default: true })
  allowBookings: boolean;

  @Column({ type: 'boolean', default: false })
  requiresApproval: boolean;

  @Column({ type: 'jsonb', nullable: true })
  permissions: Record<string, string[]>; // userId -> ['read', 'write', 'admin']

  @Column({ type: 'jsonb', nullable: true })
  defaultBookingSettings: {
    duration?: number;
    bufferTime?: number;
    allowedTypes?: string[];
    requiresApproval?: boolean;
    maxAdvanceBooking?: number;
    minNoticeHours?: number;
  };

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalCalendarId: string; // Google Calendar, Outlook, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  externalProvider: string; // 'google', 'outlook', 'apple', etc.

  @Column({ type: 'jsonb', nullable: true })
  syncSettings: {
    enabled?: boolean;
    bidirectional?: boolean;
    syncEvents?: boolean;
    syncAvailability?: boolean;
    lastSyncAt?: Date;
    syncErrors?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  workingHours: Record<string, {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  }>;

  @Column({ type: 'jsonb', nullable: true })
  holidays: Array<{
    date: string; // YYYY-MM-DD
    name: string;
    isRecurring: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  blockedDates: Array<{
    date: string;
    reason: string;
    blockedBy: string;
    blockedAt: Date;
  }>;

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
  @OneToMany(() => BookingSlot, slot => slot.resourceId)
  slots: BookingSlot[];
}
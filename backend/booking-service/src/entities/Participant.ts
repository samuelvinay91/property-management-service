import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './Booking';

export enum ParticipantRole {
  ORGANIZER = 'ORGANIZER',
  ATTENDEE = 'ATTENDEE',
  PRESENTER = 'PRESENTER',
  OBSERVER = 'OBSERVER',
  REQUIRED = 'REQUIRED',
  OPTIONAL = 'OPTIONAL'
}

export enum ParticipantStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  TENTATIVE = 'TENTATIVE',
  NO_RESPONSE = 'NO_RESPONSE',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW'
}

export enum ParticipantType {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  AGENT = 'AGENT',
  VENDOR = 'VENDOR',
  INSPECTOR = 'INSPECTOR',
  MANAGER = 'MANAGER',
  GUEST = 'GUEST',
  EXTERNAL = 'EXTERNAL'
}

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userId: string; // Internal user ID if registered user

  @Column({ type: 'enum', enum: ParticipantType })
  type: ParticipantType;

  @Column({ type: 'enum', enum: ParticipantRole, default: ParticipantRole.ATTENDEE })
  role: ParticipantRole;

  @Column({ type: 'enum', enum: ParticipantStatus, default: ParticipantStatus.INVITED })
  status: ParticipantStatus;

  @Column({ type: 'boolean', default: false })
  isOrganizer: boolean;

  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ type: 'boolean', default: true })
  canReschedule: boolean;

  @Column({ type: 'boolean', default: true })
  canCancel: boolean;

  @Column({ type: 'timestamp', nullable: true })
  invitedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ type: 'text', nullable: true })
  responseMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkedOutAt: Date;

  @Column({ type: 'text', nullable: true })
  specialRequirements: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  calendarEventId: string; // External calendar event ID

  @Column({ type: 'boolean', default: true })
  receiveReminders: boolean;

  @Column({ type: 'boolean', default: true })
  receiveUpdates: boolean;

  @Column({ type: 'jsonb', nullable: true })
  notificationPreferences: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    reminderMinutes?: number[];
  };

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Booking, booking => booking.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid' })
  bookingId: string;
}
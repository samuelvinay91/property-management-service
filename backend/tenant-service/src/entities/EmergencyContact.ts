import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';

export enum ContactRelationship {
  SPOUSE = 'SPOUSE',
  PARENT = 'PARENT',
  CHILD = 'CHILD',
  SIBLING = 'SIBLING',
  FRIEND = 'FRIEND',
  COWORKER = 'COWORKER',
  NEIGHBOR = 'NEIGHBOR',
  RELATIVE = 'RELATIVE',
  GUARDIAN = 'GUARDIAN',
  EMPLOYER = 'EMPLOYER',
  OTHER = 'OTHER'
}

@Entity('emergency_contacts')
@Index(['tenantId'])
@Index(['isPrimary'])
export class EmergencyContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.emergencyContacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({
    type: 'enum',
    enum: ContactRelationship
  })
  relationship: ContactRelationship;

  @Column({ length: 50, nullable: true })
  customRelationship?: string; // For when relationship is 'OTHER'

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 20, nullable: true })
  alternatePhone?: string;

  @Column({ length: 200, nullable: true })
  email?: string;

  // Address Information
  @Column({ length: 500, nullable: true })
  address?: string;

  @Column({ length: 100, nullable: true })
  city?: string;

  @Column({ length: 10, nullable: true })
  state?: string;

  @Column({ length: 20, nullable: true })
  zipCode?: string;

  @Column({ length: 100, nullable: true })
  country?: string;

  // Contact Preferences
  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'boolean', default: true })
  canContactByPhone: boolean;

  @Column({ type: 'boolean', default: true })
  canContactByEmail: boolean;

  @Column({ type: 'boolean', default: false })
  canContactBySms: boolean;

  // Additional Information
  @Column({ length: 100, nullable: true })
  occupation?: string;

  @Column({ length: 200, nullable: true })
  workplace?: string;

  @Column({ length: 20, nullable: true })
  workPhone?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Availability
  @Column({ type: 'simple-json', nullable: true })
  availabilityHours?: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };

  @Column({ length: 50, nullable: true })
  preferredContactTime?: string; // e.g., "Morning", "Afternoon", "Evening"

  @Column({ length: 100, nullable: true })
  timeZone?: string;

  // Emergency Contact Specifics
  @Column({ type: 'boolean', default: true })
  authorizedToPickupKeys: boolean;

  @Column({ type: 'boolean', default: false })
  authorizedForMedicalEmergency: boolean;

  @Column({ type: 'boolean', default: true })
  authorizedForPropertyEmergency: boolean;

  @Column({ type: 'boolean', default: false })
  hasSpareKeys: boolean;

  // Verification
  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ length: 100, nullable: true })
  verifiedBy?: string; // Staff member who verified

  @Column({ type: 'simple-json', nullable: true })
  verificationMethod?: {
    type: 'phone' | 'email' | 'in_person' | 'mail';
    details?: string;
  };

  // Contact History
  @Column({ type: 'timestamp', nullable: true })
  lastContactedAt?: Date;

  @Column({ length: 500, nullable: true })
  lastContactReason?: string;

  @Column({ type: 'simple-json', nullable: true })
  contactHistory?: Array<{
    date: string;
    reason: string;
    method: 'phone' | 'email' | 'sms' | 'in_person';
    successful: boolean;
    notes?: string;
  }>;

  // Language and Communication
  @Column({ length: 10, default: 'en' })
  preferredLanguage: string;

  @Column({ type: 'boolean', default: false })
  requiresTranslator: boolean;

  @Column({ length: 100, nullable: true })
  interpreterLanguage?: string;

  // System fields
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed Properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get displayRelationship(): string {
    if (this.relationship === ContactRelationship.OTHER && this.customRelationship) {
      return this.customRelationship;
    }
    return this.relationship.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  get primaryContactMethod(): string {
    if (this.canContactByPhone) return 'phone';
    if (this.canContactByEmail && this.email) return 'email';
    if (this.canContactBySms) return 'sms';
    return 'none';
  }

  get isAvailableNow(): boolean {
    if (!this.availabilityHours) return true;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' }) as keyof typeof this.availabilityHours;
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const todayHours = this.availabilityHours[currentDay];
    if (!todayHours) return false;
    
    return currentTime >= todayHours.start && currentTime <= todayHours.end;
  }

  get contactMethods(): string[] {
    const methods: string[] = [];
    if (this.canContactByPhone) methods.push('Phone');
    if (this.canContactByEmail && this.email) methods.push('Email');
    if (this.canContactBySms) methods.push('SMS');
    return methods;
  }

  get daysSinceLastContact(): number | null {
    if (!this.lastContactedAt) return null;
    const today = new Date();
    const diffTime = today.getTime() - this.lastContactedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  get hasValidContactInfo(): boolean {
    return !!(this.phone || (this.email && this.canContactByEmail));
  }

  get authorizationLevel(): string {
    const authorizations: string[] = [];
    if (this.authorizedToPickupKeys) authorizations.push('Key Pickup');
    if (this.authorizedForMedicalEmergency) authorizations.push('Medical Emergency');
    if (this.authorizedForPropertyEmergency) authorizations.push('Property Emergency');
    return authorizations.join(', ') || 'None';
  }

  get contactReliabilityScore(): number {
    if (!this.contactHistory || this.contactHistory.length === 0) return 100;
    
    const successfulContacts = this.contactHistory.filter(contact => contact.successful).length;
    return Math.round((successfulContacts / this.contactHistory.length) * 100);
  }
}
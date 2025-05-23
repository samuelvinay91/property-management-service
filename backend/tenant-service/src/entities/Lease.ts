import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';

export enum LeaseStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  RENEWED = 'RENEWED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED'
}

export enum LeaseType {
  FIXED_TERM = 'FIXED_TERM',
  MONTH_TO_MONTH = 'MONTH_TO_MONTH',
  WEEK_TO_WEEK = 'WEEK_TO_WEEK',
  SUBLEASE = 'SUBLEASE',
  CORPORATE = 'CORPORATE',
  STUDENT = 'STUDENT',
  SENIOR = 'SENIOR',
  AFFORDABLE_HOUSING = 'AFFORDABLE_HOUSING'
}

export enum RentFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY'
}

export enum TerminationReason {
  NATURAL_EXPIRY = 'NATURAL_EXPIRY',
  TENANT_REQUEST = 'TENANT_REQUEST',
  LANDLORD_REQUEST = 'LANDLORD_REQUEST',
  NON_PAYMENT = 'NON_PAYMENT',
  LEASE_VIOLATION = 'LEASE_VIOLATION',
  PROPERTY_DAMAGE = 'PROPERTY_DAMAGE',
  ILLEGAL_ACTIVITY = 'ILLEGAL_ACTIVITY',
  SALE_OF_PROPERTY = 'SALE_OF_PROPERTY',
  RENOVATION = 'RENOVATION',
  MUTUAL_AGREEMENT = 'MUTUAL_AGREEMENT',
  OTHER = 'OTHER'
}

@Entity('leases')
@Index(['tenantId'])
@Index(['propertyId'])
@Index(['unitId'])
@Index(['status'])
@Index(['startDate'])
@Index(['endDate'])
export class Lease {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.leases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  propertyId: string; // Reference to property

  @Column({ nullable: true })
  unitId?: string; // Reference to unit

  @Column({ length: 100, unique: true })
  leaseNumber: string;

  @Column({
    type: 'enum',
    enum: LeaseStatus,
    default: LeaseStatus.DRAFT
  })
  status: LeaseStatus;

  @Column({
    type: 'enum',
    enum: LeaseType,
    default: LeaseType.FIXED_TERM
  })
  leaseType: LeaseType;

  // Lease Duration
  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ type: 'int' })
  leaseTerm: number; // Duration in months/weeks/days based on type

  @Column({ length: 20, default: 'months' })
  leaseTermUnit: string; // 'months', 'weeks', 'days'

  // Rent Information
  @Column('decimal', { precision: 10, scale: 2 })
  monthlyRent: number;

  @Column({
    type: 'enum',
    enum: RentFrequency,
    default: RentFrequency.MONTHLY
  })
  rentFrequency: RentFrequency;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  securityDeposit: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  petDeposit: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  keyDeposit: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cleaningDeposit: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  lastMonthRent: number;

  // Payment Details
  @Column({ type: 'int', default: 1 })
  rentDueDay: number; // Day of month rent is due

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  lateFeeAmount: number;

  @Column({ type: 'int', default: 5 })
  lateFeeGracePeriod: number; // Days after due date before late fee applies

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  lateFeePercentage: number;

  @Column({ type: 'boolean', default: false })
  autoPayEnabled: boolean;

  // Occupancy Information
  @Column({ type: 'int', default: 1 })
  maxOccupants: number;

  @Column({ type: 'simple-json', nullable: true })
  occupants?: Array<{
    name: string;
    relationship: string;
    dateOfBirth?: string;
    isLeaseholder: boolean;
  }>;

  // Pet Information
  @Column({ type: 'boolean', default: false })
  petsAllowed: boolean;

  @Column({ type: 'int', default: 0 })
  maxPets: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  petRent: number; // Monthly pet rent

  @Column({ type: 'simple-json', nullable: true })
  petDetails?: Array<{
    type: string;
    breed?: string;
    name: string;
    weight?: number;
    age?: number;
    vaccinated: boolean;
    spayedNeutered: boolean;
  }>;

  // Utilities and Services
  @Column({ type: 'simple-json', nullable: true })
  utilitiesIncluded?: {
    electricity?: boolean;
    gas?: boolean;
    water?: boolean;
    sewer?: boolean;
    trash?: boolean;
    internet?: boolean;
    cable?: boolean;
    heating?: boolean;
    airConditioning?: boolean;
  };

  @Column({ type: 'simple-json', nullable: true })
  additionalFees?: Array<{
    name: string;
    amount: number;
    frequency: string;
    description?: string;
  }>;

  // Lease Terms and Conditions
  @Column({ type: 'boolean', default: false })
  smokingAllowed: boolean;

  @Column({ type: 'boolean', default: false })
  sublettingAllowed: boolean;

  @Column({ type: 'text', nullable: true })
  specialTerms?: string;

  @Column({ type: 'text', nullable: true })
  restrictions?: string;

  @Column({ type: 'simple-json', nullable: true })
  amenitiesIncluded?: string[];

  // Renewal Information
  @Column({ type: 'boolean', default: false })
  autoRenewal: boolean;

  @Column({ type: 'int', default: 30 })
  renewalNoticeRequired: number; // Days notice required for renewal

  @Column({ type: 'int', default: 30 })
  terminationNoticeRequired: number; // Days notice required for termination

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  rentIncreasePercentage: number; // For renewal

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  renewalRent?: number;

  // Termination Information
  @Column({ type: 'timestamp', nullable: true })
  terminationDate?: Date;

  @Column({
    type: 'enum',
    enum: TerminationReason,
    nullable: true
  })
  terminationReason?: TerminationReason;

  @Column({ type: 'text', nullable: true })
  terminationNotes?: string;

  @Column({ type: 'timestamp', nullable: true })
  noticeGivenDate?: Date;

  @Column({ length: 100, nullable: true })
  terminatedBy?: string; // User ID who terminated

  // Move-in/Move-out
  @Column({ type: 'timestamp', nullable: true })
  moveInDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  moveOutDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  keyHandoverDate?: Date;

  @Column({ type: 'boolean', default: false })
  moveInInspectionCompleted: boolean;

  @Column({ type: 'boolean', default: false })
  moveOutInspectionCompleted: boolean;

  @Column({ type: 'simple-json', nullable: true })
  moveInCondition?: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  moveOutCondition?: Record<string, any>;

  // Document References
  @Column({ length: 500, nullable: true })
  leaseDocumentUrl?: string;

  @Column({ type: 'simple-json', nullable: true })
  additionalDocuments?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;

  // Signatures and Approvals
  @Column({ type: 'boolean', default: false })
  tenantSigned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  tenantSignedAt?: Date;

  @Column({ type: 'boolean', default: false })
  landlordSigned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  landlordSignedAt?: Date;

  @Column({ type: 'simple-json', nullable: true })
  digitalSignatures?: Array<{
    signerId: string;
    signerName: string;
    signerRole: string;
    signedAt: string;
    signature: string;
    ipAddress?: string;
  }>;

  // Insurance and Liability
  @Column({ type: 'boolean', default: false })
  renterInsuranceRequired: boolean;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  minimumCoverageAmount?: number;

  @Column({ type: 'text', nullable: true })
  insuranceProvider?: string;

  @Column({ length: 100, nullable: true })
  policyNumber?: string;

  @Column({ type: 'timestamp', nullable: true })
  insuranceExpiryDate?: Date;

  // Maintenance and Repairs
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tenantMaintenanceLimit: number; // Amount tenant can approve without landlord

  @Column({ type: 'simple-json', nullable: true })
  maintenanceResponsibilities?: {
    tenant: string[];
    landlord: string[];
  };

  // Financial Information
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalLeaseValue: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  proRatedRent?: number; // For partial month

  @Column({ type: 'simple-json', nullable: true })
  paymentHistory?: Array<{
    date: string;
    amount: number;
    type: string;
    status: string;
  }>;

  // Communication Preferences
  @Column({ type: 'simple-json', nullable: true })
  communicationPreferences?: {
    email: boolean;
    sms: boolean;
    phone: boolean;
    mail: boolean;
    preferredMethod: string;
  };

  // Emergency Contact
  @Column({ length: 200, nullable: true })
  emergencyContactName?: string;

  @Column({ length: 20, nullable: true })
  emergencyContactPhone?: string;

  @Column({ length: 100, nullable: true })
  emergencyContactRelationship?: string;

  // System fields
  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed Properties
  get totalDeposits(): number {
    return this.securityDeposit + this.petDeposit + this.keyDeposit + this.cleaningDeposit + this.lastMonthRent;
  }

  get daysRemaining(): number {
    const today = new Date();
    const diffTime = this.endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isExpired(): boolean {
    return this.endDate < new Date();
  }

  get isActive(): boolean {
    const today = new Date();
    return this.status === LeaseStatus.ACTIVE && 
           this.startDate <= today && 
           this.endDate >= today;
  }

  get monthsRemaining(): number {
    const today = new Date();
    const months = (this.endDate.getFullYear() - today.getFullYear()) * 12 + 
                   (this.endDate.getMonth() - today.getMonth());
    return Math.max(0, months);
  }

  get weeklyRent(): number {
    switch (this.rentFrequency) {
      case RentFrequency.WEEKLY:
        return this.monthlyRent;
      case RentFrequency.BIWEEKLY:
        return this.monthlyRent / 2;
      case RentFrequency.MONTHLY:
        return this.monthlyRent / 4.33; // Average weeks per month
      default:
        return this.monthlyRent / 4.33;
    }
  }

  get dailyRent(): number {
    return this.monthlyRent / 30.44; // Average days per month
  }

  get totalRentOverTerm(): number {
    return this.monthlyRent * this.leaseTerm;
  }

  get occupancyRate(): number {
    if (!this.occupants) return 0;
    return (this.occupants.length / this.maxOccupants) * 100;
  }

  get isFullyOccupied(): boolean {
    return this.occupants ? this.occupants.length >= this.maxOccupants : false;
  }

  get daysUntilExpiry(): number {
    return this.daysRemaining;
  }

  get isRenewalEligible(): boolean {
    const renewalDate = new Date(this.endDate);
    renewalDate.setDate(renewalDate.getDate() - this.renewalNoticeRequired);
    return new Date() >= renewalDate && this.status === LeaseStatus.ACTIVE;
  }

  get totalMonthlyPayment(): number {
    const additionalFees = this.additionalFees?.reduce((sum, fee) => {
      return fee.frequency === 'monthly' ? sum + fee.amount : sum;
    }, 0) || 0;
    
    return this.monthlyRent + this.petRent + additionalFees;
  }

  get isFullySigned(): boolean {
    return this.tenantSigned && this.landlordSigned;
  }

  get signatureProgress(): number {
    const signatures = [this.tenantSigned, this.landlordSigned];
    const completedSignatures = signatures.filter(signed => signed).length;
    return (completedSignatures / signatures.length) * 100;
  }

  get effectiveLeaseTerm(): string {
    return `${this.leaseTerm} ${this.leaseTermUnit}`;
  }

  get rentPerSquareFoot(): number | null {
    // This would require unit square footage data
    // For now, return null - can be calculated when unit data is available
    return null;
  }
}
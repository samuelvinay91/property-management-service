import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, Index } from 'typeorm';
import { Tenant } from './Tenant';
import { ApplicationReview } from './ApplicationReview';

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  APPROVED = 'APPROVED',
  CONDITIONALLY_APPROVED = 'CONDITIONALLY_APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED'
}

export enum ApplicationType {
  NEW_LEASE = 'NEW_LEASE',
  LEASE_RENEWAL = 'LEASE_RENEWAL',
  LEASE_TRANSFER = 'LEASE_TRANSFER',
  SUBLEASE = 'SUBLEASE'
}

@Entity('applications')
@Index(['propertyId'])
@Index(['unitId'])
@Index(['status'])
@Index(['submittedAt'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, tenant => tenant.applications)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  propertyId: string;

  @Column('uuid', { nullable: true })
  unitId?: string;

  @Column({
    type: 'enum',
    enum: ApplicationType,
    default: ApplicationType.NEW_LEASE
  })
  type: ApplicationType;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT
  })
  status: ApplicationStatus;

  // Application Details
  @Column({ type: 'date', nullable: true })
  desiredMoveInDate?: Date;

  @Column({ type: 'date', nullable: true })
  desiredMoveOutDate?: Date;

  @Column({ type: 'int', default: 12 })
  desiredLeaseTerm: number; // in months

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  proposedRent?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  securityDepositAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  applicationFee?: number;

  // Co-applicants and Occupants
  @Column({ type: 'int', default: 1 })
  numberOfApplicants: number;

  @Column({ type: 'int', default: 1 })
  totalOccupants: number;

  @Column({ type: 'simple-json', nullable: true })
  coApplicants?: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    relationship: string;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  additionalOccupants?: Array<{
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    relationship: string;
  }>;

  // Vehicle Information
  @Column({ type: 'simple-json', nullable: true })
  vehicles?: Array<{
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    state: string;
  }>;

  // Pet Information
  @Column({ type: 'boolean', default: false })
  hasPets: boolean;

  @Column({ type: 'simple-json', nullable: true })
  pets?: Array<{
    type: string;
    breed: string;
    name: string;
    age: number;
    weight: number;
    isServiceAnimal: boolean;
    vaccinated: boolean;
    spayedNeutered: boolean;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  petDeposit?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  petRent?: number;

  // Special Requirements
  @Column({ type: 'text', nullable: true })
  specialRequests?: string;

  @Column({ type: 'text', nullable: true })
  reasonForMoving?: string;

  @Column({ type: 'text', nullable: true })
  additionalInformation?: string;

  // Screening Results
  @Column({ type: 'boolean', default: false })
  backgroundCheckRequested: boolean;

  @Column({ type: 'boolean', default: false })
  creditCheckRequested: boolean;

  @Column({ type: 'boolean', default: false })
  incomeVerificationRequested: boolean;

  @Column({ type: 'boolean', default: false })
  referenceCheckRequested: boolean;

  @Column({ type: 'boolean', default: false })
  backgroundCheckPassed: boolean;

  @Column({ type: 'boolean', default: false })
  creditCheckPassed: boolean;

  @Column({ type: 'boolean', default: false })
  incomeVerificationPassed: boolean;

  @Column({ type: 'boolean', default: false })
  referenceCheckPassed: boolean;

  // Scores and Ratings
  @Column({ type: 'int', nullable: true })
  overallScore?: number; // 0-100

  @Column({ type: 'int', nullable: true })
  creditScore?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  incomeToRentRatio?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  debtToIncomeRatio?: number;

  // Decision Information
  @Column({ type: 'text', nullable: true })
  approvalNotes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'simple-json', nullable: true })
  conditions?: Array<{
    type: string;
    description: string;
    required: boolean;
    fulfilled: boolean;
  }>;

  // Important Dates
  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewStartedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  decisionMadeAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  withdrawnAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  // Processing Information
  @Column('uuid', { nullable: true })
  reviewedBy?: string; // User ID of reviewer

  @Column('uuid', { nullable: true })
  assignedTo?: string; // User ID of assigned reviewer

  @Column({ type: 'int', default: 0 })
  revisionCount: number;

  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  // Communication
  @Column({ type: 'timestamp', nullable: true })
  lastContactedAt?: Date;

  @Column({ type: 'int', default: 0 })
  remindersSent: number;

  // Metadata
  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  screeningData?: Record<string, any>;

  @OneToMany(() => ApplicationReview, review => review.application)
  reviews: ApplicationReview[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed Properties
  get daysInReview(): number {
    if (!this.reviewStartedAt) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.reviewStartedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysSinceSubmission(): number {
    if (!this.submittedAt) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.submittedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get screeningProgress(): number {
    const checks = [
      this.backgroundCheckPassed,
      this.creditCheckPassed,
      this.incomeVerificationPassed,
      this.referenceCheckPassed
    ];
    const completedChecks = checks.filter(check => check).length;
    return (completedChecks / checks.length) * 100;
  }

  get canApprove(): boolean {
    return this.status === ApplicationStatus.UNDER_REVIEW && 
           this.backgroundCheckPassed && 
           this.creditCheckPassed && 
           this.incomeVerificationPassed && 
           this.referenceCheckPassed;
  }

  get totalMonthlyPayment(): number {
    let total = this.proposedRent || 0;
    total += this.petRent || 0;
    return total;
  }

  get displayStatus(): string {
    switch (this.status) {
      case ApplicationStatus.DRAFT:
        return 'Draft';
      case ApplicationStatus.SUBMITTED:
        return 'Submitted';
      case ApplicationStatus.UNDER_REVIEW:
        return 'Under Review';
      case ApplicationStatus.PENDING_VERIFICATION:
        return 'Pending Verification';
      case ApplicationStatus.APPROVED:
        return 'Approved';
      case ApplicationStatus.CONDITIONALLY_APPROVED:
        return 'Conditionally Approved';
      case ApplicationStatus.REJECTED:
        return 'Rejected';
      case ApplicationStatus.WITHDRAWN:
        return 'Withdrawn';
      case ApplicationStatus.EXPIRED:
        return 'Expired';
      default:
        return 'Unknown';
    }
  }
}
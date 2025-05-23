import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Application } from './Application';
import { TenantDocument } from './TenantDocument';
import { Lease } from './Lease';
import { EmergencyContact } from './EmergencyContact';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED'
}

export enum IdentificationType {
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PASSPORT = 'PASSPORT',
  STATE_ID = 'STATE_ID',
  MILITARY_ID = 'MILITARY_ID',
  OTHER = 'OTHER'
}

@Entity('tenants')
@Index(['email'])
@Index(['phone'])
@Index(['status'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 200, unique: true })
  @Index()
  email: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING_VERIFICATION
  })
  status: TenantStatus;

  // Address Information
  @Column({ length: 500, nullable: true })
  currentAddress?: string;

  @Column({ length: 100, nullable: true })
  currentCity?: string;

  @Column({ length: 10, nullable: true })
  currentState?: string;

  @Column({ length: 20, nullable: true })
  currentZipCode?: string;

  @Column({ length: 100, nullable: true })
  currentCountry?: string;

  @Column({ type: 'date', nullable: true })
  currentAddressSince?: Date;

  // Previous Address
  @Column({ length: 500, nullable: true })
  previousAddress?: string;

  @Column({ length: 100, nullable: true })
  previousCity?: string;

  @Column({ length: 10, nullable: true })
  previousState?: string;

  @Column({ length: 20, nullable: true })
  previousZipCode?: string;

  @Column({ type: 'date', nullable: true })
  previousAddressFrom?: Date;

  @Column({ type: 'date', nullable: true })
  previousAddressTo?: Date;

  // Employment Information
  @Column({ length: 200, nullable: true })
  employerName?: string;

  @Column({ length: 100, nullable: true })
  jobTitle?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  monthlyIncome?: number;

  @Column({ type: 'date', nullable: true })
  employmentStartDate?: Date;

  @Column({ length: 500, nullable: true })
  employerAddress?: string;

  @Column({ length: 20, nullable: true })
  employerPhone?: string;

  @Column({ length: 200, nullable: true })
  supervisorName?: string;

  // Previous Employment
  @Column({ length: 200, nullable: true })
  previousEmployerName?: string;

  @Column({ length: 100, nullable: true })
  previousJobTitle?: string;

  @Column({ type: 'date', nullable: true })
  previousEmploymentFrom?: Date;

  @Column({ type: 'date', nullable: true })
  previousEmploymentTo?: Date;

  // Financial Information
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalMonthlyIncome?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlyDebtPayments?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  bankAccountBalance?: string;

  @Column({ length: 200, nullable: true })
  bankName?: string;

  @Column({ length: 50, nullable: true })
  bankAccountType?: string;

  // Identification
  @Column({
    type: 'enum',
    enum: IdentificationType,
    nullable: true
  })
  identificationType?: IdentificationType;

  @Column({ length: 100, nullable: true })
  identificationNumber?: string;

  @Column({ type: 'date', nullable: true })
  identificationExpiryDate?: Date;

  @Column({ length: 100, nullable: true })
  socialSecurityNumber?: string;

  // Rental History
  @Column({ length: 200, nullable: true })
  currentLandlordName?: string;

  @Column({ length: 20, nullable: true })
  currentLandlordPhone?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentRentAmount?: number;

  @Column({ length: 500, nullable: true })
  reasonForMoving?: string;

  // Previous Landlord
  @Column({ length: 200, nullable: true })
  previousLandlordName?: string;

  @Column({ length: 20, nullable: true })
  previousLandlordPhone?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  previousRentAmount?: number;

  // Personal Information
  @Column({ type: 'boolean', default: false })
  hasPets: boolean;

  @Column({ type: 'text', nullable: true })
  petDescription?: string;

  @Column({ type: 'boolean', default: false })
  smoker: boolean;

  @Column({ type: 'int', default: 1 })
  numberOfOccupants: number;

  @Column({ type: 'text', nullable: true })
  additionalOccupants?: string;

  // References
  @Column({ length: 200, nullable: true })
  personalReferenceName?: string;

  @Column({ length: 20, nullable: true })
  personalReferencePhone?: string;

  @Column({ length: 200, nullable: true })
  personalReferenceRelationship?: string;

  // Verification Status
  @Column({ type: 'boolean', default: false })
  identityVerified: boolean;

  @Column({ type: 'boolean', default: false })
  incomeVerified: boolean;

  @Column({ type: 'boolean', default: false })
  backgroundCheckCompleted: boolean;

  @Column({ type: 'boolean', default: false })
  creditCheckCompleted: boolean;

  @Column({ type: 'boolean', default: false })
  referencesVerified: boolean;

  // Verification Dates
  @Column({ type: 'timestamp', nullable: true })
  identityVerifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  incomeVerifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  backgroundCheckCompletedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  creditCheckCompletedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  referencesVerifiedAt?: Date;

  // Credit Information
  @Column({ type: 'int', nullable: true })
  creditScore?: number;

  @Column({ length: 500, nullable: true })
  creditReportUrl?: string;

  @Column({ type: 'timestamp', nullable: true })
  creditReportDate?: Date;

  // Background Check Information
  @Column({ type: 'boolean', default: false })
  hasConvictions: boolean;

  @Column({ type: 'text', nullable: true })
  convictionDetails?: string;

  @Column({ type: 'boolean', default: false })
  hasEvictions: boolean;

  @Column({ type: 'text', nullable: true })
  evictionDetails?: string;

  // Profile and Preferences
  @Column({ length: 500, nullable: true })
  profileImageUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'simple-json', nullable: true })
  preferences?: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  // Security
  @Column({ length: 255, nullable: true })
  hashedPassword?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Application, application => application.tenant)
  applications: Application[];

  @OneToMany(() => TenantDocument, document => document.tenant)
  documents: TenantDocument[];

  @OneToMany(() => Lease, lease => lease.tenant)
  leases: Lease[];

  @OneToMany(() => EmergencyContact, contact => contact.tenant)
  emergencyContacts: EmergencyContact[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed Properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  get debtToIncomeRatio(): number | null {
    if (!this.totalMonthlyIncome || !this.monthlyDebtPayments) return null;
    return (this.monthlyDebtPayments / this.totalMonthlyIncome) * 100;
  }

  get verificationProgress(): number {
    const checks = [
      this.identityVerified,
      this.incomeVerified,
      this.backgroundCheckCompleted,
      this.creditCheckCompleted,
      this.referencesVerified
    ];
    const completedChecks = checks.filter(check => check).length;
    return (completedChecks / checks.length) * 100;
  }

  get isFullyVerified(): boolean {
    return this.verificationProgress === 100;
  }

  get incomeToRentRatio(): number | null {
    if (!this.totalMonthlyIncome || !this.currentRentAmount) return null;
    return (this.currentRentAmount / this.totalMonthlyIncome) * 100;
  }

  get displayStatus(): string {
    switch (this.status) {
      case TenantStatus.ACTIVE:
        return 'Active';
      case TenantStatus.INACTIVE:
        return 'Inactive';
      case TenantStatus.PENDING_VERIFICATION:
        return 'Pending Verification';
      case TenantStatus.SUSPENDED:
        return 'Suspended';
      case TenantStatus.TERMINATED:
        return 'Terminated';
      default:
        return 'Unknown';
    }
  }
}
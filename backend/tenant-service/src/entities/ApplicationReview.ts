import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, Index } from 'typeorm';
import { Application } from './Application';

export enum ReviewType {
  INITIAL_REVIEW = 'INITIAL_REVIEW',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
  CREDIT_CHECK = 'CREDIT_CHECK',
  INCOME_VERIFICATION = 'INCOME_VERIFICATION',
  REFERENCE_CHECK = 'REFERENCE_CHECK',
  FINAL_REVIEW = 'FINAL_REVIEW',
  APPEAL_REVIEW = 'APPEAL_REVIEW'
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum ReviewResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  CONDITIONAL = 'CONDITIONAL',
  PENDING_INFO = 'PENDING_INFO',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

@Entity('application_reviews')
@Index(['applicationId'])
@Index(['type'])
@Index(['status'])
@Index(['reviewedBy'])
export class ApplicationReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Application, application => application.reviews)
  @JoinColumn({ name: 'applicationId' })
  application: Application;

  @Column('uuid')
  applicationId: string;

  @Column({
    type: 'enum',
    enum: ReviewType
  })
  type: ReviewType;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING
  })
  status: ReviewStatus;

  @Column({
    type: 'enum',
    enum: ReviewResult,
    nullable: true
  })
  result?: ReviewResult;

  @Column('uuid', { nullable: true })
  reviewedBy?: string; // User ID of reviewer

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  // Review Details
  @Column({ type: 'int', nullable: true })
  score?: number; // 0-100

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  findings?: string;

  @Column({ type: 'text', nullable: true })
  recommendations?: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  // Specific Review Data
  @Column({ type: 'simple-json', nullable: true })
  checklistItems?: Array<{
    item: string;
    checked: boolean;
    notes?: string;
    required: boolean;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  conditions?: Array<{
    condition: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    fulfilled: boolean;
  }>;

  // External Service Data
  @Column({ length: 500, nullable: true })
  externalReportId?: string; // Third-party service report ID

  @Column({ length: 200, nullable: true })
  externalServiceProvider?: string; // e.g., 'Experian', 'CoreLogic'

  @Column({ type: 'simple-json', nullable: true })
  externalData?: Record<string, any>; // Raw data from external services

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  serviceCost?: number; // Cost of external service

  // Background Check Specific
  @Column({ type: 'boolean', nullable: true })
  criminalRecordFound?: boolean;

  @Column({ type: 'int', nullable: true })
  criminalRecordCount?: number;

  @Column({ type: 'boolean', nullable: true })
  evictionRecordFound?: boolean;

  @Column({ type: 'int', nullable: true })
  evictionRecordCount?: number;

  @Column({ type: 'boolean', nullable: true })
  sexOffenderFound?: boolean;

  // Credit Check Specific
  @Column({ type: 'int', nullable: true })
  creditScore?: number;

  @Column({ length: 50, nullable: true })
  creditGrade?: string; // A, B, C, D, F

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalDebt?: number;

  @Column({ type: 'int', nullable: true })
  openAccounts?: number;

  @Column({ type: 'int', nullable: true })
  delinquentAccounts?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  debtToIncomeRatio?: number;

  // Income Verification Specific
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  verifiedMonthlyIncome?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  statedMonthlyIncome?: number;

  @Column({ type: 'boolean', nullable: true })
  incomeDiscrepancy?: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  incomeToRentRatio?: number;

  @Column({ type: 'boolean', nullable: true })
  employmentVerified?: boolean;

  @Column({ type: 'int', nullable: true })
  employmentDuration?: number; // in months

  // Reference Check Specific
  @Column({ type: 'int', nullable: true })
  referencesContacted?: number;

  @Column({ type: 'int', nullable: true })
  referencesResponded?: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  averageReferenceRating?: number; // 1-5 scale

  @Column({ type: 'boolean', nullable: true })
  landlordRecommends?: boolean;

  @Column({ type: 'boolean', nullable: true })
  paymentHistoryGood?: boolean;

  @Column({ type: 'boolean', nullable: true })
  propertyConditionGood?: boolean;

  // Documents and Evidence
  @Column({ type: 'simple-json', nullable: true })
  documentsReviewed?: Array<{
    documentId: string;
    documentType: string;
    verified: boolean;
    notes?: string;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileType: string;
    uploadedAt: Date;
  }>;

  // Quality Assurance
  @Column('uuid', { nullable: true })
  qaReviewedBy?: string; // QA reviewer user ID

  @Column({ type: 'timestamp', nullable: true })
  qaReviewedAt?: Date;

  @Column({ type: 'boolean', default: false })
  qaApproved: boolean;

  @Column({ type: 'text', nullable: true })
  qaNotes?: string;

  // Metadata
  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  reviewVersion: number; // For tracking re-reviews

  @Column({ type: 'boolean', default: false })
  isAutomated: boolean; // True if automated review

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed Properties
  get reviewDuration(): number | null {
    if (!this.startedAt || !this.completedAt) return null;
    return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60 * 60)); // hours
  }

  get isOverdue(): boolean {
    return this.dueDate ? new Date() > this.dueDate && this.status !== ReviewStatus.COMPLETED : false;
  }

  get daysOverdue(): number {
    if (!this.isOverdue || !this.dueDate) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  get isPassing(): boolean {
    return this.result === ReviewResult.PASS || this.result === ReviewResult.CONDITIONAL;
  }

  get displayType(): string {
    switch (this.type) {
      case ReviewType.INITIAL_REVIEW:
        return 'Initial Review';
      case ReviewType.BACKGROUND_CHECK:
        return 'Background Check';
      case ReviewType.CREDIT_CHECK:
        return 'Credit Check';
      case ReviewType.INCOME_VERIFICATION:
        return 'Income Verification';
      case ReviewType.REFERENCE_CHECK:
        return 'Reference Check';
      case ReviewType.FINAL_REVIEW:
        return 'Final Review';
      case ReviewType.APPEAL_REVIEW:
        return 'Appeal Review';
      default:
        return 'Unknown Review';
    }
  }

  get displayStatus(): string {
    switch (this.status) {
      case ReviewStatus.PENDING:
        return 'Pending';
      case ReviewStatus.IN_PROGRESS:
        return 'In Progress';
      case ReviewStatus.COMPLETED:
        return 'Completed';
      case ReviewStatus.FAILED:
        return 'Failed';
      case ReviewStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  get displayResult(): string {
    if (!this.result) return 'No Result';
    
    switch (this.result) {
      case ReviewResult.PASS:
        return 'Pass';
      case ReviewResult.FAIL:
        return 'Fail';
      case ReviewResult.CONDITIONAL:
        return 'Conditional';
      case ReviewResult.PENDING_INFO:
        return 'Pending Information';
      case ReviewResult.NOT_APPLICABLE:
        return 'Not Applicable';
      default:
        return 'Unknown';
    }
  }
}
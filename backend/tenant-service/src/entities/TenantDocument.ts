import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, Index } from 'typeorm';
import { Tenant } from './Tenant';

export enum DocumentType {
  GOVERNMENT_ID = 'GOVERNMENT_ID',
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  SOCIAL_SECURITY_CARD = 'SOCIAL_SECURITY_CARD',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  PAY_STUB = 'PAY_STUB',
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  TAX_RETURN = 'TAX_RETURN',
  BANK_STATEMENT = 'BANK_STATEMENT',
  CREDIT_REPORT = 'CREDIT_REPORT',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
  REFERENCE_LETTER = 'REFERENCE_LETTER',
  LANDLORD_REFERENCE = 'LANDLORD_REFERENCE',
  UTILITY_BILL = 'UTILITY_BILL',
  LEASE_AGREEMENT = 'LEASE_AGREEMENT',
  INSURANCE_POLICY = 'INSURANCE_POLICY',
  PET_VACCINATION = 'PET_VACCINATION',
  OTHER = 'OTHER'
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  REQUIRES_UPDATE = 'REQUIRES_UPDATE'
}

@Entity('tenant_documents')
@Index(['tenantId'])
@Index(['type'])
@Index(['status'])
export class TenantDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, tenant => tenant.documents)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column('uuid')
  tenantId: string;

  @Column({
    type: 'enum',
    enum: DocumentType
  })
  type: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.UPLOADED
  })
  status: DocumentStatus;

  @Column({ length: 200 })
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 500, nullable: true })
  fileUrl?: string;

  @Column({ length: 50, nullable: true })
  mimeType?: string;

  @Column({ type: 'int', nullable: true })
  fileSize?: number; // in bytes

  @Column({ length: 100, nullable: true })
  fileHash?: string; // for integrity verification

  @Column({ length: 300, nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  documentDate?: Date; // Date the document was issued/created

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ length: 100, nullable: true })
  documentNumber?: string; // License number, passport number, etc.

  @Column({ length: 200, nullable: true })
  issuingAuthority?: string;

  // Verification Information
  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column('uuid', { nullable: true })
  verifiedBy?: string; // User ID who verified

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'text', nullable: true })
  verificationNotes?: string;

  // Review Information
  @Column('uuid', { nullable: true })
  reviewedBy?: string; // User ID who reviewed

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // OCR and Extracted Data
  @Column({ type: 'simple-json', nullable: true })
  extractedData?: Record<string, any>; // OCR extracted information

  @Column({ type: 'boolean', default: false })
  ocrProcessed: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  ocrConfidence?: number; // 0-100

  // Security and Privacy
  @Column({ type: 'boolean', default: false })
  isEncrypted: boolean;

  @Column({ type: 'boolean', default: false })
  isRedacted: boolean;

  @Column({ length: 500, nullable: true })
  redactedFilePath?: string;

  // Access Control
  @Column({ type: 'simple-json', nullable: true })
  accessPermissions?: Array<{
    userId: string;
    permission: string; // 'read', 'write', 'admin'
    grantedAt: Date;
    expiresAt?: Date;
  }>;

  // Audit Trail
  @Column({ type: 'simple-json', nullable: true })
  accessLog?: Array<{
    userId: string;
    action: string; // 'view', 'download', 'print'
    timestamp: Date;
    ipAddress?: string;
  }>;

  // Document Requirements
  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number; // 0 = low, 1 = medium, 2 = high

  @Column({ type: 'simple-json', nullable: true })
  requirements?: Array<{
    field: string;
    description: string;
    isMet: boolean;
  }>;

  // Metadata
  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ length: 200, nullable: true })
  uploadSource?: string; // 'web', 'mobile', 'api', 'email'

  @Column('uuid', { nullable: true })
  uploadedBy?: string; // User ID who uploaded

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed Properties
  get isExpired(): boolean {
    return this.expiryDate ? new Date() > this.expiryDate : false;
  }

  get isExpiringSoon(): boolean {
    if (!this.expiryDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.expiryDate <= thirtyDaysFromNow;
  }

  get fileSizeFormatted(): string {
    if (!this.fileSize) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.fileSize === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  get displayType(): string {
    switch (this.type) {
      case DocumentType.GOVERNMENT_ID:
        return 'Government ID';
      case DocumentType.DRIVERS_LICENSE:
        return "Driver's License";
      case DocumentType.SOCIAL_SECURITY_CARD:
        return 'Social Security Card';
      case DocumentType.BIRTH_CERTIFICATE:
        return 'Birth Certificate';
      case DocumentType.PAY_STUB:
        return 'Pay Stub';
      case DocumentType.EMPLOYMENT_LETTER:
        return 'Employment Letter';
      case DocumentType.TAX_RETURN:
        return 'Tax Return';
      case DocumentType.BANK_STATEMENT:
        return 'Bank Statement';
      case DocumentType.CREDIT_REPORT:
        return 'Credit Report';
      case DocumentType.BACKGROUND_CHECK:
        return 'Background Check';
      case DocumentType.REFERENCE_LETTER:
        return 'Reference Letter';
      case DocumentType.LANDLORD_REFERENCE:
        return 'Landlord Reference';
      case DocumentType.UTILITY_BILL:
        return 'Utility Bill';
      case DocumentType.LEASE_AGREEMENT:
        return 'Lease Agreement';
      case DocumentType.INSURANCE_POLICY:
        return 'Insurance Policy';
      case DocumentType.PET_VACCINATION:
        return 'Pet Vaccination Record';
      default:
        return 'Other Document';
    }
  }

  get displayStatus(): string {
    switch (this.status) {
      case DocumentStatus.UPLOADED:
        return 'Uploaded';
      case DocumentStatus.PENDING_REVIEW:
        return 'Pending Review';
      case DocumentStatus.APPROVED:
        return 'Approved';
      case DocumentStatus.REJECTED:
        return 'Rejected';
      case DocumentStatus.EXPIRED:
        return 'Expired';
      case DocumentStatus.REQUIRES_UPDATE:
        return 'Requires Update';
      default:
        return 'Unknown';
    }
  }

  get canDownload(): boolean {
    return this.status === DocumentStatus.APPROVED || 
           this.status === DocumentStatus.PENDING_REVIEW ||
           this.status === DocumentStatus.UPLOADED;
  }

  get needsAttention(): boolean {
    return this.status === DocumentStatus.REJECTED ||
           this.status === DocumentStatus.REQUIRES_UPDATE ||
           this.status === DocumentStatus.EXPIRED ||
           this.isExpiringSoon;
  }
}
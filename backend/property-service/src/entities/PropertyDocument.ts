import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Property } from './Property';

export enum DocumentType {
  LEASE_AGREEMENT = 'LEASE_AGREEMENT',
  PROPERTY_DEED = 'PROPERTY_DEED',
  INSURANCE_POLICY = 'INSURANCE_POLICY',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  FLOOR_PLAN = 'FLOOR_PLAN',
  HOA_DOCUMENTS = 'HOA_DOCUMENTS',
  TAX_RECORDS = 'TAX_RECORDS',
  UTILITY_BILLS = 'UTILITY_BILLS',
  MAINTENANCE_RECORDS = 'MAINTENANCE_RECORDS',
  RENTAL_APPLICATION = 'RENTAL_APPLICATION',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
  FINANCIAL_STATEMENTS = 'FINANCIAL_STATEMENTS',
  PERMITS = 'PERMITS',
  WARRANTIES = 'WARRANTIES',
  CONTRACTS = 'CONTRACTS',
  OTHER = 'OTHER'
}

export enum DocumentStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  EXPIRED = 'EXPIRED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  REJECTED = 'REJECTED'
}

@Entity('property_documents')
@Index(['propertyId'])
@Index(['documentType'])
@Index(['status'])
export class PropertyDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  propertyId: string;

  @ManyToOne(() => Property, property => property.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: DocumentType
  })
  documentType: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.ACTIVE
  })
  status: DocumentStatus;

  @Column()
  fileName: string;

  @Column()
  originalFileName: string;

  @Column()
  filePath: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column('bigint', { nullable: true })
  fileSize?: number;

  @Column('int', { nullable: true })
  pageCount?: number;

  // Access control
  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  requiresSignature: boolean;

  @Column({ default: false })
  isSigned: boolean;

  @Column({ nullable: true })
  signedBy?: string; // User ID

  @Column({ nullable: true })
  signedAt?: Date;

  // Document metadata
  @Column({ nullable: true })
  version?: string;

  @Column({ nullable: true })
  expirationDate?: Date;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column('simple-json', { nullable: true })
  metadata?: Record<string, any>;

  // Upload information
  @Column()
  uploadedBy: string; // User ID

  @Column({ nullable: true })
  lastModifiedBy?: string; // User ID

  // Approval workflow
  @Column({ nullable: true })
  approvedBy?: string; // User ID

  @Column({ nullable: true })
  approvedAt?: Date;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isExpired(): boolean {
    if (!this.expirationDate) return false;
    return this.expirationDate < new Date();
  }

  get isExpiringSoon(): boolean {
    if (!this.expirationDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.expirationDate <= thirtyDaysFromNow && this.expirationDate > new Date();
  }

  get fileSizeFormatted(): string {
    if (!this.fileSize) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Number(this.fileSize)) / Math.log(1024));
    return Math.round(Number(this.fileSize) / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  get fileExtension(): string {
    return this.fileName.split('.').pop()?.toLowerCase() || '';
  }

  get isPDF(): boolean {
    return this.mimeType === 'application/pdf' || this.fileExtension === 'pdf';
  }

  get isImage(): boolean {
    return this.mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(this.fileExtension);
  }

  get needsApproval(): boolean {
    return this.status === DocumentStatus.PENDING_REVIEW;
  }
}
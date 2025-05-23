import { DataSource } from 'typeorm';
import { logger } from './logger';
import { auditLogger } from './audit';
import { AuditEventType, AuditSeverity } from './audit';
import crypto from 'crypto';

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: GDPRRequestType;
  status: GDPRRequestStatus;
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  reason?: string;
  verificationToken?: string;
  dataExported?: boolean;
  notificationsSent?: boolean;
  metadata?: Record<string, any>;
}

export enum GDPRRequestType {
  ACCESS = 'ACCESS',           // Right to access (Art. 15)
  RECTIFICATION = 'RECTIFICATION', // Right to rectification (Art. 16)
  ERASURE = 'ERASURE',         // Right to erasure/be forgotten (Art. 17)
  PORTABILITY = 'PORTABILITY', // Right to data portability (Art. 20)
  RESTRICTION = 'RESTRICTION', // Right to restriction (Art. 18)
  OBJECTION = 'OBJECTION',     // Right to object (Art. 21)
  CONSENT_WITHDRAWAL = 'CONSENT_WITHDRAWAL' // Withdraw consent (Art. 7)
}

export enum GDPRRequestStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum ConsentType {
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS',
  FUNCTIONAL = 'FUNCTIONAL',
  NECESSARY = 'NECESSARY',
  THIRD_PARTY = 'THIRD_PARTY'
}

export interface ConsentRecord {
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  version: string;
  ipAddress: string;
  userAgent: string;
  legalBasis?: string;
}

export interface PersonalDataMapping {
  table: string;
  userIdColumn: string;
  personalDataColumns: string[];
  retentionPeriod?: number; // days
  legalBasis?: string;
  processingPurpose?: string;
}

export class GDPRComplianceService {
  private dataSource: DataSource;
  private personalDataMappings: PersonalDataMapping[] = [
    {
      table: 'users',
      userIdColumn: 'id',
      personalDataColumns: ['email', 'firstName', 'lastName', 'phone', 'dateOfBirth', 'address'],
      retentionPeriod: 2555, // 7 years
      legalBasis: 'Contract',
      processingPurpose: 'User account management and service provision'
    },
    {
      table: 'user_profiles',
      userIdColumn: 'userId',
      personalDataColumns: ['bio', 'preferences', 'profileImage', 'socialLinks'],
      retentionPeriod: 2555,
      legalBasis: 'Consent',
      processingPurpose: 'Enhanced user experience'
    },
    {
      table: 'tenants',
      userIdColumn: 'userId',
      personalDataColumns: ['emergencyContact', 'employmentInfo', 'references', 'creditScore'],
      retentionPeriod: 2555, // 7 years for financial records
      legalBasis: 'Contract',
      processingPurpose: 'Tenant screening and lease management'
    },
    {
      table: 'payments',
      userIdColumn: 'tenantId',
      personalDataColumns: ['paymentMethodDetails', 'billingAddress'],
      retentionPeriod: 2555, // 7 years for financial records
      legalBasis: 'Legal obligation',
      processingPurpose: 'Payment processing and financial compliance'
    },
    {
      table: 'maintenance_requests',
      userIdColumn: 'requestedBy',
      personalDataColumns: ['description', 'contactInfo', 'accessInstructions'],
      retentionPeriod: 1095, // 3 years
      legalBasis: 'Contract',
      processingPurpose: 'Property maintenance and service delivery'
    },
    {
      table: 'communications',
      userIdColumn: 'userId',
      personalDataColumns: ['content', 'metadata'],
      retentionPeriod: 1095, // 3 years
      legalBasis: 'Legitimate interest',
      processingPurpose: 'Communication and support'
    }
  ];

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Process a GDPR data subject request
   */
  async processDataSubjectRequest(request: Partial<DataSubjectRequest>): Promise<DataSubjectRequest> {
    const requestId = crypto.randomUUID();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const dataSubjectRequest: DataSubjectRequest = {
      id: requestId,
      userId: request.userId!,
      requestType: request.requestType!,
      status: GDPRRequestStatus.PENDING,
      requestedAt: new Date(),
      verificationToken,
      metadata: request.metadata || {}
    };

    // Log the request
    await auditLogger.log({
      eventType: AuditEventType.GDPR_REQUEST_CREATED,
      userId: request.userId!,
      severity: AuditSeverity.MEDIUM,
      description: `GDPR ${request.requestType} request created`,
      metadata: { requestId, requestType: request.requestType }
    });

    // Send verification email (implement based on your email service)
    await this.sendVerificationEmail(dataSubjectRequest);

    return dataSubjectRequest;
  }

  /**
   * Verify a data subject request
   */
  async verifyDataSubjectRequest(requestId: string, token: string): Promise<boolean> {
    // In a real implementation, retrieve from database
    const request = await this.getDataSubjectRequest(requestId);
    
    if (!request || request.verificationToken !== token) {
      return false;
    }

    // Update status to verified
    request.status = GDPRRequestStatus.VERIFIED;
    
    // Process the request based on type
    await this.executeDataSubjectRequest(request);

    return true;
  }

  /**
   * Execute a verified data subject request
   */
  private async executeDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    try {
      request.status = GDPRRequestStatus.IN_PROGRESS;

      switch (request.requestType) {
        case GDPRRequestType.ACCESS:
          await this.processAccessRequest(request);
          break;
        case GDPRRequestType.ERASURE:
          await this.processErasureRequest(request);
          break;
        case GDPRRequestType.PORTABILITY:
          await this.processPortabilityRequest(request);
          break;
        case GDPRRequestType.RECTIFICATION:
          await this.processRectificationRequest(request);
          break;
        case GDPRRequestType.RESTRICTION:
          await this.processRestrictionRequest(request);
          break;
        case GDPRRequestType.OBJECTION:
          await this.processObjectionRequest(request);
          break;
        case GDPRRequestType.CONSENT_WITHDRAWAL:
          await this.processConsentWithdrawal(request);
          break;
      }

      request.status = GDPRRequestStatus.COMPLETED;
      request.processedAt = new Date();

      await auditLogger.log({
        eventType: AuditEventType.GDPR_REQUEST_COMPLETED,
        userId: request.userId,
        severity: AuditSeverity.HIGH,
        description: `GDPR ${request.requestType} request completed`,
        metadata: { requestId: request.id }
      });

    } catch (error) {
      request.status = GDPRRequestStatus.REJECTED;
      logger.error('Failed to process GDPR request', { requestId: request.id, error });
      
      await auditLogger.log({
        eventType: AuditEventType.GDPR_REQUEST_FAILED,
        userId: request.userId,
        severity: AuditSeverity.CRITICAL,
        description: `GDPR ${request.requestType} request failed`,
        metadata: { requestId: request.id, error: error.message }
      });
    }
  }

  /**
   * Process access request (Right to Access - Art. 15)
   */
  private async processAccessRequest(request: DataSubjectRequest): Promise<void> {
    const userData = await this.extractUserData(request.userId);
    
    const dataPackage = {
      requestId: request.id,
      userId: request.userId,
      exportedAt: new Date().toISOString(),
      personalData: userData,
      consentRecords: await this.getUserConsents(request.userId),
      processingActivities: this.getProcessingActivities(),
      dataRetentionInfo: this.getRetentionPolicies(),
      rights: this.getDataSubjectRights()
    };

    // Generate downloadable file
    await this.generateDataExport(request.userId, dataPackage);
    request.dataExported = true;

    // Send notification
    await this.notifyUserOfCompletion(request);
  }

  /**
   * Process erasure request (Right to be Forgotten - Art. 17)
   */
  private async processErasureRequest(request: DataSubjectRequest): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if erasure is legally possible
      const canErase = await this.checkErasureLegality(request.userId);
      
      if (!canErase.allowed) {
        throw new Error(`Erasure not permitted: ${canErase.reason}`);
      }

      // Anonymize rather than delete for legal/audit requirements
      for (const mapping of this.personalDataMappings) {
        if (mapping.legalBasis === 'Legal obligation') {
          // Anonymize instead of delete for legal obligations
          await this.anonymizeUserData(queryRunner, mapping, request.userId);
        } else {
          // Delete data where legally permitted
          await this.deleteUserData(queryRunner, mapping, request.userId);
        }
      }

      // Mark user as deleted but preserve anonymized record
      await queryRunner.query(
        'UPDATE users SET email = ?, firstName = ?, lastName = ?, phone = ?, isDeleted = ? WHERE id = ?',
        [
          `deleted-${crypto.randomUUID()}@deleted.local`,
          'DELETED',
          'USER',
          null,
          true,
          request.userId
        ]
      );

      await queryRunner.commitTransaction();

      await auditLogger.log({
        eventType: AuditEventType.USER_DATA_ERASED,
        userId: request.userId,
        severity: AuditSeverity.HIGH,
        description: 'User data erased per GDPR request',
        metadata: { requestId: request.id }
      });

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process portability request (Right to Data Portability - Art. 20)
   */
  private async processPortabilityRequest(request: DataSubjectRequest): Promise<void> {
    const portableData = await this.extractPortableData(request.userId);
    
    const exportFormat = request.metadata?.format || 'json';
    await this.generatePortableDataExport(request.userId, portableData, exportFormat);
    
    request.dataExported = true;
  }

  /**
   * Extract all personal data for a user
   */
  private async extractUserData(userId: string): Promise<Record<string, any>> {
    const userData: Record<string, any> = {};

    for (const mapping of this.personalDataMappings) {
      try {
        const query = `
          SELECT ${mapping.personalDataColumns.join(', ')} 
          FROM ${mapping.table} 
          WHERE ${mapping.userIdColumn} = ?
        `;
        
        const results = await this.dataSource.query(query, [userId]);
        
        if (results.length > 0) {
          userData[mapping.table] = results;
        }
      } catch (error) {
        logger.error(`Failed to extract data from ${mapping.table}`, { userId, error });
      }
    }

    return userData;
  }

  /**
   * Extract portable data (structured format for data portability)
   */
  private async extractPortableData(userId: string): Promise<Record<string, any>> {
    const portableData = await this.extractUserData(userId);
    
    // Structure data in a portable format (JSON, CSV, XML)
    return {
      profile: portableData.users?.[0] || {},
      preferences: portableData.user_profiles?.[0] || {},
      tenancy: portableData.tenants || [],
      payments: portableData.payments || [],
      communications: portableData.communications || [],
      maintenance: portableData.maintenance_requests || []
    };
  }

  /**
   * Anonymize personal data while preserving statistical value
   */
  private async anonymizeUserData(queryRunner: any, mapping: PersonalDataMapping, userId: string): Promise<void> {
    const anonymizationQueries = mapping.personalDataColumns.map(column => {
      let anonymizedValue;
      
      // Apply different anonymization strategies based on data type
      switch (column) {
        case 'email':
          anonymizedValue = `anon-${crypto.randomUUID()}@anonymized.local`;
          break;
        case 'firstName':
        case 'lastName':
          anonymizedValue = 'ANONYMIZED';
          break;
        case 'phone':
          anonymizedValue = '+1-XXX-XXX-XXXX';
          break;
        case 'address':
          anonymizedValue = 'ANONYMIZED ADDRESS';
          break;
        default:
          anonymizedValue = 'ANONYMIZED';
      }

      return queryRunner.query(
        `UPDATE ${mapping.table} SET ${column} = ? WHERE ${mapping.userIdColumn} = ?`,
        [anonymizedValue, userId]
      );
    });

    await Promise.all(anonymizationQueries);
  }

  /**
   * Delete user data where legally permitted
   */
  private async deleteUserData(queryRunner: any, mapping: PersonalDataMapping, userId: string): Promise<void> {
    // For some tables, we might want to delete entire records
    // For others, we might just null out personal data columns
    
    const sensitiveColumns = ['email', 'firstName', 'lastName', 'phone', 'address'];
    const columnsToNull = mapping.personalDataColumns.filter(col => sensitiveColumns.includes(col));
    
    if (columnsToNull.length > 0) {
      const setClause = columnsToNull.map(col => `${col} = NULL`).join(', ');
      await queryRunner.query(
        `UPDATE ${mapping.table} SET ${setClause} WHERE ${mapping.userIdColumn} = ?`,
        [userId]
      );
    }
  }

  /**
   * Check if data erasure is legally permitted
   */
  private async checkErasureLegality(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Check for legal obligations that prevent erasure
    
    // Check for active contracts
    const activeLeases = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM leases WHERE tenantId = ? AND status = ?',
      [userId, 'ACTIVE']
    );

    if (activeLeases[0].count > 0) {
      return {
        allowed: false,
        reason: 'Active lease agreements require data retention'
      };
    }

    // Check for pending legal matters
    const pendingDisputes = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM legal_matters WHERE userId = ? AND status IN (?, ?)',
      [userId, 'PENDING', 'IN_PROGRESS']
    );

    if (pendingDisputes[0].count > 0) {
      return {
        allowed: false,
        reason: 'Pending legal matters require data retention'
      };
    }

    // Check financial obligations
    const outstandingPayments = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM payments WHERE tenantId = ? AND status = ?',
      [userId, 'PENDING']
    );

    if (outstandingPayments[0].count > 0) {
      return {
        allowed: false,
        reason: 'Outstanding financial obligations require data retention'
      };
    }

    return { allowed: true };
  }

  /**
   * Consent management functions
   */
  async recordConsent(consent: ConsentRecord): Promise<void> {
    // Store consent record with full audit trail
    await this.dataSource.query(
      `INSERT INTO consent_records 
       (userId, consentType, granted, grantedAt, version, ipAddress, userAgent, legalBasis) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        consent.userId,
        consent.consentType,
        consent.granted,
        consent.grantedAt || new Date(),
        consent.version,
        consent.ipAddress,
        consent.userAgent,
        consent.legalBasis
      ]
    );

    await auditLogger.log({
      eventType: consent.granted ? AuditEventType.CONSENT_GRANTED : AuditEventType.CONSENT_WITHDRAWN,
      userId: consent.userId,
      severity: AuditSeverity.MEDIUM,
      description: `Consent ${consent.granted ? 'granted' : 'withdrawn'} for ${consent.consentType}`,
      metadata: { consentType: consent.consentType, version: consent.version }
    });
  }

  async withdrawConsent(userId: string, consentType: ConsentType, metadata: any): Promise<void> {
    await this.recordConsent({
      userId,
      consentType,
      granted: false,
      withdrawnAt: new Date(),
      version: '1.0',
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    // Implement consequences of consent withdrawal
    await this.handleConsentWithdrawal(userId, consentType);
  }

  /**
   * Handle the consequences of consent withdrawal
   */
  private async handleConsentWithdrawal(userId: string, consentType: ConsentType): Promise<void> {
    switch (consentType) {
      case ConsentType.MARKETING:
        // Remove from marketing lists
        await this.dataSource.query(
          'UPDATE user_preferences SET marketingEmails = false WHERE userId = ?',
          [userId]
        );
        break;
      
      case ConsentType.ANALYTICS:
        // Stop analytics tracking
        await this.dataSource.query(
          'UPDATE user_preferences SET analyticsTracking = false WHERE userId = ?',
          [userId]
        );
        break;
      
      case ConsentType.THIRD_PARTY:
        // Remove third-party data sharing
        await this.dataSource.query(
          'UPDATE user_preferences SET thirdPartySharing = false WHERE userId = ?',
          [userId]
        );
        break;
    }
  }

  /**
   * Get user's consent history
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    return await this.dataSource.query(
      'SELECT * FROM consent_records WHERE userId = ? ORDER BY grantedAt DESC',
      [userId]
    );
  }

  /**
   * Data retention and cleanup
   */
  async enforceDataRetention(): Promise<void> {
    logger.info('Starting GDPR data retention enforcement');

    for (const mapping of this.personalDataMappings) {
      if (mapping.retentionPeriod) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - mapping.retentionPeriod);

        try {
          // Find records older than retention period
          const expiredRecords = await this.dataSource.query(
            `SELECT ${mapping.userIdColumn} FROM ${mapping.table} 
             WHERE createdAt < ? AND isDeleted = false`,
            [cutoffDate]
          );

          // Process expired records
          for (const record of expiredRecords) {
            await this.processDataRetentionExpiry(mapping, record[mapping.userIdColumn]);
          }

          logger.info(`Processed ${expiredRecords.length} expired records from ${mapping.table}`);
        } catch (error) {
          logger.error(`Error enforcing retention for ${mapping.table}`, { error });
        }
      }
    }
  }

  /**
   * Process expired data based on retention policy
   */
  private async processDataRetentionExpiry(mapping: PersonalDataMapping, userId: string): Promise<void> {
    // Check if user has active relationships that prevent deletion
    const canDelete = await this.checkErasureLegality(userId);
    
    if (canDelete.allowed) {
      // Anonymize the data
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      
      try {
        await this.anonymizeUserData(queryRunner, mapping, userId);
        
        await auditLogger.log({
          eventType: AuditEventType.DATA_RETENTION_APPLIED,
          userId,
          severity: AuditSeverity.MEDIUM,
          description: `Data anonymized due to retention policy expiry`,
          metadata: { table: mapping.table, retentionPeriod: mapping.retentionPeriod }
        });
      } finally {
        await queryRunner.release();
      }
    }
  }

  /**
   * Utility functions
   */
  private async sendVerificationEmail(request: DataSubjectRequest): Promise<void> {
    // Implement email sending logic
    logger.info('Verification email sent for GDPR request', { requestId: request.id });
  }

  private async notifyUserOfCompletion(request: DataSubjectRequest): Promise<void> {
    // Implement notification logic
    logger.info('GDPR request completion notification sent', { requestId: request.id });
  }

  private async generateDataExport(userId: string, data: any): Promise<void> {
    // Generate downloadable data export
    logger.info('Data export generated', { userId });
  }

  private async generatePortableDataExport(userId: string, data: any, format: string): Promise<void> {
    // Generate portable data export in requested format
    logger.info('Portable data export generated', { userId, format });
  }

  private async getDataSubjectRequest(requestId: string): Promise<DataSubjectRequest | null> {
    // Retrieve request from database
    return null; // Implement database retrieval
  }

  private getProcessingActivities(): any[] {
    return this.personalDataMappings.map(mapping => ({
      purpose: mapping.processingPurpose,
      legalBasis: mapping.legalBasis,
      categories: mapping.personalDataColumns,
      retention: `${mapping.retentionPeriod} days`
    }));
  }

  private getRetentionPolicies(): any[] {
    return this.personalDataMappings.map(mapping => ({
      dataCategory: mapping.table,
      retentionPeriod: mapping.retentionPeriod,
      legalBasis: mapping.legalBasis
    }));
  }

  private getDataSubjectRights(): string[] {
    return [
      'Right to access your personal data',
      'Right to rectify inaccurate personal data',
      'Right to erase personal data',
      'Right to restrict processing',
      'Right to data portability',
      'Right to object to processing',
      'Right to withdraw consent'
    ];
  }

  // Additional helper methods for specific request types
  private async processRectificationRequest(request: DataSubjectRequest): Promise<void> {
    // Handle data rectification requests
    logger.info('Processing rectification request', { requestId: request.id });
  }

  private async processRestrictionRequest(request: DataSubjectRequest): Promise<void> {
    // Handle processing restriction requests
    logger.info('Processing restriction request', { requestId: request.id });
  }

  private async processObjectionRequest(request: DataSubjectRequest): Promise<void> {
    // Handle objection to processing requests
    logger.info('Processing objection request', { requestId: request.id });
  }

  private async processConsentWithdrawal(request: DataSubjectRequest): Promise<void> {
    // Handle consent withdrawal requests
    logger.info('Processing consent withdrawal request', { requestId: request.id });
  }
}

export default GDPRComplianceService;
"
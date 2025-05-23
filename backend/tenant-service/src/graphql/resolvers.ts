import { TenantService } from '../services/TenantService';
import { ApplicationService } from '../services/ApplicationService';
import { ScreeningService } from '../services/ScreeningService';

const tenantService = new TenantService();
const applicationService = new ApplicationService();
const screeningService = new ScreeningService();

export const resolvers = {
  Query: {
    // Tenant Queries
    tenant: async (_: any, { id }: { id: string }) => {
      return tenantService.getTenantById(id);
    },

    tenantByEmail: async (_: any, { email }: { email: string }) => {
      return tenantService.getTenantByEmail(email);
    },

    tenants: async (_: any, { limit, offset }: { limit: number; offset: number }) => {
      return tenantService.getAllTenants(limit, offset);
    },

    searchTenants: async (_: any, { filters, limit, offset }: { filters: any; limit: number; offset: number }) => {
      return tenantService.searchTenants(filters, limit, offset);
    },

    tenantStats: async () => {
      return tenantService.getTenantStats();
    },

    // Application Queries
    application: async (_: any, { id }: { id: string }) => {
      return applicationService.getApplicationById(id);
    },

    applications: async (_: any, { limit, offset }: { limit: number; offset: number }) => {
      return applicationService.searchApplications({}, limit, offset);
    },

    searchApplications: async (_: any, { filters, limit, offset }: { filters: any; limit: number; offset: number }) => {
      return applicationService.searchApplications(filters, limit, offset);
    },

    applicationsByProperty: async (_: any, { propertyId, limit, offset }: { propertyId: string; limit: number; offset: number }) => {
      return applicationService.getApplicationsByProperty(propertyId, limit, offset);
    },

    applicationsByTenant: async (_: any, { tenantId }: { tenantId: string }) => {
      return applicationService.getApplicationsByTenant(tenantId);
    },

    applicationStats: async () => {
      return applicationService.getApplicationStats();
    },

    // Lease Queries
    lease: async (_: any, { id }: { id: string }) => {
      // This would be implemented when LeaseService is created
      throw new Error('Lease service not yet implemented');
    },

    leases: async (_: any, { limit, offset }: { limit: number; offset: number }) => {
      // This would be implemented when LeaseService is created
      throw new Error('Lease service not yet implemented');
    },

    leasesByTenant: async (_: any, { tenantId }: { tenantId: string }) => {
      return tenantService.getTenantLeases(tenantId);
    },

    leasesByProperty: async (_: any, { propertyId }: { propertyId: string }) => {
      // This would be implemented when LeaseService is created
      throw new Error('Lease service not yet implemented');
    },

    activeLeases: async (_: any, { tenantId }: { tenantId?: string }) => {
      if (tenantId) {
        return tenantService.getActiveLeases(tenantId);
      }
      // Return all active leases if no tenantId specified
      throw new Error('Lease service not yet implemented');
    },

    // Document Queries
    tenantDocuments: async (_: any, { tenantId }: { tenantId: string }) => {
      return tenantService.getTenantDocuments(tenantId);
    },

    // Emergency Contact Queries
    emergencyContacts: async (_: any, { tenantId }: { tenantId: string }) => {
      const tenant = await tenantService.getTenantById(tenantId);
      return tenant ? tenant.emergencyContacts : [];
    },

    // Screening Queries
    screeningStatus: async (_: any, { tenantId }: { tenantId: string }) => {
      return screeningService.getScreeningStatus(tenantId);
    }
  },

  Mutation: {
    // Tenant Mutations
    createTenant: async (_: any, { input }: { input: any }) => {
      return tenantService.createTenant(input);
    },

    updateTenant: async (_: any, { id, input }: { id: string; input: any }) => {
      return tenantService.updateTenant(id, input);
    },

    updateVerificationStatus: async (_: any, { id, input }: { id: string; input: any }) => {
      return tenantService.updateVerificationStatus(id, input);
    },

    deactivateTenant: async (_: any, { id, reason }: { id: string; reason?: string }) => {
      return tenantService.deactivateTenant(id, reason);
    },

    reactivateTenant: async (_: any, { id }: { id: string }) => {
      return tenantService.reactivateTenant(id);
    },

    deleteTenant: async (_: any, { id }: { id: string }) => {
      await tenantService.deleteTenant(id);
      return true;
    },

    // Application Mutations
    createApplication: async (_: any, { input }: { input: any }) => {
      return applicationService.createApplication(input);
    },

    updateApplication: async (_: any, { id, input }: { id: string; input: any }) => {
      return applicationService.updateApplication(id, input);
    },

    submitApplication: async (_: any, { id }: { id: string }) => {
      return applicationService.submitApplication(id);
    },

    startReview: async (_: any, { id, reviewerId }: { id: string; reviewerId?: string }) => {
      return applicationService.startReview(id, reviewerId);
    },

    makeDecision: async (_: any, { id, decision }: { id: string; decision: any }) => {
      return applicationService.makeDecision(id, decision);
    },

    withdrawApplication: async (_: any, { id, reason }: { id: string; reason?: string }) => {
      return applicationService.withdrawApplication(id, reason);
    },

    // Lease Mutations
    createLease: async (_: any, { input }: { input: any }) => {
      // This would be implemented when LeaseService is created
      throw new Error('Lease service not yet implemented');
    },

    updateLease: async (_: any, { id, input }: { id: string; input: any }) => {
      // This would be implemented when LeaseService is created
      throw new Error('Lease service not yet implemented');
    },

    signLease: async (_: any, { id, signerId, signerRole }: { id: string; signerId: string; signerRole: string }) => {
      // This would be implemented when LeaseService is created
      throw new Error('Lease service not yet implemented');
    },

    terminateLease: async (_: any, { id, reason, notes }: { id: string; reason: string; notes?: string }) => {
      // This would be implemented when LeaseService is created
      throw new Error('Lease service not yet implemented');
    },

    // Document Mutations
    addDocument: async (_: any, { tenantId, input }: { tenantId: string; input: any }) => {
      return tenantService.addDocument(tenantId, input);
    },

    updateDocument: async (_: any, { id, input }: { id: string; input: any }) => {
      // This would be implemented when DocumentService is created
      throw new Error('Document service not yet implemented');
    },

    deleteDocument: async (_: any, { id }: { id: string }) => {
      // This would be implemented when DocumentService is created
      throw new Error('Document service not yet implemented');
    },

    // Emergency Contact Mutations
    createEmergencyContact: async (_: any, { input }: { input: any }) => {
      // This would be implemented when EmergencyContactService is created
      throw new Error('Emergency contact service not yet implemented');
    },

    updateEmergencyContact: async (_: any, { id, input }: { id: string; input: any }) => {
      // This would be implemented when EmergencyContactService is created
      throw new Error('Emergency contact service not yet implemented');
    },

    deleteEmergencyContact: async (_: any, { id }: { id: string }) => {
      // This would be implemented when EmergencyContactService is created
      throw new Error('Emergency contact service not yet implemented');
    },

    // Screening Mutations
    initiateScreening: async (_: any, { tenantId, type }: { tenantId: string; type?: string }) => {
      await tenantService.initiateScreeningProcess(tenantId, type as 'BASIC' | 'COMPREHENSIVE');
      return true;
    },

    updateScreeningResult: async (_: any, { applicationId, type, passed, details }: { 
      applicationId: string; 
      type: string; 
      passed: boolean; 
      details?: any 
    }) => {
      return applicationService.updateScreeningResult(
        applicationId, 
        type as 'background' | 'credit' | 'income' | 'reference', 
        passed, 
        details
      );
    },

    // Utility Mutations
    expireOldApplications: async () => {
      return applicationService.expireOldApplications();
    }
  },

  // Field Resolvers
  Tenant: {
    fullName: (tenant: any) => `${tenant.firstName} ${tenant.lastName}`,
    
    age: (tenant: any) => {
      if (!tenant.dateOfBirth) return null;
      const today = new Date();
      const birthDate = new Date(tenant.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    },

    debtToIncomeRatio: (tenant: any) => {
      if (!tenant.totalMonthlyIncome || !tenant.monthlyDebtPayments) return null;
      return (tenant.monthlyDebtPayments / tenant.totalMonthlyIncome) * 100;
    },

    verificationProgress: (tenant: any) => {
      const checks = [
        tenant.identityVerified,
        tenant.incomeVerified,
        tenant.backgroundCheckCompleted,
        tenant.creditCheckCompleted,
        tenant.referencesVerified
      ];
      const completedChecks = checks.filter(check => check).length;
      return (completedChecks / checks.length) * 100;
    },

    isFullyVerified: (tenant: any) => {
      return tenant.identityVerified && 
             tenant.incomeVerified && 
             tenant.backgroundCheckCompleted && 
             tenant.creditCheckCompleted && 
             tenant.referencesVerified;
    },

    incomeToRentRatio: (tenant: any) => {
      if (!tenant.totalMonthlyIncome || !tenant.currentRentAmount) return null;
      return (tenant.currentRentAmount / tenant.totalMonthlyIncome) * 100;
    },

    displayStatus: (tenant: any) => {
      switch (tenant.status) {
        case 'ACTIVE': return 'Active';
        case 'INACTIVE': return 'Inactive';
        case 'PENDING_VERIFICATION': return 'Pending Verification';
        case 'SUSPENDED': return 'Suspended';
        case 'TERMINATED': return 'Terminated';
        default: return 'Unknown';
      }
    },

    applications: async (tenant: any) => {
      return applicationService.getApplicationsByTenant(tenant.id);
    },

    documents: async (tenant: any) => {
      return tenantService.getTenantDocuments(tenant.id);
    },

    leases: async (tenant: any) => {
      return tenantService.getTenantLeases(tenant.id);
    }
  },

  Application: {
    daysInReview: (application: any) => {
      if (!application.reviewStartedAt) return 0;
      const today = new Date();
      const diffTime = today.getTime() - new Date(application.reviewStartedAt).getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    },

    daysSinceSubmission: (application: any) => {
      if (!application.submittedAt) return 0;
      const today = new Date();
      const diffTime = today.getTime() - new Date(application.submittedAt).getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    },

    isExpired: (application: any) => {
      return application.expiresAt ? new Date() > new Date(application.expiresAt) : false;
    },

    screeningProgress: (application: any) => {
      const checks = [
        application.backgroundCheckPassed,
        application.creditCheckPassed,
        application.incomeVerificationPassed,
        application.referenceCheckPassed
      ];
      const completedChecks = checks.filter(check => check).length;
      return (completedChecks / checks.length) * 100;
    },

    canApprove: (application: any) => {
      return application.status === 'UNDER_REVIEW' && 
             application.backgroundCheckPassed && 
             application.creditCheckPassed && 
             application.incomeVerificationPassed && 
             application.referenceCheckPassed;
    },

    totalMonthlyPayment: (application: any) => {
      let total = application.proposedRent || 0;
      total += application.petRent || 0;
      return total;
    },

    displayStatus: (application: any) => {
      switch (application.status) {
        case 'DRAFT': return 'Draft';
        case 'SUBMITTED': return 'Submitted';
        case 'UNDER_REVIEW': return 'Under Review';
        case 'PENDING_VERIFICATION': return 'Pending Verification';
        case 'APPROVED': return 'Approved';
        case 'CONDITIONALLY_APPROVED': return 'Conditionally Approved';
        case 'REJECTED': return 'Rejected';
        case 'WITHDRAWN': return 'Withdrawn';
        case 'EXPIRED': return 'Expired';
        default: return 'Unknown';
      }
    },

    tenant: async (application: any) => {
      return tenantService.getTenantById(application.tenantId);
    }
  },

  Lease: {
    totalDeposits: (lease: any) => {
      return (lease.securityDeposit || 0) + 
             (lease.petDeposit || 0) + 
             (lease.keyDeposit || 0) + 
             (lease.cleaningDeposit || 0) + 
             (lease.lastMonthRent || 0);
    },

    daysRemaining: (lease: any) => {
      const today = new Date();
      const diffTime = new Date(lease.endDate).getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    isExpired: (lease: any) => {
      return new Date(lease.endDate) < new Date();
    },

    isActive: (lease: any) => {
      const today = new Date();
      return lease.status === 'ACTIVE' && 
             new Date(lease.startDate) <= today && 
             new Date(lease.endDate) >= today;
    },

    monthsRemaining: (lease: any) => {
      const today = new Date();
      const endDate = new Date(lease.endDate);
      const months = (endDate.getFullYear() - today.getFullYear()) * 12 + 
                     (endDate.getMonth() - today.getMonth());
      return Math.max(0, months);
    },

    weeklyRent: (lease: any) => {
      switch (lease.rentFrequency) {
        case 'WEEKLY': return lease.monthlyRent;
        case 'BIWEEKLY': return lease.monthlyRent / 2;
        case 'MONTHLY': return lease.monthlyRent / 4.33;
        default: return lease.monthlyRent / 4.33;
      }
    },

    dailyRent: (lease: any) => {
      return lease.monthlyRent / 30.44;
    },

    totalRentOverTerm: (lease: any) => {
      return lease.monthlyRent * lease.leaseTerm;
    },

    occupancyRate: (lease: any) => {
      if (!lease.occupants) return 0;
      return (lease.occupants.length / lease.maxOccupants) * 100;
    },

    isFullyOccupied: (lease: any) => {
      return lease.occupants ? lease.occupants.length >= lease.maxOccupants : false;
    },

    daysUntilExpiry: (lease: any) => {
      const today = new Date();
      const diffTime = new Date(lease.endDate).getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    isRenewalEligible: (lease: any) => {
      const renewalDate = new Date(lease.endDate);
      renewalDate.setDate(renewalDate.getDate() - lease.renewalNoticeRequired);
      return new Date() >= renewalDate && lease.status === 'ACTIVE';
    },

    totalMonthlyPayment: (lease: any) => {
      const additionalFees = lease.additionalFees?.reduce((sum: number, fee: any) => {
        return fee.frequency === 'monthly' ? sum + fee.amount : sum;
      }, 0) || 0;
      
      return lease.monthlyRent + (lease.petRent || 0) + additionalFees;
    },

    isFullySigned: (lease: any) => {
      return lease.tenantSigned && lease.landlordSigned;
    },

    signatureProgress: (lease: any) => {
      const signatures = [lease.tenantSigned, lease.landlordSigned];
      const completedSignatures = signatures.filter(signed => signed).length;
      return (completedSignatures / signatures.length) * 100;
    },

    effectiveLeaseTerm: (lease: any) => {
      return `${lease.leaseTerm} ${lease.leaseTermUnit}`;
    },

    tenant: async (lease: any) => {
      return tenantService.getTenantById(lease.tenantId);
    }
  },

  EmergencyContact: {
    fullName: (contact: any) => `${contact.firstName} ${contact.lastName}`,

    displayRelationship: (contact: any) => {
      if (contact.relationship === 'OTHER' && contact.customRelationship) {
        return contact.customRelationship;
      }
      return contact.relationship.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
    },

    primaryContactMethod: (contact: any) => {
      if (contact.canContactByPhone) return 'phone';
      if (contact.canContactByEmail && contact.email) return 'email';
      if (contact.canContactBySms) return 'sms';
      return 'none';
    },

    isAvailableNow: (contact: any) => {
      if (!contact.availabilityHours) return true;
      
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const currentTime = now.toTimeString().slice(0, 5);
      
      const todayHours = contact.availabilityHours[currentDay];
      if (!todayHours) return false;
      
      return currentTime >= todayHours.start && currentTime <= todayHours.end;
    },

    contactMethods: (contact: any) => {
      const methods: string[] = [];
      if (contact.canContactByPhone) methods.push('Phone');
      if (contact.canContactByEmail && contact.email) methods.push('Email');
      if (contact.canContactBySms) methods.push('SMS');
      return methods;
    },

    daysSinceLastContact: (contact: any) => {
      if (!contact.lastContactedAt) return null;
      const today = new Date();
      const diffTime = today.getTime() - new Date(contact.lastContactedAt).getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    },

    hasValidContactInfo: (contact: any) => {
      return !!(contact.phone || (contact.email && contact.canContactByEmail));
    },

    authorizationLevel: (contact: any) => {
      const authorizations: string[] = [];
      if (contact.authorizedToPickupKeys) authorizations.push('Key Pickup');
      if (contact.authorizedForMedicalEmergency) authorizations.push('Medical Emergency');
      if (contact.authorizedForPropertyEmergency) authorizations.push('Property Emergency');
      return authorizations.join(', ') || 'None';
    },

    contactReliabilityScore: (contact: any) => {
      if (!contact.contactHistory || contact.contactHistory.length === 0) return 100;
      
      const successfulContacts = contact.contactHistory.filter((contact: any) => contact.successful).length;
      return Math.round((successfulContacts / contact.contactHistory.length) * 100);
    },

    tenant: async (contact: any) => {
      return tenantService.getTenantById(contact.tenantId);
    }
  }
};
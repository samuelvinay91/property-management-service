import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  enum TenantStatus {
    ACTIVE
    INACTIVE
    PENDING_VERIFICATION
    SUSPENDED
    TERMINATED
  }

  enum IdentificationType {
    DRIVERS_LICENSE
    PASSPORT
    STATE_ID
    MILITARY_ID
    OTHER
  }

  enum ApplicationStatus {
    DRAFT
    SUBMITTED
    UNDER_REVIEW
    PENDING_VERIFICATION
    APPROVED
    CONDITIONALLY_APPROVED
    REJECTED
    WITHDRAWN
    EXPIRED
  }

  enum ApplicationType {
    NEW_LEASE
    LEASE_RENEWAL
    LEASE_TRANSFER
    SUBLEASE
  }

  enum LeaseStatus {
    DRAFT
    PENDING_APPROVAL
    ACTIVE
    EXPIRED
    TERMINATED
    RENEWED
    CANCELLED
    SUSPENDED
  }

  enum LeaseType {
    FIXED_TERM
    MONTH_TO_MONTH
    WEEK_TO_WEEK
    SUBLEASE
    CORPORATE
    STUDENT
    SENIOR
    AFFORDABLE_HOUSING
  }

  enum RentFrequency {
    WEEKLY
    BIWEEKLY
    MONTHLY
    QUARTERLY
    ANNUALLY
  }

  enum ContactRelationship {
    SPOUSE
    PARENT
    CHILD
    SIBLING
    FRIEND
    COWORKER
    NEIGHBOR
    RELATIVE
    GUARDIAN
    EMPLOYER
    OTHER
  }

  type Tenant {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    dateOfBirth: String
    status: TenantStatus!
    
    # Address Information
    currentAddress: String
    currentCity: String
    currentState: String
    currentZipCode: String
    currentCountry: String
    currentAddressSince: String
    
    # Previous Address
    previousAddress: String
    previousCity: String
    previousState: String
    previousZipCode: String
    previousAddressFrom: String
    previousAddressTo: String
    
    # Employment Information
    employerName: String
    jobTitle: String
    monthlyIncome: Float
    employmentStartDate: String
    employerAddress: String
    employerPhone: String
    supervisorName: String
    
    # Previous Employment
    previousEmployerName: String
    previousJobTitle: String
    previousEmploymentFrom: String
    previousEmploymentTo: String
    
    # Financial Information
    totalMonthlyIncome: Float
    monthlyDebtPayments: Float
    bankAccountBalance: String
    bankName: String
    bankAccountType: String
    
    # Identification
    identificationType: IdentificationType
    identificationNumber: String
    identificationExpiryDate: String
    socialSecurityNumber: String
    
    # Rental History
    currentLandlordName: String
    currentLandlordPhone: String
    currentRentAmount: Float
    reasonForMoving: String
    previousLandlordName: String
    previousLandlordPhone: String
    previousRentAmount: Float
    
    # Personal Information
    hasPets: Boolean!
    petDescription: String
    smoker: Boolean!
    numberOfOccupants: Int!
    additionalOccupants: String
    
    # References
    personalReferenceName: String
    personalReferencePhone: String
    personalReferenceRelationship: String
    
    # Verification Status
    identityVerified: Boolean!
    incomeVerified: Boolean!
    backgroundCheckCompleted: Boolean!
    creditCheckCompleted: Boolean!
    referencesVerified: Boolean!
    
    # Verification Dates
    identityVerifiedAt: String
    incomeVerifiedAt: String
    backgroundCheckCompletedAt: String
    creditCheckCompletedAt: String
    referencesVerifiedAt: String
    
    # Credit Information
    creditScore: Int
    creditReportUrl: String
    creditReportDate: String
    
    # Background Check Information
    hasConvictions: Boolean!
    convictionDetails: String
    hasEvictions: Boolean!
    evictionDetails: String
    
    # Profile
    profileImageUrl: String
    bio: String
    preferences: JSON
    metadata: JSON
    
    # Security
    lastLoginAt: String
    isActive: Boolean!
    
    # Computed Properties
    fullName: String!
    age: Int
    debtToIncomeRatio: Float
    verificationProgress: Float!
    isFullyVerified: Boolean!
    incomeToRentRatio: Float
    displayStatus: String!
    
    # Relationships
    applications: [Application!]!
    documents: [TenantDocument!]!
    leases: [Lease!]!
    emergencyContacts: [EmergencyContact!]!
    
    createdAt: String!
    updatedAt: String!
  }

  type Application {
    id: ID!
    tenant: Tenant!
    tenantId: String!
    propertyId: String!
    unitId: String
    type: ApplicationType!
    status: ApplicationStatus!
    
    # Application Details
    desiredMoveInDate: String
    desiredMoveOutDate: String
    desiredLeaseTerm: Int!
    proposedRent: Float
    securityDepositAmount: Float
    applicationFee: Float
    
    # Occupancy Information
    numberOfApplicants: Int!
    totalOccupants: Int!
    coApplicants: JSON
    additionalOccupants: JSON
    
    # Vehicle Information
    vehicles: JSON
    
    # Pet Information
    hasPets: Boolean!
    pets: JSON
    petDeposit: Float
    petRent: Float
    
    # Special Requirements
    specialRequests: String
    reasonForMoving: String
    additionalInformation: String
    
    # Screening Results
    backgroundCheckRequested: Boolean!
    creditCheckRequested: Boolean!
    incomeVerificationRequested: Boolean!
    referenceCheckRequested: Boolean!
    backgroundCheckPassed: Boolean!
    creditCheckPassed: Boolean!
    incomeVerificationPassed: Boolean!
    referenceCheckPassed: Boolean!
    
    # Scores and Ratings
    overallScore: Int
    creditScore: Int
    incomeToRentRatio: Float
    debtToIncomeRatio: Float
    
    # Decision Information
    approvalNotes: String
    rejectionReason: String
    conditions: JSON
    
    # Important Dates
    submittedAt: String
    reviewStartedAt: String
    decisionMadeAt: String
    approvedAt: String
    rejectedAt: String
    withdrawnAt: String
    expiresAt: String
    
    # Processing Information
    reviewedBy: String
    assignedTo: String
    revisionCount: Int!
    internalNotes: String
    
    # Communication
    lastContactedAt: String
    remindersSent: Int!
    
    # Metadata
    metadata: JSON
    screeningData: JSON
    
    # Computed Properties
    daysInReview: Int!
    daysSinceSubmission: Int!
    isExpired: Boolean!
    screeningProgress: Float!
    canApprove: Boolean!
    totalMonthlyPayment: Float!
    displayStatus: String!
    
    # Relationships
    reviews: [ApplicationReview!]!
    
    createdAt: String!
    updatedAt: String!
  }

  type ApplicationReview {
    id: ID!
    application: Application!
    applicationId: String!
    reviewerId: String!
    decision: String!
    notes: String
    rejectionReason: String
    conditions: JSON
    reviewDate: String!
    createdAt: String!
    updatedAt: String!
  }

  type Lease {
    id: ID!
    tenant: Tenant!
    tenantId: String!
    propertyId: String!
    unitId: String
    leaseNumber: String!
    status: LeaseStatus!
    leaseType: LeaseType!
    
    # Lease Duration
    startDate: String!
    endDate: String!
    leaseTerm: Int!
    leaseTermUnit: String!
    
    # Rent Information
    monthlyRent: Float!
    rentFrequency: RentFrequency!
    securityDeposit: Float!
    petDeposit: Float!
    keyDeposit: Float!
    cleaningDeposit: Float!
    lastMonthRent: Float!
    
    # Payment Details
    rentDueDay: Int!
    lateFeeAmount: Float!
    lateFeeGracePeriod: Int!
    lateFeePercentage: Float!
    autoPayEnabled: Boolean!
    
    # Occupancy Information
    maxOccupants: Int!
    occupants: JSON
    
    # Pet Information
    petsAllowed: Boolean!
    maxPets: Int!
    petRent: Float!
    petDetails: JSON
    
    # Utilities and Services
    utilitiesIncluded: JSON
    additionalFees: JSON
    
    # Lease Terms
    smokingAllowed: Boolean!
    sublettingAllowed: Boolean!
    specialTerms: String
    restrictions: String
    amenitiesIncluded: JSON
    
    # Renewal Information
    autoRenewal: Boolean!
    renewalNoticeRequired: Int!
    terminationNoticeRequired: Int!
    rentIncreasePercentage: Float!
    renewalRent: Float
    
    # Termination Information
    terminationDate: String
    terminationReason: String
    terminationNotes: String
    noticeGivenDate: String
    terminatedBy: String
    
    # Move-in/Move-out
    moveInDate: String
    moveOutDate: String
    keyHandoverDate: String
    moveInInspectionCompleted: Boolean!
    moveOutInspectionCompleted: Boolean!
    moveInCondition: JSON
    moveOutCondition: JSON
    
    # Documents
    leaseDocumentUrl: String
    additionalDocuments: JSON
    
    # Signatures
    tenantSigned: Boolean!
    tenantSignedAt: String
    landlordSigned: Boolean!
    landlordSignedAt: String
    digitalSignatures: JSON
    
    # Insurance
    renterInsuranceRequired: Boolean!
    minimumCoverageAmount: Float
    insuranceProvider: String
    policyNumber: String
    insuranceExpiryDate: String
    
    # Maintenance
    tenantMaintenanceLimit: Float!
    maintenanceResponsibilities: JSON
    
    # Financial Information
    totalLeaseValue: Float!
    proRatedRent: Float
    paymentHistory: JSON
    
    # Communication Preferences
    communicationPreferences: JSON
    
    # Emergency Contact
    emergencyContactName: String
    emergencyContactPhone: String
    emergencyContactRelationship: String
    
    # Computed Properties
    totalDeposits: Float!
    daysRemaining: Int!
    isExpired: Boolean!
    isActive: Boolean!
    monthsRemaining: Int!
    weeklyRent: Float!
    dailyRent: Float!
    totalRentOverTerm: Float!
    occupancyRate: Float!
    isFullyOccupied: Boolean!
    daysUntilExpiry: Int!
    isRenewalEligible: Boolean!
    totalMonthlyPayment: Float!
    isFullySigned: Boolean!
    signatureProgress: Float!
    effectiveLeaseTerm: String!
    
    # System fields
    metadata: JSON
    isActive: Boolean!
    
    createdAt: String!
    updatedAt: String!
  }

  type EmergencyContact {
    id: ID!
    tenant: Tenant!
    tenantId: String!
    firstName: String!
    lastName: String!
    relationship: ContactRelationship!
    customRelationship: String
    phone: String!
    alternatePhone: String
    email: String
    
    # Address Information
    address: String
    city: String
    state: String
    zipCode: String
    country: String
    
    # Contact Preferences
    isPrimary: Boolean!
    canContactByPhone: Boolean!
    canContactByEmail: Boolean!
    canContactBySms: Boolean!
    
    # Additional Information
    occupation: String
    workplace: String
    workPhone: String
    notes: String
    
    # Availability
    availabilityHours: JSON
    preferredContactTime: String
    timeZone: String
    
    # Emergency Contact Specifics
    authorizedToPickupKeys: Boolean!
    authorizedForMedicalEmergency: Boolean!
    authorizedForPropertyEmergency: Boolean!
    hasSpareKeys: Boolean!
    
    # Verification
    verified: Boolean!
    verifiedAt: String
    verifiedBy: String
    verificationMethod: JSON
    
    # Contact History
    lastContactedAt: String
    lastContactReason: String
    contactHistory: JSON
    
    # Language and Communication
    preferredLanguage: String!
    requiresTranslator: Boolean!
    interpreterLanguage: String
    
    # Computed Properties
    fullName: String!
    displayRelationship: String!
    primaryContactMethod: String!
    isAvailableNow: Boolean!
    contactMethods: [String!]!
    daysSinceLastContact: Int
    hasValidContactInfo: Boolean!
    authorizationLevel: String!
    contactReliabilityScore: Int!
    
    # System fields
    isActive: Boolean!
    metadata: JSON
    
    createdAt: String!
    updatedAt: String!
  }

  type TenantDocument {
    id: ID!
    tenant: Tenant!
    tenantId: String!
    name: String!
    description: String
    type: String!
    category: String!
    fileUrl: String!
    fileName: String!
    fileSize: Int!
    mimeType: String!
    isVerified: Boolean!
    verifiedAt: String
    verifiedBy: String
    expiryDate: String
    isPublic: Boolean!
    metadata: JSON
    uploadedAt: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type ScreeningStatus {
    backgroundCheck: ScreeningCheck!
    creditCheck: CreditCheck!
    incomeVerification: ScreeningCheck!
    referenceCheck: ScreeningCheck!
    overallProgress: Float!
  }

  type ScreeningCheck {
    completed: Boolean!
    passed: Boolean
    completedAt: String
  }

  type CreditCheck {
    completed: Boolean!
    passed: Boolean
    score: Int
    completedAt: String
  }

  type TenantStats {
    total: Int!
    active: Int!
    pendingVerification: Int!
    inactive: Int!
    fullyVerified: Int!
    withActiveLeases: Int!
  }

  type ApplicationStats {
    total: Int!
    byStatus: JSON!
    averageProcessingTime: Int!
    approvalRate: Int!
  }

  # Input Types
  input CreateTenantInput {
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    dateOfBirth: String
    currentAddress: String
    currentCity: String
    currentState: String
    currentZipCode: String
    currentCountry: String
    monthlyIncome: Float
    employerName: String
    jobTitle: String
    preferences: JSON
    metadata: JSON
  }

  input UpdateTenantInput {
    firstName: String
    lastName: String
    email: String
    phone: String
    dateOfBirth: String
    status: TenantStatus
    currentAddress: String
    currentCity: String
    currentState: String
    currentZipCode: String
    currentCountry: String
    monthlyIncome: Float
    employerName: String
    jobTitle: String
    preferences: JSON
    metadata: JSON
  }

  input CreateApplicationInput {
    tenantId: String!
    propertyId: String!
    unitId: String
    type: ApplicationType = NEW_LEASE
    desiredMoveInDate: String
    desiredMoveOutDate: String
    desiredLeaseTerm: Int = 12
    proposedRent: Float
    securityDepositAmount: Float
    applicationFee: Float
    numberOfApplicants: Int = 1
    totalOccupants: Int = 1
    coApplicants: JSON
    additionalOccupants: JSON
    vehicles: JSON
    hasPets: Boolean = false
    pets: JSON
    petDeposit: Float
    petRent: Float
    specialRequests: String
    reasonForMoving: String
    additionalInformation: String
    metadata: JSON
  }

  input UpdateApplicationInput {
    type: ApplicationType
    status: ApplicationStatus
    desiredMoveInDate: String
    desiredMoveOutDate: String
    desiredLeaseTerm: Int
    proposedRent: Float
    securityDepositAmount: Float
    applicationFee: Float
    numberOfApplicants: Int
    totalOccupants: Int
    coApplicants: JSON
    additionalOccupants: JSON
    vehicles: JSON
    hasPets: Boolean
    pets: JSON
    petDeposit: Float
    petRent: Float
    specialRequests: String
    reasonForMoving: String
    additionalInformation: String
    approvalNotes: String
    rejectionReason: String
    conditions: JSON
    reviewedBy: String
    assignedTo: String
    internalNotes: String
    metadata: JSON
  }

  input CreateLeaseInput {
    tenantId: String!
    propertyId: String!
    unitId: String
    leaseNumber: String!
    leaseType: LeaseType = FIXED_TERM
    startDate: String!
    endDate: String!
    leaseTerm: Int!
    leaseTermUnit: String = "months"
    monthlyRent: Float!
    rentFrequency: RentFrequency = MONTHLY
    securityDeposit: Float = 0
    petDeposit: Float = 0
    keyDeposit: Float = 0
    cleaningDeposit: Float = 0
    lastMonthRent: Float = 0
    rentDueDay: Int = 1
    lateFeeAmount: Float = 0
    lateFeeGracePeriod: Int = 5
    lateFeePercentage: Float = 0
    autoPayEnabled: Boolean = false
    maxOccupants: Int!
    occupants: JSON
    petsAllowed: Boolean = false
    maxPets: Int = 0
    petRent: Float = 0
    petDetails: JSON
    utilitiesIncluded: JSON
    additionalFees: JSON
    smokingAllowed: Boolean = false
    sublettingAllowed: Boolean = false
    specialTerms: String
    restrictions: String
    amenitiesIncluded: JSON
    autoRenewal: Boolean = false
    renewalNoticeRequired: Int = 30
    terminationNoticeRequired: Int = 30
    rentIncreasePercentage: Float = 0
    renterInsuranceRequired: Boolean = false
    minimumCoverageAmount: Float
    tenantMaintenanceLimit: Float = 0
    maintenanceResponsibilities: JSON
    communicationPreferences: JSON
    emergencyContactName: String
    emergencyContactPhone: String
    emergencyContactRelationship: String
    metadata: JSON
  }

  input CreateEmergencyContactInput {
    tenantId: String!
    firstName: String!
    lastName: String!
    relationship: ContactRelationship!
    customRelationship: String
    phone: String!
    alternatePhone: String
    email: String
    address: String
    city: String
    state: String
    zipCode: String
    country: String
    isPrimary: Boolean = false
    canContactByPhone: Boolean = true
    canContactByEmail: Boolean = true
    canContactBySms: Boolean = false
    occupation: String
    workplace: String
    workPhone: String
    notes: String
    availabilityHours: JSON
    preferredContactTime: String
    timeZone: String
    authorizedToPickupKeys: Boolean = true
    authorizedForMedicalEmergency: Boolean = false
    authorizedForPropertyEmergency: Boolean = true
    hasSpareKeys: Boolean = false
    preferredLanguage: String = "en"
    requiresTranslator: Boolean = false
    interpreterLanguage: String
    metadata: JSON
  }

  input ApplicationDecisionInput {
    action: String! # APPROVE, REJECT, CONDITIONAL_APPROVE
    notes: String
    rejectionReason: String
    conditions: JSON
    reviewedBy: String!
  }

  input TenantVerificationInput {
    identityVerified: Boolean
    incomeVerified: Boolean
    backgroundCheckCompleted: Boolean
    creditCheckCompleted: Boolean
    referencesVerified: Boolean
    creditScore: Int
    hasConvictions: Boolean
    hasEvictions: Boolean
    convictionDetails: String
    evictionDetails: String
  }

  input TenantSearchFilters {
    status: [TenantStatus!]
    city: String
    state: String
    minIncome: Float
    maxIncome: Float
    hasActiveLeases: Boolean
    isVerified: Boolean
    search: String
  }

  input ApplicationSearchFilters {
    status: [ApplicationStatus!]
    propertyId: String
    unitId: String
    tenantId: String
    assignedTo: String
    dateRange: DateRangeInput
    minScore: Int
    maxScore: Int
    hasScreeningIssues: Boolean
  }

  input DateRangeInput {
    start: String!
    end: String!
  }

  scalar JSON

  type Query {
    # Tenant Queries
    tenant(id: ID!): Tenant
    tenantByEmail(email: String!): Tenant
    tenants(limit: Int = 50, offset: Int = 0): [Tenant!]!
    searchTenants(filters: TenantSearchFilters!, limit: Int = 50, offset: Int = 0): [Tenant!]!
    tenantStats: TenantStats!
    
    # Application Queries
    application(id: ID!): Application
    applications(limit: Int = 50, offset: Int = 0): [Application!]!
    searchApplications(filters: ApplicationSearchFilters!, limit: Int = 50, offset: Int = 0): [Application!]!
    applicationsByProperty(propertyId: String!, limit: Int = 50, offset: Int = 0): [Application!]!
    applicationsByTenant(tenantId: String!): [Application!]!
    applicationStats: ApplicationStats!
    
    # Lease Queries
    lease(id: ID!): Lease
    leases(limit: Int = 50, offset: Int = 0): [Lease!]!
    leasesByTenant(tenantId: String!): [Lease!]!
    leasesByProperty(propertyId: String!): [Lease!]!
    activeLeases(tenantId: String): [Lease!]!
    
    # Document Queries
    tenantDocuments(tenantId: String!): [TenantDocument!]!
    
    # Emergency Contact Queries
    emergencyContacts(tenantId: String!): [EmergencyContact!]!
    
    # Screening Queries
    screeningStatus(tenantId: String!): ScreeningStatus!
  }

  type Mutation {
    # Tenant Mutations
    createTenant(input: CreateTenantInput!): Tenant!
    updateTenant(id: ID!, input: UpdateTenantInput!): Tenant!
    updateVerificationStatus(id: ID!, input: TenantVerificationInput!): Tenant!
    deactivateTenant(id: ID!, reason: String): Tenant!
    reactivateTenant(id: ID!): Tenant!
    deleteTenant(id: ID!): Boolean!
    
    # Application Mutations
    createApplication(input: CreateApplicationInput!): Application!
    updateApplication(id: ID!, input: UpdateApplicationInput!): Application!
    submitApplication(id: ID!): Application!
    startReview(id: ID!, reviewerId: String): Application!
    makeDecision(id: ID!, decision: ApplicationDecisionInput!): Application!
    withdrawApplication(id: ID!, reason: String): Application!
    
    # Lease Mutations
    createLease(input: CreateLeaseInput!): Lease!
    updateLease(id: ID!, input: JSON!): Lease!
    signLease(id: ID!, signerId: String!, signerRole: String!): Lease!
    terminateLease(id: ID!, reason: String!, notes: String): Lease!
    
    # Document Mutations
    addDocument(tenantId: String!, input: JSON!): TenantDocument!
    updateDocument(id: ID!, input: JSON!): TenantDocument!
    deleteDocument(id: ID!): Boolean!
    
    # Emergency Contact Mutations
    createEmergencyContact(input: CreateEmergencyContactInput!): EmergencyContact!
    updateEmergencyContact(id: ID!, input: JSON!): EmergencyContact!
    deleteEmergencyContact(id: ID!): Boolean!
    
    # Screening Mutations
    initiateScreening(tenantId: String!, type: String = "BASIC"): Boolean!
    updateScreeningResult(applicationId: String!, type: String!, passed: Boolean!, details: JSON): Application!
    
    # Utility Mutations
    expireOldApplications: Int!
  }
`;
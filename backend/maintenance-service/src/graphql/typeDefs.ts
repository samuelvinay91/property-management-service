import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  enum WorkOrderStatus {
    PENDING
    ASSIGNED
    IN_PROGRESS
    ON_HOLD
    COMPLETED
    CANCELLED
    REQUIRES_APPROVAL
  }

  enum WorkOrderPriority {
    LOW
    MEDIUM
    HIGH
    EMERGENCY
  }

  enum WorkOrderType {
    REACTIVE
    PREVENTIVE
    INSPECTION
    EMERGENCY
  }

  enum RequestStatus {
    SUBMITTED
    UNDER_REVIEW
    APPROVED
    WORK_ORDER_CREATED
    IN_PROGRESS
    COMPLETED
    REJECTED
    CANCELLED
  }

  enum RequestPriority {
    LOW
    MEDIUM
    HIGH
    EMERGENCY
  }

  enum RequestCategory {
    PLUMBING
    ELECTRICAL
    HVAC
    APPLIANCE
    FLOORING
    PAINTING
    PEST_CONTROL
    SECURITY
    LANDSCAPING
    CLEANING
    GENERAL
    OTHER
  }

  enum VendorStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
    PENDING_APPROVAL
  }

  enum VendorType {
    INDIVIDUAL
    COMPANY
  }

  enum AssetStatus {
    ACTIVE
    INACTIVE
    OUT_OF_SERVICE
    RETIRED
  }

  enum AssetCondition {
    EXCELLENT
    GOOD
    FAIR
    POOR
    CRITICAL
  }

  enum InspectionStatus {
    SCHEDULED
    IN_PROGRESS
    COMPLETED
    CANCELLED
    RESCHEDULED
  }

  enum InspectionType {
    ROUTINE
    MOVE_IN
    MOVE_OUT
    ANNUAL
    SAFETY
    MAINTENANCE
    INSURANCE
    GOVERNMENT
    EMERGENCY
  }

  enum InspectionResult {
    PASS
    FAIL
    CONDITIONAL_PASS
    NEEDS_FOLLOW_UP
  }

  enum ScheduleStatus {
    ACTIVE
    INACTIVE
    PAUSED
    COMPLETED
  }

  enum ScheduleFrequency {
    DAILY
    WEEKLY
    MONTHLY
    QUARTERLY
    SEMI_ANNUALLY
    ANNUALLY
    CUSTOM
  }

  enum ExpenseType {
    LABOR
    MATERIALS
    EQUIPMENT
    PERMITS
    TRAVEL
    EMERGENCY_FEE
    OTHER
  }

  enum ExpenseStatus {
    PENDING
    APPROVED
    REJECTED
    PAID
  }

  enum AttachmentType {
    PHOTO
    VIDEO
    DOCUMENT
    AUDIO
  }

  enum AttachmentCategory {
    BEFORE
    DURING
    AFTER
    REFERENCE
    RECEIPT
    INVOICE
    MANUAL
    OTHER
  }

  type WorkOrder {
    id: ID!
    title: String!
    description: String!
    type: WorkOrderType!
    status: WorkOrderStatus!
    priority: WorkOrderPriority!
    propertyId: String!
    unitId: String
    tenantId: String
    requestedBy: String!
    assignedTo: String
    vendor: Vendor
    vendorId: String
    asset: Asset
    assetId: String
    maintenanceRequest: MaintenanceRequest
    maintenanceRequestId: String
    scheduledDate: DateTime
    startedAt: DateTime
    completedAt: DateTime
    estimatedCost: Float
    actualCost: Float
    completionNotes: String
    internalNotes: String
    estimatedHours: Int
    actualHours: Int
    location: String
    customFields: JSON
    attachments: [WorkOrderAttachment!]!
    expenses: [Expense!]!
    approvedBy: String
    approvedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MaintenanceRequest {
    id: ID!
    title: String!
    description: String!
    category: RequestCategory!
    priority: RequestPriority!
    status: RequestStatus!
    propertyId: String!
    unitId: String
    requestedBy: String!
    requestedByType: String!
    contactPhone: String
    contactEmail: String
    preferredSchedule: String
    location: String
    photos: [String!]
    tenantNotes: String
    managerNotes: String
    rejectionReason: String
    reviewedBy: String
    reviewedAt: DateTime
    isEmergency: Boolean!
    allowEntry: Boolean!
    entryInstructions: String
    customFields: JSON
    workOrders: [WorkOrder!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Vendor {
    id: ID!
    name: String!
    type: VendorType!
    status: VendorStatus!
    contactPerson: String!
    email: String!
    phone: String!
    alternatePhone: String
    address: String!
    city: String
    state: String
    zipCode: String
    website: String
    licenseNumber: String
    licenseExpiry: DateTime
    insuranceProvider: String
    insuranceExpiry: DateTime
    insuranceAmount: Float
    specialties: [String!]!
    serviceAreas: [String!]!
    rating: Float
    totalJobs: Int
    completedJobs: Int
    averageResponseTime: Float
    isPreferred: Boolean!
    isEmergencyAvailable: Boolean!
    hourlyRate: Float
    emergencyRate: Float
    minimumCharge: Float
    availability: JSON
    notes: String
    paymentTerms: String
    taxId: String
    documents: [String!]
    customFields: JSON
    workOrders: [WorkOrder!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Asset {
    id: ID!
    name: String!
    description: String
    assetTag: String!
    category: String!
    subcategory: String
    propertyId: String!
    unitId: String
    location: String
    manufacturer: String
    model: String
    serialNumber: String
    purchaseDate: DateTime
    installationDate: DateTime
    warrantyExpiry: DateTime
    purchasePrice: Float
    currentValue: Float
    expectedLifeYears: Int
    status: AssetStatus!
    condition: AssetCondition!
    lastInspectionDate: DateTime
    nextInspectionDate: DateTime
    lastMaintenanceDate: DateTime
    nextMaintenanceDate: DateTime
    maintenanceIntervalDays: Int
    maintenanceInstructions: String
    specifications: JSON
    documents: [String!]
    photos: [String!]
    qrCode: String
    barcodeData: String
    notes: String
    customFields: JSON
    workOrders: [WorkOrder!]!
    maintenanceSchedules: [MaintenanceSchedule!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Inspection {
    id: ID!
    title: String!
    description: String
    type: InspectionType!
    status: InspectionStatus!
    propertyId: String!
    unitId: String
    scheduledBy: String!
    inspectorId: String
    inspectorName: String
    scheduledDate: DateTime!
    startedAt: DateTime
    completedAt: DateTime
    estimatedDuration: Int
    actualDuration: Int
    checklistItems: [String!]!
    checklistResults: JSON
    overallResult: InspectionResult
    overallScore: Float
    findings: String
    recommendations: String
    deficiencies: [InspectionDeficiency!]
    photos: [String!]
    documents: [String!]
    tenantPresent: Boolean
    tenantSignature: String
    inspectorSignature: String
    reportGeneratedAt: DateTime
    reportUrl: String
    followUpDate: DateTime
    followUpNotes: String
    customFields: JSON
    generatedWorkOrders: [WorkOrder!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type InspectionDeficiency {
    item: String!
    severity: String!
    description: String!
    photo: String
  }

  type MaintenanceSchedule {
    id: ID!
    name: String!
    description: String
    status: ScheduleStatus!
    frequency: ScheduleFrequency!
    intervalDays: Int
    propertyId: String!
    unitId: String
    asset: Asset
    assetId: String
    createdBy: String!
    assignedTo: String
    vendorId: String
    startDate: DateTime!
    endDate: DateTime
    nextDueDate: DateTime
    lastCompletedDate: DateTime
    leadTimeDays: Int
    estimatedDuration: Int
    estimatedCost: Float
    workDescription: String!
    instructions: String
    requiredSkills: [String!]!
    requiredTools: [String!]!
    requiredParts: [String!]!
    checklist: [String!]
    autoCreateWorkOrder: Boolean!
    requiresApproval: Boolean!
    priority: Int
    category: String
    notifications: JSON
    customFields: JSON
    generatedWorkOrders: [WorkOrder!]!
    completedCount: Int
    skippedCount: Int
    lastModifiedDate: DateTime
    lastModifiedBy: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Expense {
    id: ID!
    workOrder: WorkOrder!
    workOrderId: String!
    vendor: Vendor
    vendorId: String
    description: String!
    type: ExpenseType!
    status: ExpenseStatus!
    amount: Float!
    quantity: Float
    unitPrice: Float
    unit: String
    expenseDate: DateTime!
    invoiceNumber: String
    receiptUrl: String
    invoiceUrl: String
    notes: String
    submittedBy: String!
    approvedBy: String
    approvedAt: DateTime
    rejectionReason: String
    isBillable: Boolean!
    isReimbursable: Boolean!
    category: String
    subcategory: String
    glAccount: String
    taxAmount: Float
    taxRate: Float
    customFields: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WorkOrderAttachment {
    id: ID!
    workOrder: WorkOrder!
    workOrderId: String!
    filename: String!
    originalFilename: String!
    url: String!
    type: AttachmentType!
    category: AttachmentCategory!
    mimeType: String!
    fileSize: Int!
    description: String
    caption: String
    uploadedBy: String!
    metadata: JSON
    thumbnailUrl: String
    isVisible: Boolean!
    isPrivate: Boolean!
    geoLocation: GeoLocation
    takenAt: DateTime
    createdAt: DateTime!
  }

  type GeoLocation {
    latitude: Float!
    longitude: Float!
    accuracy: Float
  }

  type DashboardStats {
    activeWorkOrders: Int!
    pendingRequests: Int!
    overdueWorkOrders: Int!
    completedThisMonth: Int!
    averageCompletionTime: Float!
    topIssueCategories: [CategoryCount!]!
    upcomingScheduledMaintenance: Int!
    totalMaintenanceCost: Float!
  }

  type CategoryCount {
    category: String!
    count: Int!
  }

  type AssetDashboard {
    totalAssets: Int!
    assetsByCategory: [CategoryCount!]!
    assetsByCondition: [ConditionCount!]!
    assetsNeedingMaintenance: Int!
    warrantiesExpiring: Int!
    criticalAssets: Int!
    averageAssetAge: Float!
    totalAssetValue: Float!
  }

  type ConditionCount {
    condition: String!
    count: Int!
  }

  type VendorPerformance {
    totalJobs: Int!
    completedJobs: Int!
    completionRate: Float!
    averageRating: Float!
    averageResponseTime: Float!
    onTimeCompletionRate: Float!
    totalRevenue: Float!
    recentJobs: [WorkOrder!]!
  }

  type InspectionMetrics {
    totalInspections: Int!
    completedInspections: Int!
    averageScore: Float!
    passRate: Float!
    deficiencyRate: Float!
    averageDuration: Float!
    inspectionsByType: [TypeCount!]!
    monthlyTrend: [MonthlyTrend!]!
  }

  type TypeCount {
    type: String!
    count: Int!
  }

  type MonthlyTrend {
    month: String!
    count: Int!
    avgScore: Float!
  }

  type ScheduleMetrics {
    totalSchedules: Int!
    activeSchedules: Int!
    overdueSchedules: Int!
    schedulesThisMonth: Int!
    completionRate: Float!
    averageFrequency: Float!
    schedulesByFrequency: [FrequencyCount!]!
  }

  type FrequencyCount {
    frequency: String!
    count: Int!
  }

  # Input Types
  input CreateMaintenanceRequestInput {
    title: String!
    description: String!
    category: RequestCategory!
    priority: RequestPriority!
    propertyId: String!
    unitId: String
    requestedBy: String!
    requestedByType: String!
    contactPhone: String
    contactEmail: String
    preferredSchedule: String
    location: String
    photos: [String!]
    tenantNotes: String
    isEmergency: Boolean = false
    allowEntry: Boolean = true
    entryInstructions: String
    customFields: JSON
  }

  input ReviewMaintenanceRequestInput {
    status: RequestStatus!
    managerNotes: String
    rejectionReason: String
  }

  input CreateWorkOrderInput {
    title: String!
    description: String!
    type: WorkOrderType = REACTIVE
    priority: WorkOrderPriority = MEDIUM
    propertyId: String!
    unitId: String
    tenantId: String
    requestedBy: String!
    assignedTo: String
    vendorId: String
    assetId: String
    maintenanceRequestId: String
    scheduledDate: DateTime
    estimatedCost: Float
    estimatedHours: Int
    location: String
    internalNotes: String
    customFields: JSON
  }

  input UpdateWorkOrderInput {
    title: String
    description: String
    status: WorkOrderStatus
    priority: WorkOrderPriority
    assignedTo: String
    vendorId: String
    scheduledDate: DateTime
    estimatedCost: Float
    estimatedHours: Int
    actualCost: Float
    actualHours: Int
    completionNotes: String
    internalNotes: String
    location: String
    customFields: JSON
  }

  input CreateVendorInput {
    name: String!
    type: VendorType!
    contactPerson: String!
    email: String!
    phone: String!
    alternatePhone: String
    address: String!
    city: String
    state: String
    zipCode: String
    website: String
    licenseNumber: String
    licenseExpiry: DateTime
    insuranceProvider: String
    insuranceExpiry: DateTime
    insuranceAmount: Float
    specialties: [String!]!
    serviceAreas: [String!]!
    hourlyRate: Float
    emergencyRate: Float
    minimumCharge: Float
    availability: JSON
    notes: String
    paymentTerms: String
    taxId: String
    isEmergencyAvailable: Boolean = false
  }

  input CreateAssetInput {
    name: String!
    description: String
    assetTag: String!
    category: String!
    subcategory: String
    propertyId: String!
    unitId: String
    location: String
    manufacturer: String
    model: String
    serialNumber: String
    purchaseDate: DateTime
    installationDate: DateTime
    warrantyExpiry: DateTime
    purchasePrice: Float
    expectedLifeYears: Int
    maintenanceIntervalDays: Int
    maintenanceInstructions: String
    specifications: JSON
    customFields: JSON
  }

  input CreateInspectionInput {
    title: String!
    description: String
    type: InspectionType!
    propertyId: String!
    unitId: String
    scheduledBy: String!
    inspectorId: String
    inspectorName: String
    scheduledDate: DateTime!
    estimatedDuration: Int
    checklistItems: [String!]!
    customFields: JSON
  }

  input CompleteInspectionInput {
    checklistResults: JSON!
    overallResult: InspectionResult!
    overallScore: Float
    findings: String
    recommendations: String
    deficiencies: [InspectionDeficiencyInput!]
    photos: [String!]
    tenantPresent: Boolean
    tenantSignature: String
    inspectorSignature: String
    followUpDate: DateTime
    followUpNotes: String
  }

  input InspectionDeficiencyInput {
    item: String!
    severity: String!
    description: String!
    photo: String
  }

  input CreateScheduleInput {
    name: String!
    description: String
    frequency: ScheduleFrequency!
    intervalDays: Int
    propertyId: String!
    unitId: String
    assetId: String
    createdBy: String!
    assignedTo: String
    vendorId: String
    startDate: DateTime!
    endDate: DateTime
    leadTimeDays: Int
    estimatedDuration: Int
    estimatedCost: Float
    workDescription: String!
    instructions: String
    requiredSkills: [String!]!
    requiredTools: [String!]!
    requiredParts: [String!]!
    checklist: [String!]
    autoCreateWorkOrder: Boolean = true
    requiresApproval: Boolean = false
    priority: Int
    category: String
    customFields: JSON
  }

  input CreateExpenseInput {
    workOrderId: String!
    vendorId: String
    description: String!
    type: ExpenseType!
    amount: Float!
    quantity: Float
    unitPrice: Float
    unit: String
    expenseDate: DateTime!
    invoiceNumber: String
    receiptUrl: String
    notes: String
    submittedBy: String!
    isBillable: Boolean = false
    category: String
  }

  input WorkOrderFilters {
    status: [WorkOrderStatus!]
    priority: [WorkOrderPriority!]
    type: [WorkOrderType!]
    assignedTo: String
    vendorId: String
    dateFrom: DateTime
    dateTo: DateTime
    search: String
  }

  input VendorFilters {
    status: [VendorStatus!]
    specialties: [String!]
    serviceAreas: [String!]
    minRating: Float
    maxHourlyRate: Float
    isEmergencyAvailable: Boolean
    search: String
  }

  input AssetFilters {
    category: String
    status: [AssetStatus!]
    condition: [AssetCondition!]
    unitId: String
    search: String
    needsMaintenance: Boolean
    warrantyExpiring: Boolean
  }

  input InspectionFilters {
    type: [InspectionType!]
    status: [InspectionStatus!]
    inspectorId: String
    dateFrom: DateTime
    dateTo: DateTime
    unitId: String
  }

  input ScheduleFilters {
    status: [ScheduleStatus!]
    frequency: [ScheduleFrequency!]
    assetId: String
    category: String
    search: String
  }

  # Queries
  type Query {
    # Work Orders
    workOrder(id: ID!): WorkOrder
    workOrders(propertyId: String!, filters: WorkOrderFilters): [WorkOrder!]!
    overdueWorkOrders(propertyIds: [String!]): [WorkOrder!]!
    
    # Maintenance Requests
    maintenanceRequest(id: ID!): MaintenanceRequest
    maintenanceRequests(propertyId: String!, status: RequestStatus): [MaintenanceRequest!]!
    
    # Vendors
    vendor(id: ID!): Vendor
    vendors(filters: VendorFilters): [Vendor!]!
    vendorPerformance(id: ID!): VendorPerformance!
    vendorsBySpecialty(specialty: String!): [Vendor!]!
    
    # Assets
    asset(id: ID!): Asset
    assets(propertyId: String!, filters: AssetFilters): [Asset!]!
    assetMaintenanceHistory(id: ID!): [WorkOrder!]!
    assetDashboard(propertyIds: [String!]!): AssetDashboard!
    
    # Inspections
    inspection(id: ID!): Inspection
    inspections(propertyId: String!, filters: InspectionFilters): [Inspection!]!
    upcomingInspections(inspectorId: String, days: Int = 7): [Inspection!]!
    inspectionTemplates(type: InspectionType!): [String!]!
    inspectionMetrics(propertyIds: [String!]!, dateRange: JSON): InspectionMetrics!
    
    # Schedules
    maintenanceSchedule(id: ID!): MaintenanceSchedule
    maintenanceSchedules(propertyId: String!, filters: ScheduleFilters): [MaintenanceSchedule!]!
    upcomingSchedules(propertyIds: [String!]!, days: Int = 30): [MaintenanceSchedule!]!
    scheduleMetrics(propertyIds: [String!]!): ScheduleMetrics!
    
    # Expenses
    expense(id: ID!): Expense
    workOrderExpenses(workOrderId: String!): [Expense!]!
    
    # Dashboard
    maintenanceDashboard(propertyIds: [String!]!): DashboardStats!
    
    # Attachments
    workOrderAttachments(workOrderId: String!): [WorkOrderAttachment!]!
  }

  # Mutations
  type Mutation {
    # Maintenance Requests
    submitMaintenanceRequest(input: CreateMaintenanceRequestInput!): MaintenanceRequest!
    reviewMaintenanceRequest(id: ID!, input: ReviewMaintenanceRequestInput!, reviewedBy: String!): MaintenanceRequest!
    
    # Work Orders
    createWorkOrder(input: CreateWorkOrderInput!): WorkOrder!
    updateWorkOrder(id: ID!, input: UpdateWorkOrderInput!, updatedBy: String!): WorkOrder!
    assignWorkOrder(id: ID!, assigneeId: String!, assignedBy: String!): WorkOrder!
    startWorkOrder(id: ID!, startedBy: String!): WorkOrder!
    completeWorkOrder(id: ID!, completionNotes: String!, actualHours: Int, actualCost: Float, completedBy: String!): WorkOrder!
    bulkUpdateWorkOrders(ids: [ID!]!, updates: UpdateWorkOrderInput!, updatedBy: String!): [WorkOrder!]!
    
    # Vendors
    createVendor(input: CreateVendorInput!): Vendor!
    updateVendor(id: ID!, input: CreateVendorInput!): Vendor!
    approveVendor(id: ID!, approvedBy: String!): Vendor!
    suspendVendor(id: ID!, reason: String!, suspendedBy: String!): Vendor!
    
    # Assets
    createAsset(input: CreateAssetInput!): Asset!
    updateAsset(id: ID!, input: CreateAssetInput!): Asset!
    updateAssetCondition(id: ID!, condition: AssetCondition!, notes: String, inspectedBy: String): Asset!
    generateAssetQRCode(id: ID!): String!
    
    # Inspections
    createInspection(input: CreateInspectionInput!): Inspection!
    startInspection(id: ID!, inspectorId: String!): Inspection!
    completeInspection(id: ID!, input: CompleteInspectionInput!): Inspection!
    rescheduleInspection(id: ID!, newDate: DateTime!, reason: String!, rescheduledBy: String!): Inspection!
    generateInspectionReport(id: ID!): String!
    
    # Schedules
    createMaintenanceSchedule(input: CreateScheduleInput!): MaintenanceSchedule!
    updateMaintenanceSchedule(id: ID!, input: CreateScheduleInput!): MaintenanceSchedule!
    pauseMaintenanceSchedule(id: ID!, pausedBy: String!): MaintenanceSchedule!
    resumeMaintenanceSchedule(id: ID!, resumedBy: String!): MaintenanceSchedule!
    executeScheduleManually(id: ID!, executedBy: String!, skipWorkOrderCreation: Boolean = false, notes: String): MaintenanceSchedule!
    
    # Expenses
    addExpense(input: CreateExpenseInput!): Expense!
    approveExpense(id: ID!, approvedBy: String!): Expense!
    rejectExpense(id: ID!, reason: String!, rejectedBy: String!): Expense!
    
    # File Uploads
    uploadWorkOrderAttachment(workOrderId: ID!, file: Upload!, category: AttachmentCategory!, description: String, isPrivate: Boolean = false): WorkOrderAttachment!
    deleteWorkOrderAttachment(id: ID!): Boolean!
  }

  # Subscriptions
  type Subscription {
    workOrderUpdated(propertyId: String!): WorkOrder!
    maintenanceRequestUpdated(propertyId: String!): MaintenanceRequest!
    inspectionUpdated(propertyId: String!): Inspection!
  }
`;
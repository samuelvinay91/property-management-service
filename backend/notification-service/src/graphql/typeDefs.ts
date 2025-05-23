import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  enum NotificationStatus {
    PENDING
    PROCESSING
    SENT
    DELIVERED
    FAILED
    CANCELLED
  }

  enum NotificationChannel {
    EMAIL
    SMS
    PUSH
    IN_APP
  }

  enum NotificationPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  enum NotificationType {
    TRANSACTIONAL
    MARKETING
    SYSTEM
    REMINDER
  }

  enum TemplateStatus {
    DRAFT
    ACTIVE
    INACTIVE
    ARCHIVED
  }

  enum TemplateEngine {
    HANDLEBARS
    MUSTACHE
    LIQUID
  }

  enum GroupStatus {
    DRAFT
    SCHEDULED
    PROCESSING
    COMPLETED
    CANCELLED
    PAUSED
  }

  enum GroupType {
    CAMPAIGN
    BULK
    SEQUENCE
    TRIGGER
    BROADCAST
  }

  enum PreferenceStatus {
    ACTIVE
    INACTIVE
    BLOCKED
  }

  enum DeliveryStatus {
    PENDING
    PROCESSING
    SENT
    DELIVERED
    BOUNCED
    FAILED
    REJECTED
    DEFERRED
    OPENED
    CLICKED
    UNSUBSCRIBED
    COMPLAINED
  }

  type Notification {
    id: ID!
    recipientId: String!
    recipientEmail: String
    recipientPhone: String
    recipientDeviceToken: String
    channel: NotificationChannel!
    status: NotificationStatus!
    priority: NotificationPriority!
    type: NotificationType!
    subject: String!
    content: String!
    metadata: JSON
    templateVariables: JSON
    locale: String!
    scheduledAt: DateTime
    sentAt: DateTime
    deliveredAt: DateTime
    readAt: DateTime
    retryCount: Int!
    maxRetries: Int!
    nextRetryAt: DateTime
    failureReason: String
    externalId: String
    correlationId: String
    campaignId: String
    template: NotificationTemplate
    templateId: ID
    group: NotificationGroup
    groupId: ID
    deliveryLogs: [DeliveryLog!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: String
    isScheduled: Boolean!
    isOverdue: Boolean!
    canRetry: Boolean!
    isDelivered: Boolean!
    isRead: Boolean!
  }

  type NotificationTemplate {
    id: ID!
    name: String!
    displayName: String
    description: String
    channel: NotificationChannel!
    type: NotificationType!
    status: TemplateStatus!
    isDefault: Boolean!
    category: String
    variables: [TemplateVariable!]!
    content: JSON!
    settings: TemplateSettings!
    version: Int!
    parentTemplateId: ID
    fromEmail: String
    fromName: String
    replyTo: String
    tags: [String!]
    publishedAt: DateTime
    archivedAt: DateTime
    notifications: [Notification!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: String
    updatedBy: String
    usageCount: Int!
    lastUsedAt: DateTime
    isActive: Boolean!
    isDraft: Boolean!
    isPublished: Boolean!
    supportedLocales: [String!]!
  }

  type TemplateVariable {
    name: String!
    type: String!
    required: Boolean!
    defaultValue: JSON
    description: String
    validation: TemplateValidation
  }

  type TemplateValidation {
    min: Float
    max: Float
    pattern: String
    enum: [String!]
  }

  type TemplateSettings {
    engine: TemplateEngine!
    enableHtml: Boolean!
    enablePreheader: Boolean!
    trackOpens: Boolean!
    trackClicks: Boolean!
    unsubscribeLink: Boolean!
    customHeaders: JSON
    attachments: [TemplateAttachment!]
  }

  type TemplateAttachment {
    name: String!
    url: String!
    type: String!
  }

  type LocalizedContent {
    subject: String!
    body: String!
    htmlBody: String
    preheader: String
    metadata: JSON
  }

  type NotificationPreference {
    id: ID!
    userId: String!
    channel: NotificationChannel
    type: NotificationType
    status: PreferenceStatus!
    enabled: Boolean!
    channelSettings: ChannelSettings
    typeSettings: TypeSettings
    optInMethod: String!
    optInDate: DateTime
    optOutDate: DateTime
    optOutReason: String
    locale: String!
    timezone: String!
    contactInfo: ContactInfo
    metadata: JSON
    unsubscribeToken: String
    lastNotificationAt: DateTime
    notificationCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: String
    isOptedIn: Boolean!
    isOptedOut: Boolean!
    isBlocked: Boolean!
  }

  type ChannelSettings {
    enabled: Boolean!
    frequency: String!
    quietHours: QuietHours
    deliveryWindow: DeliveryWindow
    rateLimits: RateLimits
  }

  type QuietHours {
    enabled: Boolean!
    startTime: String!
    endTime: String!
    timezone: String!
  }

  type DeliveryWindow {
    enabled: Boolean!
    startTime: String!
    endTime: String!
    timezone: String!
  }

  type RateLimits {
    maxPerHour: Int
    maxPerDay: Int
    maxPerWeek: Int
  }

  type TypeSettings {
    enabled: Boolean!
    channels: [NotificationChannel!]!
    priority: String!
    consolidation: ConsolidationSettings
  }

  type ConsolidationSettings {
    enabled: Boolean!
    windowMinutes: Int!
    maxCount: Int!
  }

  type ContactInfo {
    email: String
    phone: String
    deviceTokens: [String!]
  }

  type NotificationGroup {
    id: ID!
    name: String!
    description: String
    type: GroupType!
    status: GroupStatus!
    channel: NotificationChannel!
    notificationType: NotificationType!
    priority: NotificationPriority!
    campaignId: String
    templateId: String
    targeting: Targeting!
    schedule: Schedule!
    settings: GroupSettings!
    scheduledAt: DateTime
    startedAt: DateTime
    completedAt: DateTime
    cancelledAt: DateTime
    pausedAt: DateTime
    metrics: GroupMetrics
    templateVariables: JSON
    tags: [String!]
    cancellationReason: String
    currentBatch: Int!
    processedCount: Int!
    lastProcessedAt: DateTime
    nextBatchAt: DateTime
    notifications: [Notification!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: String
    approvedBy: String
    approvedAt: DateTime
    isDraft: Boolean!
    isScheduled: Boolean!
    isProcessing: Boolean!
    isCompleted: Boolean!
    isCancelled: Boolean!
    isPaused: Boolean!
    isActive: Boolean!
    isFinished: Boolean!
    canStart: Boolean!
    canPause: Boolean!
    canResume: Boolean!
    canCancel: Boolean!
    progress: Float!
    estimatedCompletion: DateTime
  }

  type Targeting {
    userIds: [String!]
    userSegments: [String!]
    filters: TargetingFilters
    exclusions: TargetingExclusions
  }

  type TargetingFilters {
    properties: JSON
    tags: [String!]
    location: LocationFilter
    behavior: BehaviorFilter
  }

  type LocationFilter {
    countries: [String!]
    cities: [String!]
    regions: [String!]
  }

  type BehaviorFilter {
    lastLoginAfter: DateTime
    lastLoginBefore: DateTime
    registeredAfter: DateTime
    registeredBefore: DateTime
  }

  type TargetingExclusions {
    userIds: [String!]
    userSegments: [String!]
    optedOutCategories: [String!]
  }

  type Schedule {
    sendAt: DateTime
    timezone: String!
    sendImmediately: Boolean!
    respectQuietHours: Boolean!
    staggerDelivery: StaggerDelivery
    recurring: RecurringSchedule
  }

  type StaggerDelivery {
    enabled: Boolean!
    durationMinutes: Int!
    distribution: String!
  }

  type RecurringSchedule {
    enabled: Boolean!
    pattern: String!
    interval: Int!
    endDate: DateTime
    maxOccurrences: Int
  }

  type GroupSettings {
    batchSize: Int!
    batchDelayMs: Int!
    maxRetries: Int!
    retryDelayMs: Int!
    enableRateLimiting: Boolean!
    rateLimitPerSecond: Int
    rateLimitPerMinute: Int
    rateLimitPerHour: Int
    suppressDuplicates: Boolean!
    respectUserPreferences: Boolean!
    trackingEnabled: Boolean!
    unsubscribeEnabled: Boolean!
  }

  type GroupMetrics {
    totalRecipients: Int!
    targetedRecipients: Int!
    eligibleRecipients: Int!
    sentCount: Int!
    deliveredCount: Int!
    failedCount: Int!
    bouncedCount: Int!
    openedCount: Int!
    clickedCount: Int!
    unsubscribedCount: Int!
    complainedCount: Int!
    costTotal: Float!
    currency: String!
  }

  type DeliveryLog {
    id: ID!
    notification: Notification!
    notificationId: ID!
    status: DeliveryStatus!
    channel: NotificationChannel!
    provider: String!
    providerMessageId: String
    providerBatchId: String
    recipientAddress: String!
    metrics: DeliveryMetrics!
    context: DeliveryContext
    errorMessage: String
    errorCode: String
    rawResponse: String
    sentAt: DateTime
    deliveredAt: DateTime
    bouncedAt: DateTime
    openedAt: DateTime
    clickedAt: DateTime
    failedAt: DateTime
    attemptNumber: Int!
    isRetry: Boolean!
    originalDeliveryLogId: ID
    cost: Float
    currency: String
    createdAt: DateTime!
    webhookData: JSON
    isSuccessful: Boolean!
    isFailed: Boolean!
    isPending: Boolean!
    isDeferred: Boolean!
    hasEngagement: Boolean!
    deliveryDuration: Int
    totalDuration: Int!
  }

  type DeliveryMetrics {
    attemptNumber: Int!
    latencyMs: Int!
    retryDelayMs: Int
    httpStatusCode: Int
    responseTime: Int
    providerMessageId: String
    providerResponse: JSON
  }

  type DeliveryContext {
    userAgent: String
    ipAddress: String
    deviceType: String
    location: JSON
    clickedLinks: [String!]
    openedAt: DateTime
    clickedAt: DateTime
  }

  type NotificationStats {
    total: Int!
    pending: Int!
    sent: Int!
    delivered: Int!
    failed: Int!
    byChannel: JSON!
    byPriority: JSON!
  }

  type TemplateTestResult {
    success: Boolean!
    result: RenderResult
    error: String
    performance: PerformanceMetrics
  }

  type RenderResult {
    subject: String!
    body: String!
    htmlBody: String
    preheader: String
    metadata: JSON
  }

  type PerformanceMetrics {
    renderTime: Int!
    memoryUsage: Int!
  }

  type HealthCheck {
    status: String!
    services: JSON!
    metrics: JSON!
  }

  # Input Types

  input SendNotificationInput {
    recipientId: String!
    channel: NotificationChannel!
    subject: String!
    content: String!
    templateId: ID
    templateVariables: JSON
    priority: NotificationPriority
    scheduledAt: DateTime
    metadata: JSON
    locale: String
    correlationId: String
    campaignId: String
  }

  input BulkNotificationInput {
    recipientIds: [String!]!
    channel: NotificationChannel!
    subject: String!
    content: String!
    templateId: ID
    templateVariables: JSON
    priority: NotificationPriority
    scheduledAt: DateTime
    metadata: JSON
    locale: String
    campaignId: String
    batchSize: Int
    batchDelayMs: Int
  }

  input CreateTemplateInput {
    name: String!
    displayName: String
    description: String
    channel: NotificationChannel!
    type: NotificationType!
    category: String
    variables: [TemplateVariableInput!]!
    content: JSON!
    settings: TemplateSettingsInput!
    fromEmail: String
    fromName: String
    replyTo: String
    tags: [String!]
  }

  input UpdateTemplateInput {
    name: String
    displayName: String
    description: String
    category: String
    variables: [TemplateVariableInput!]
    content: JSON
    settings: TemplateSettingsInput
    fromEmail: String
    fromName: String
    replyTo: String
    tags: [String!]
  }

  input TemplateVariableInput {
    name: String!
    type: String!
    required: Boolean!
    defaultValue: JSON
    description: String
    validation: TemplateValidationInput
  }

  input TemplateValidationInput {
    min: Float
    max: Float
    pattern: String
    enum: [String!]
  }

  input TemplateSettingsInput {
    engine: TemplateEngine!
    enableHtml: Boolean!
    enablePreheader: Boolean!
    trackOpens: Boolean!
    trackClicks: Boolean!
    unsubscribeLink: Boolean!
    customHeaders: JSON
    attachments: [TemplateAttachmentInput!]
  }

  input TemplateAttachmentInput {
    name: String!
    url: String!
    type: String!
  }

  input UpdatePreferenceInput {
    channel: NotificationChannel
    type: NotificationType
    enabled: Boolean
    channelSettings: ChannelSettingsInput
    typeSettings: TypeSettingsInput
    locale: String
    timezone: String
    contactInfo: ContactInfoInput
  }

  input ChannelSettingsInput {
    enabled: Boolean!
    frequency: String!
    quietHours: QuietHoursInput
    deliveryWindow: DeliveryWindowInput
    rateLimits: RateLimitsInput
  }

  input QuietHoursInput {
    enabled: Boolean!
    startTime: String!
    endTime: String!
    timezone: String!
  }

  input DeliveryWindowInput {
    enabled: Boolean!
    startTime: String!
    endTime: String!
    timezone: String!
  }

  input RateLimitsInput {
    maxPerHour: Int
    maxPerDay: Int
    maxPerWeek: Int
  }

  input TypeSettingsInput {
    enabled: Boolean!
    channels: [NotificationChannel!]!
    priority: String!
    consolidation: ConsolidationSettingsInput
  }

  input ConsolidationSettingsInput {
    enabled: Boolean!
    windowMinutes: Int!
    maxCount: Int!
  }

  input ContactInfoInput {
    email: String
    phone: String
    deviceTokens: [String!]
  }

  input CreateGroupInput {
    name: String!
    description: String
    type: GroupType!
    channel: NotificationChannel!
    notificationType: NotificationType!
    priority: NotificationPriority
    campaignId: String
    templateId: String
    targeting: TargetingInput!
    schedule: ScheduleInput!
    settings: GroupSettingsInput!
    templateVariables: JSON
    tags: [String!]
  }

  input TargetingInput {
    userIds: [String!]
    userSegments: [String!]
    filters: TargetingFiltersInput
    exclusions: TargetingExclusionsInput
  }

  input TargetingFiltersInput {
    properties: JSON
    tags: [String!]
    location: LocationFilterInput
    behavior: BehaviorFilterInput
  }

  input LocationFilterInput {
    countries: [String!]
    cities: [String!]
    regions: [String!]
  }

  input BehaviorFilterInput {
    lastLoginAfter: DateTime
    lastLoginBefore: DateTime
    registeredAfter: DateTime
    registeredBefore: DateTime
  }

  input TargetingExclusionsInput {
    userIds: [String!]
    userSegments: [String!]
    optedOutCategories: [String!]
  }

  input ScheduleInput {
    sendAt: DateTime
    timezone: String!
    sendImmediately: Boolean!
    respectQuietHours: Boolean!
    staggerDelivery: StaggerDeliveryInput
    recurring: RecurringScheduleInput
  }

  input StaggerDeliveryInput {
    enabled: Boolean!
    durationMinutes: Int!
    distribution: String!
  }

  input RecurringScheduleInput {
    enabled: Boolean!
    pattern: String!
    interval: Int!
    endDate: DateTime
    maxOccurrences: Int
  }

  input GroupSettingsInput {
    batchSize: Int!
    batchDelayMs: Int!
    maxRetries: Int!
    retryDelayMs: Int!
    enableRateLimiting: Boolean!
    rateLimitPerSecond: Int
    rateLimitPerMinute: Int
    rateLimitPerHour: Int
    suppressDuplicates: Boolean!
    respectUserPreferences: Boolean!
    trackingEnabled: Boolean!
    unsubscribeEnabled: Boolean!
  }

  # Query Types

  type Query {
    # Notifications
    notification(id: ID!): Notification
    notifications(
      recipientId: String
      channel: NotificationChannel
      status: NotificationStatus
      limit: Int = 50
      offset: Int = 0
      dateFrom: DateTime
      dateTo: DateTime
    ): [Notification!]!
    
    userNotifications(
      userId: String!
      channel: NotificationChannel = IN_APP
      limit: Int = 50
      offset: Int = 0
      unreadOnly: Boolean = false
    ): [Notification!]!
    
    notificationStats(
      dateFrom: DateTime
      dateTo: DateTime
      userId: String
      channel: NotificationChannel
    ): NotificationStats!

    # Templates
    template(id: ID!): NotificationTemplate
    templates(
      channel: NotificationChannel
      type: NotificationType
      status: TemplateStatus
      category: String
      limit: Int = 50
      offset: Int = 0
    ): [NotificationTemplate!]!
    
    templatesByName(name: String!): [NotificationTemplate!]!

    # Preferences
    userPreferences(userId: String!): [NotificationPreference!]!
    preference(id: ID!): NotificationPreference

    # Groups
    group(id: ID!): NotificationGroup
    groups(
      status: GroupStatus
      type: GroupType
      campaignId: String
      limit: Int = 50
      offset: Int = 0
    ): [NotificationGroup!]!

    # Delivery Logs
    deliveryLogs(
      notificationId: ID
      status: DeliveryStatus
      channel: NotificationChannel
      provider: String
      dateFrom: DateTime
      dateTo: DateTime
      limit: Int = 50
      offset: Int = 0
    ): [DeliveryLog!]!

    # Health
    healthCheck: HealthCheck!
  }

  # Mutation Types

  type Mutation {
    # Notifications
    sendNotification(input: SendNotificationInput!): Notification!
    sendBulkNotifications(input: BulkNotificationInput!): NotificationGroup!
    markNotificationAsRead(id: ID!, userId: String!): Notification!
    cancelNotification(id: ID!): Notification!
    retryNotification(id: ID!): Notification!

    # Templates
    createTemplate(input: CreateTemplateInput!): NotificationTemplate!
    updateTemplate(id: ID!, input: UpdateTemplateInput!): NotificationTemplate!
    deleteTemplate(id: ID!): Boolean!
    publishTemplate(id: ID!): NotificationTemplate!
    archiveTemplate(id: ID!): NotificationTemplate!
    testTemplate(id: ID!, variables: JSON!, locale: String = "en"): TemplateTestResult!

    # Preferences
    updateUserPreference(userId: String!, input: UpdatePreferenceInput!): NotificationPreference!
    optInUser(userId: String!, channel: NotificationChannel, type: NotificationType): NotificationPreference!
    optOutUser(userId: String!, channel: NotificationChannel, type: NotificationType, reason: String): NotificationPreference!
    blockUser(userId: String!, reason: String): NotificationPreference!
    updateContactInfo(userId: String!, contactInfo: ContactInfoInput!): NotificationPreference!

    # Groups
    createNotificationGroup(input: CreateGroupInput!): NotificationGroup!
    startGroup(id: ID!): NotificationGroup!
    pauseGroup(id: ID!): NotificationGroup!
    resumeGroup(id: ID!): NotificationGroup!
    cancelGroup(id: ID!, reason: String): NotificationGroup!
    approveGroup(id: ID!): NotificationGroup!

    # Delivery
    processDelivery(notificationId: ID!): DeliveryLog!
    processScheduledNotifications: Int!
    processRetryQueue: Int!

    # Webhooks
    handleWebhook(provider: String!, data: JSON!): Boolean!
  }

  # Subscription Types

  type Subscription {
    notificationUpdated(userId: String!): Notification!
    groupStatusChanged(groupId: ID!): NotificationGroup!
    deliveryStatusChanged(notificationId: ID!): DeliveryLog!
  }
`;
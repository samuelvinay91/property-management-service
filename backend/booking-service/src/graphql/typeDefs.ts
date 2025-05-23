import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  enum BookingType {
    PROPERTY_VIEWING
    MAINTENANCE_APPOINTMENT
    INSPECTION
    MOVE_IN
    MOVE_OUT
    CONSULTATION
    MEETING
    PROPERTY_TOUR
    VIRTUAL_TOUR
    OTHER
  }

  enum BookingStatus {
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
    NO_SHOW
    RESCHEDULED
  }

  enum BookingPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum SlotStatus {
    AVAILABLE
    BOOKED
    BLOCKED
    TENTATIVE
  }

  enum SlotType {
    REGULAR
    BREAK
    LUNCH
    BUFFER
    MAINTENANCE
    SPECIAL
  }

  enum ParticipantRole {
    ORGANIZER
    ATTENDEE
    PRESENTER
    OBSERVER
    REQUIRED
    OPTIONAL
  }

  enum ParticipantStatus {
    INVITED
    ACCEPTED
    DECLINED
    TENTATIVE
    NO_RESPONSE
    ATTENDED
    NO_SHOW
  }

  enum ParticipantType {
    TENANT
    LANDLORD
    AGENT
    VENDOR
    INSPECTOR
    MANAGER
    GUEST
    EXTERNAL
  }

  enum TemplateStatus {
    ACTIVE
    INACTIVE
    DRAFT
  }

  enum CalendarType {
    PERSONAL
    SHARED
    RESOURCE
    PROPERTY
    TEAM
  }

  enum CalendarStatus {
    ACTIVE
    INACTIVE
    ARCHIVED
  }

  type Booking {
    id: ID!
    title: String!
    description: String
    type: BookingType!
    status: BookingStatus!
    priority: BookingPriority!
    propertyId: String!
    unitId: String
    requestedBy: String!
    requestedByType: String!
    assignedTo: String
    startTime: DateTime!
    endTime: DateTime!
    timezone: String
    duration: Int!
    location: String
    virtualMeetingUrl: String
    virtualMeetingId: String
    virtualMeetingPassword: String
    contactPhone: String
    contactEmail: String
    specialInstructions: String
    requirements: JSON
    attendeeInstructions: JSON
    isRecurring: Boolean!
    recurringPattern: String
    parentBookingId: String
    isActive: Boolean!
    requiresConfirmation: Boolean!
    allowRescheduling: Boolean!
    minNoticeHours: Int
    maxAdvanceBookingDays: Int
    cancellationReason: String
    confirmedAt: DateTime
    confirmedBy: String
    cancelledAt: DateTime
    cancelledBy: String
    completedAt: DateTime
    completionNotes: String
    rating: Int
    feedback: String
    metadata: JSON
    customFields: JSON
    reminders: JSON
    calendarEventId: String
    createdAt: DateTime!
    updatedAt: DateTime!
    slot: BookingSlot
    participants: [Participant!]!
    recurringInstances: [Booking!]!
  }

  type BookingSlot {
    id: ID!
    title: String
    description: String
    startTime: DateTime!
    endTime: DateTime!
    timezone: String
    duration: Int!
    status: SlotStatus!
    type: SlotType!
    resourceId: String
    resourceType: String
    propertyId: String
    unitId: String
    location: String
    capacity: Int!
    bookedCount: Int!
    isBookable: Boolean!
    requiresApproval: Boolean!
    allowedBookingTypes: [String!]
    minBookingDuration: Int
    maxBookingDuration: Int
    cost: Float
    currency: String
    pricing: JSON
    bookingRules: String
    requiredCapabilities: [String!]
    bufferTimeBefore: Int
    bufferTimeAfter: Int
    isRecurring: Boolean!
    recurringPattern: String
    parentSlotId: String
    blockedReason: String
    blockedBy: String
    blockedAt: DateTime
    metadata: JSON
    customFields: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    bookings: [Booking!]!
    template: AvailabilityTemplate
    recurringInstances: [BookingSlot!]!
  }

  type AvailabilityTemplate {
    id: ID!
    name: String!
    description: String
    status: TemplateStatus!
    resourceId: String
    resourceType: String
    propertyId: String
    timezone: String
    effectiveFrom: DateTime
    effectiveTo: DateTime
    weeklySchedule: JSON
    holidayOverrides: JSON
    specialDates: JSON
    defaultSlotDuration: Int!
    defaultBreakDuration: Int!
    defaultCapacity: Int!
    minBookingNotice: Int
    maxAdvanceBooking: Int
    allowBackToBackBookings: Boolean!
    bufferTimeBetweenBookings: Int
    defaultBookingTypes: [String!]
    defaultCost: Float
    defaultCurrency: String
    autoApprovalRules: JSON
    requiresApproval: Boolean!
    notificationSettings: JSON
    bookingInstructions: String
    metadata: JSON
    createdBy: String!
    updatedBy: String
    createdAt: DateTime!
    updatedAt: DateTime!
    slots: [BookingSlot!]!
    isCurrentlyActive: Boolean!
  }

  type Participant {
    id: ID!
    name: String!
    email: String!
    phone: String
    userId: String
    type: ParticipantType!
    role: ParticipantRole!
    status: ParticipantStatus!
    isOrganizer: Boolean!
    isRequired: Boolean!
    canReschedule: Boolean!
    canCancel: Boolean!
    invitedAt: DateTime
    respondedAt: DateTime
    responseMessage: String
    checkedInAt: DateTime
    checkedOutAt: DateTime
    specialRequirements: String
    preferences: JSON
    calendarEventId: String
    receiveReminders: Boolean!
    receiveUpdates: Boolean!
    notificationPreferences: JSON
    notes: String
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    booking: Booking!
  }

  type Calendar {
    id: ID!
    name: String!
    description: String
    type: CalendarType!
    status: CalendarStatus!
    ownerId: String
    resourceId: String
    resourceType: String
    propertyId: String
    timezone: String
    color: String
    isPublic: Boolean!
    allowBookings: Boolean!
    requiresApproval: Boolean!
    permissions: JSON
    defaultBookingSettings: JSON
    externalCalendarId: String
    externalProvider: String
    syncSettings: JSON
    workingHours: JSON
    holidays: JSON
    blockedDates: JSON
    metadata: JSON
    createdBy: String!
    updatedBy: String
    createdAt: DateTime!
    updatedAt: DateTime!
    slots: [BookingSlot!]!
  }

  type BookingConflict {
    conflictType: String!
    conflictingBooking: Booking
    conflictingSlot: BookingSlot
    message: String!
    suggestions: [BookingSuggestion!]!
  }

  type BookingSuggestion {
    startTime: DateTime!
    endTime: DateTime!
    slot: BookingSlot
    score: Float!
    reason: String!
  }

  type AvailabilityPeriod {
    startTime: DateTime!
    endTime: DateTime!
    isAvailable: Boolean!
    slots: [BookingSlot!]!
    capacity: Int!
    bookedCount: Int!
  }

  type BookingStats {
    totalBookings: Int!
    confirmedBookings: Int!
    pendingBookings: Int!
    cancelledBookings: Int!
    completedBookings: Int!
    noShowBookings: Int!
    averageRating: Float!
    bookingsByType: [TypeCount!]!
    bookingsByStatus: [StatusCount!]!
    monthlyTrend: [MonthlyBookingTrend!]!
    popularTimeSlots: [TimeSlotPopularity!]!
    averageDuration: Float!
    cancellationRate: Float!
    noShowRate: Float!
  }

  type TypeCount {
    type: String!
    count: Int!
  }

  type StatusCount {
    status: String!
    count: Int!
  }

  type MonthlyBookingTrend {
    month: String!
    totalBookings: Int!
    confirmedBookings: Int!
    averageRating: Float!
  }

  type TimeSlotPopularity {
    hour: Int!
    count: Int!
    percentage: Float!
  }

  # Input Types
  input CreateBookingInput {
    title: String!
    description: String
    type: BookingType!
    priority: BookingPriority = MEDIUM
    propertyId: String!
    unitId: String
    requestedBy: String!
    requestedByType: String!
    assignedTo: String
    startTime: DateTime!
    endTime: DateTime!
    timezone: String
    location: String
    virtualMeetingUrl: String
    contactPhone: String
    contactEmail: String
    specialInstructions: String
    requirements: JSON
    isRecurring: Boolean = false
    recurringPattern: String
    requiresConfirmation: Boolean = true
    allowRescheduling: Boolean = true
    minNoticeHours: Int
    maxAdvanceBookingDays: Int
    customFields: JSON
    participants: [CreateParticipantInput!]
    reminders: JSON
  }

  input UpdateBookingInput {
    title: String
    description: String
    priority: BookingPriority
    assignedTo: String
    startTime: DateTime
    endTime: DateTime
    timezone: String
    location: String
    virtualMeetingUrl: String
    contactPhone: String
    contactEmail: String
    specialInstructions: String
    requirements: JSON
    allowRescheduling: Boolean
    customFields: JSON
    reminders: JSON
  }

  input CreateParticipantInput {
    name: String!
    email: String!
    phone: String
    userId: String
    type: ParticipantType!
    role: ParticipantRole = ATTENDEE
    isRequired: Boolean = true
    specialRequirements: String
    preferences: JSON
    receiveReminders: Boolean = true
    receiveUpdates: Boolean = true
    notificationPreferences: JSON
  }

  input UpdateParticipantInput {
    name: String
    email: String
    phone: String
    role: ParticipantRole
    status: ParticipantStatus
    isRequired: Boolean
    specialRequirements: String
    preferences: JSON
    receiveReminders: Boolean
    receiveUpdates: Boolean
    notificationPreferences: JSON
    responseMessage: String
  }

  input CreateSlotInput {
    title: String
    description: String
    startTime: DateTime!
    endTime: DateTime!
    timezone: String
    type: SlotType = REGULAR
    resourceId: String
    resourceType: String
    propertyId: String
    unitId: String
    location: String
    capacity: Int = 1
    isBookable: Boolean = true
    requiresApproval: Boolean = false
    allowedBookingTypes: [String!]
    minBookingDuration: Int
    maxBookingDuration: Int
    cost: Float
    currency: String
    pricing: JSON
    bookingRules: String
    requiredCapabilities: [String!]
    bufferTimeBefore: Int
    bufferTimeAfter: Int
    isRecurring: Boolean = false
    recurringPattern: String
    customFields: JSON
  }

  input UpdateSlotInput {
    title: String
    description: String
    startTime: DateTime
    endTime: DateTime
    timezone: String
    status: SlotStatus
    type: SlotType
    capacity: Int
    isBookable: Boolean
    requiresApproval: Boolean
    allowedBookingTypes: [String!]
    cost: Float
    currency: String
    pricing: JSON
    bookingRules: String
    customFields: JSON
  }

  input CreateTemplateInput {
    name: String!
    description: String
    resourceId: String
    resourceType: String
    propertyId: String
    timezone: String
    effectiveFrom: DateTime
    effectiveTo: DateTime
    weeklySchedule: JSON!
    holidayOverrides: JSON
    specialDates: JSON
    defaultSlotDuration: Int = 30
    defaultBreakDuration: Int = 0
    defaultCapacity: Int = 1
    minBookingNotice: Int
    maxAdvanceBooking: Int
    allowBackToBackBookings: Boolean = true
    bufferTimeBetweenBookings: Int
    defaultBookingTypes: [String!]
    defaultCost: Float
    defaultCurrency: String
    autoApprovalRules: JSON
    requiresApproval: Boolean = false
    notificationSettings: JSON
    bookingInstructions: String
    metadata: JSON
  }

  input BookingFilters {
    type: [BookingType!]
    status: [BookingStatus!]
    priority: [BookingPriority!]
    propertyId: String
    unitId: String
    requestedBy: String
    assignedTo: String
    dateFrom: DateTime
    dateTo: DateTime
    isRecurring: Boolean
    search: String
  }

  input SlotFilters {
    status: [SlotStatus!]
    type: [SlotType!]
    resourceId: String
    resourceType: String
    propertyId: String
    unitId: String
    dateFrom: DateTime
    dateTo: DateTime
    isBookable: Boolean
    minCapacity: Int
    search: String
  }

  input AvailabilityQuery {
    resourceId: String
    resourceType: String
    propertyId: String
    unitId: String
    dateFrom: DateTime!
    dateTo: DateTime!
    duration: Int
    bookingType: BookingType
    excludeBookingId: String
  }

  # Queries
  type Query {
    # Booking queries
    booking(id: ID!): Booking
    bookings(filters: BookingFilters, limit: Int = 50, offset: Int = 0): [Booking!]!
    upcomingBookings(userId: String, days: Int = 7): [Booking!]!
    bookingsByProperty(propertyId: String!, filters: BookingFilters): [Booking!]!
    bookingConflicts(bookingInput: CreateBookingInput!): [BookingConflict!]!
    
    # Slot queries
    slot(id: ID!): BookingSlot
    slots(filters: SlotFilters, limit: Int = 100, offset: Int = 0): [BookingSlot!]!
    availableSlots(query: AvailabilityQuery!): [BookingSlot!]!
    slotAvailability(query: AvailabilityQuery!): [AvailabilityPeriod!]!
    
    # Template queries
    template(id: ID!): AvailabilityTemplate
    templates(resourceId: String, resourceType: String, status: TemplateStatus): [AvailabilityTemplate!]!
    
    # Calendar queries
    calendar(id: ID!): Calendar
    calendars(ownerId: String, resourceType: String, propertyId: String): [Calendar!]!
    
    # Participant queries
    participant(id: ID!): Participant
    bookingParticipants(bookingId: String!): [Participant!]!
    
    # Statistics and analytics
    bookingStats(propertyIds: [String!], dateRange: JSON): BookingStats!
    resourceUtilization(resourceId: String!, dateRange: JSON): JSON!
    
    # Suggestions
    suggestBookingTimes(query: AvailabilityQuery!, preferences: JSON): [BookingSuggestion!]!
  }

  # Mutations
  type Mutation {
    # Booking mutations
    createBooking(input: CreateBookingInput!): Booking!
    updateBooking(id: ID!, input: UpdateBookingInput!): Booking!
    confirmBooking(id: ID!, confirmedBy: String!): Booking!
    cancelBooking(id: ID!, reason: String!, cancelledBy: String!): Booking!
    rescheduleBooking(id: ID!, newStartTime: DateTime!, newEndTime: DateTime!, reason: String!, rescheduledBy: String!): Booking!
    completeBooking(id: ID!, completionNotes: String, rating: Int, feedback: String): Booking!
    checkInParticipant(bookingId: ID!, participantId: ID!): Participant!
    checkOutParticipant(bookingId: ID!, participantId: ID!): Participant!
    
    # Bulk operations
    bulkUpdateBookings(ids: [ID!]!, updates: UpdateBookingInput!): [Booking!]!
    bulkCancelBookings(ids: [ID!]!, reason: String!, cancelledBy: String!): [Booking!]!
    
    # Slot mutations
    createSlot(input: CreateSlotInput!): BookingSlot!
    updateSlot(id: ID!, input: UpdateSlotInput!): BookingSlot!
    blockSlot(id: ID!, reason: String!, blockedBy: String!): BookingSlot!
    unblockSlot(id: ID!): BookingSlot!
    deleteSlot(id: ID!): Boolean!
    
    # Generate slots from template
    generateSlotsFromTemplate(templateId: ID!, dateFrom: DateTime!, dateTo: DateTime!): [BookingSlot!]!
    
    # Template mutations
    createTemplate(input: CreateTemplateInput!): AvailabilityTemplate!
    updateTemplate(id: ID!, input: CreateTemplateInput!): AvailabilityTemplate!
    activateTemplate(id: ID!): AvailabilityTemplate!
    deactivateTemplate(id: ID!): AvailabilityTemplate!
    deleteTemplate(id: ID!): Boolean!
    
    # Participant mutations
    addParticipant(bookingId: ID!, input: CreateParticipantInput!): Participant!
    updateParticipant(id: ID!, input: UpdateParticipantInput!): Participant!
    removeParticipant(id: ID!): Boolean!
    respondToInvitation(id: ID!, status: ParticipantStatus!, responseMessage: String): Participant!
    
    # Calendar integration
    syncWithExternalCalendar(calendarId: ID!): Calendar!
    exportBookingToCalendar(bookingId: ID!, calendarId: ID!): String!
  }

  # Subscriptions
  type Subscription {
    bookingUpdated(propertyId: String, userId: String): Booking!
    slotAvailabilityChanged(resourceId: String, propertyId: String): BookingSlot!
    newBookingRequest(assignedTo: String): Booking!
  }
`;
// Shared types across all microservices

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  PROPERTY_MANAGER = 'property_manager',
  LANDLORD = 'landlord',
  TENANT = 'tenant',
  MAINTENANCE_STAFF = 'maintenance_staff',
  AGENT = 'agent'
}

export interface Property {
  id: string;
  ownerId: string;
  managerId?: string;
  title: string;
  description: string;
  address: Address;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  amenities: string[];
  images: string[];
  documents: Document[];
  rent: number;
  deposit: number;
  isAvailable: boolean;
  features: PropertyFeature[];
  utilities: Utility[];
  petPolicy: PetPolicy;
  createdAt: Date;
  updatedAt: Date;
}

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  CONDO = 'condo',
  TOWNHOUSE = 'townhouse',
  STUDIO = 'studio',
  COMMERCIAL = 'commercial'
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Tenant {
  id: string;
  userId: string;
  propertyId?: string;
  leaseId?: string;
  emergencyContact: EmergencyContact;
  employmentInfo: EmploymentInfo;
  creditScore?: number;
  monthlyIncome: number;
  moveInDate?: Date;
  moveOutDate?: Date;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum TenantStatus {
  PROSPECTIVE = 'prospective',
  APPROVED = 'approved',
  ACTIVE = 'active',
  FORMER = 'former',
  REJECTED = 'rejected'
}

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  terms: string;
  status: LeaseStatus;
  documents: Document[];
  renewalOptions?: RenewalOption[];
  createdAt: Date;
  updatedAt: Date;
}

export enum LeaseStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed'
}

export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  leaseId: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  dueDate: Date;
  paidDate?: Date;
  lateFee?: number;
  description: string;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentType {
  RENT = 'rent',
  DEPOSIT = 'deposit',
  LATE_FEE = 'late_fee',
  UTILITY = 'utility',
  MAINTENANCE = 'maintenance',
  OTHER = 'other'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  CASH = 'cash',
  PAYPAL = 'paypal'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  propertyId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: MaintenanceStatus;
  images: string[];
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  tenantAccessRequired: boolean;
  emergencyContact: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum MaintenanceCategory {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HVAC = 'hvac',
  APPLIANCE = 'appliance',
  PEST_CONTROL = 'pest_control',
  CLEANING = 'cleaning',
  PAINTING = 'painting',
  FLOORING = 'flooring',
  LANDSCAPING = 'landscaping',
  SECURITY = 'security',
  OTHER = 'other'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EMERGENCY = 'emergency'
}

export enum MaintenanceStatus {
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Booking {
  id: string;
  propertyId: string;
  prospectiveTenantId: string;
  type: BookingType;
  scheduledDate: Date;
  duration: number; // in minutes
  status: BookingStatus;
  notes?: string;
  agentId?: string;
  meetingLink?: string;
  contactInfo: ContactInfo;
  createdAt: Date;
  updatedAt: Date;
}

export enum BookingType {
  PROPERTY_VIEWING = 'property_viewing',
  VIRTUAL_TOUR = 'virtual_tour',
  LEASE_SIGNING = 'lease_signing',
  INSPECTION = 'inspection',
  MAINTENANCE_ACCESS = 'maintenance_access'
}

export enum BookingStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: Priority;
  channel: NotificationChannel[];
  isRead: boolean;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  RENT_DUE = 'rent_due',
  RENT_OVERDUE = 'rent_overdue',
  MAINTENANCE_UPDATE = 'maintenance_update',
  LEASE_EXPIRY = 'lease_expiry',
  BOOKING_CONFIRMATION = 'booking_confirmation',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  GENERAL = 'general'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  tags: string[];
  isPublic: boolean;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  LEASE_AGREEMENT = 'lease_agreement',
  ID_DOCUMENT = 'id_document',
  INCOME_PROOF = 'income_proof',
  REFERENCE_LETTER = 'reference_letter',
  INSURANCE = 'insurance',
  INSPECTION_REPORT = 'inspection_report',
  RECEIPT = 'receipt',
  OTHER = 'other'
}

// Supporting interfaces
export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface EmploymentInfo {
  company: string;
  position: string;
  monthlyIncome: number;
  startDate: Date;
  contactInfo?: ContactInfo;
}

export interface ContactInfo {
  phoneNumber: string;
  email: string;
}

export interface PropertyFeature {
  name: string;
  description?: string;
  category: string;
}

export interface Utility {
  name: string;
  provider: string;
  accountNumber?: string;
  includedInRent: boolean;
  averageCost?: number;
}

export interface PetPolicy {
  allowed: boolean;
  types?: string[];
  maxCount?: number;
  deposit?: number;
  monthlyFee?: number;
  restrictions?: string[];
}

export interface RenewalOption {
  term: number; // in months
  rentIncrease: number; // percentage or flat amount
  conditions?: string[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    pagination?: PaginationMeta;
    filters?: Record<string, any>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  propertyType?: PropertyType[];
  minRent?: number;
  maxRent?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  amenities?: string[];
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
    radius?: number; // in miles
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  availability?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Analytics types
export interface PropertyAnalytics {
  propertyId: string;
  occupancyRate: number;
  averageRent: number;
  monthlyRevenue: number;
  maintenanceCosts: number;
  tenantSatisfactionScore: number;
  viewings: number;
  applications: number;
  timeToLease: number; // in days
  period: {
    start: Date;
    end: Date;
  };
}

// Chat/Messaging types
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'ai';
  content: string;
  messageType: ChatMessageType;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ChatMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  BOOKING_REQUEST = 'booking_request',
  PAYMENT_LINK = 'payment_link',
  MAINTENANCE_REQUEST = 'maintenance_request',
  SYSTEM = 'system'
}

export interface Conversation {
  id: string;
  participants: string[];
  propertyId?: string;
  type: ConversationType;
  status: ConversationStatus;
  lastMessage?: ChatMessage;
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConversationType {
  TENANT_LANDLORD = 'tenant_landlord',
  TENANT_SUPPORT = 'tenant_support',
  AI_ASSISTANT = 'ai_assistant',
  GROUP = 'group'
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  CLOSED = 'closed'
}
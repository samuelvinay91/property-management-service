// Core entity types
export interface Property {
  id: string;
  name: string;
  description?: string;
  type: PropertyType;
  status: PropertyStatus;
  address: Address;
  ownerId: string;
  managerId?: string;
  totalUnits: number;
  availableUnits: number;
  rent?: number;
  currency?: string;
  images: PropertyImage[];
  amenities: PropertyAmenity[];
  documents: PropertyDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  type: UnitType;
  status: UnitStatus;
  bedrooms: number;
  bathrooms: number;
  area: number;
  rent: number;
  currency: string;
  deposit: number;
  availableFrom?: string;
  description?: string;
  images: string[];
  amenities: string[];
  currentTenant?: Tenant;
  lease?: Lease;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  occupation?: string;
  emergencyContacts: EmergencyContact[];
  documents: TenantDocument[];
  applications: Application[];
  leases: Lease[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  title: string;
  description?: string;
  type: BookingType;
  status: BookingStatus;
  priority: BookingPriority;
  propertyId: string;
  unitId?: string;
  requestedBy: string;
  assignedTo?: string;
  startTime: string;
  endTime: string;
  duration: number;
  location?: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: RequestCategory;
  priority: RequestPriority;
  status: RequestStatus;
  propertyId: string;
  unitId?: string;
  requestedBy: string;
  photos: string[];
  workOrders: WorkOrder[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  propertyId: string;
  assignedTo?: string;
  vendor?: Vendor;
  scheduledDate?: string;
  completedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  payerId: string;
  payeeId: string;
  propertyId?: string;
  unitId?: string;
  dueDate: string;
  paidAt?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

// Supporting types
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
}

export interface PropertyAmenity {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface TenantDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface Application {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId?: string;
  status: ApplicationStatus;
  desiredMoveInDate: string;
  monthlyIncome: number;
  employmentStatus: string;
  submittedAt: string;
}

export interface Lease {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: LeaseStatus;
  terms: string;
  signedAt?: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  type: ParticipantType;
  role: ParticipantRole;
  status: ParticipantStatus;
}

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  email: string;
  phone: string;
  specialties: string[];
  rating?: number;
  isActive: boolean;
}

// Enums
export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  COMMERCIAL = 'COMMERCIAL',
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  SOLD = 'SOLD',
}

export enum UnitType {
  STUDIO = 'STUDIO',
  ONE_BEDROOM = 'ONE_BEDROOM',
  TWO_BEDROOM = 'TWO_BEDROOM',
  THREE_BEDROOM = 'THREE_BEDROOM',
  FOUR_PLUS_BEDROOM = 'FOUR_PLUS_BEDROOM',
}

export enum UnitStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  RENOVATION = 'RENOVATION',
}

export enum BookingType {
  PROPERTY_VIEWING = 'PROPERTY_VIEWING',
  MAINTENANCE_APPOINTMENT = 'MAINTENANCE_APPOINTMENT',
  INSPECTION = 'INSPECTION',
  MOVE_IN = 'MOVE_IN',
  MOVE_OUT = 'MOVE_OUT',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum BookingPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RequestCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCE = 'APPLIANCE',
  GENERAL = 'GENERAL',
}

export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

export enum RequestStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum WorkOrderType {
  REACTIVE = 'REACTIVE',
  PREVENTIVE = 'PREVENTIVE',
  EMERGENCY = 'EMERGENCY',
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

export enum PaymentType {
  RENT = 'RENT',
  DEPOSIT = 'DEPOSIT',
  UTILITIES = 'UTILITIES',
  MAINTENANCE = 'MAINTENANCE',
  LATE_FEE = 'LATE_FEE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  MAINTENANCE_REQUEST = 'MAINTENANCE_REQUEST',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  LEASE_EXPIRING = 'LEASE_EXPIRING',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum LeaseStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export enum ParticipantType {
  TENANT = 'TENANT',
  AGENT = 'AGENT',
  VENDOR = 'VENDOR',
  MANAGER = 'MANAGER',
}

export enum ParticipantRole {
  ORGANIZER = 'ORGANIZER',
  ATTENDEE = 'ATTENDEE',
}

export enum ParticipantStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export enum VendorType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

// Form types
export interface PropertyFormData {
  name: string;
  description?: string;
  type: PropertyType;
  address: Address;
  totalUnits: number;
  rent?: number;
  currency?: string;
}

export interface MaintenanceRequestFormData {
  title: string;
  description: string;
  category: RequestCategory;
  priority: RequestPriority;
  propertyId: string;
  unitId?: string;
  location?: string;
  photos?: File[];
}

export interface BookingFormData {
  title: string;
  description?: string;
  type: BookingType;
  propertyId: string;
  unitId?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  participants?: ParticipantFormData[];
}

export interface ParticipantFormData {
  name: string;
  email: string;
  type: ParticipantType;
  role: ParticipantRole;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Filter types
export interface PropertyFilters {
  type?: PropertyType[];
  status?: PropertyStatus[];
  minRent?: number;
  maxRent?: number;
  bedrooms?: number[];
  city?: string;
  search?: string;
}

export interface BookingFilters {
  type?: BookingType[];
  status?: BookingStatus[];
  propertyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MaintenanceFilters {
  category?: RequestCategory[];
  status?: RequestStatus[];
  priority?: RequestPriority[];
  propertyId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Dashboard types
export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupancyRate: number;
  totalRevenue: number;
  pendingMaintenance: number;
  upcomingBookings: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface OccupancyData {
  month: string;
  occupied: number;
  vacant: number;
  rate: number;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  AGENT = 'AGENT',
  TENANT = 'TENANT',
  OWNER = 'OWNER',
  VENDOR = 'VENDOR',
}

// Authentication types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
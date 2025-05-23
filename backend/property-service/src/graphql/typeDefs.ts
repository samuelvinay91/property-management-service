import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  type Property @key(fields: "id") {
    id: ID!
    ownerId: ID!
    title: String!
    description: String!
    propertyType: PropertyType!
    status: PropertyStatus!
    listingStatus: ListingStatus!
    
    # Address
    streetAddress: String!
    addressLine2: String
    city: String!
    state: String!
    zipCode: String!
    country: String!
    latitude: Float
    longitude: Float
    fullAddress: String!
    
    # Property Details
    bedrooms: Int!
    bathrooms: Float!
    squareFootage: Int
    lotSize: Int
    yearBuilt: Int
    parkingSpaces: Int!
    petFriendly: Boolean!
    smokingAllowed: Boolean!
    furnished: Boolean!
    
    # Financial
    rentAmount: Float!
    securityDeposit: Float
    applicationFee: Float
    petDeposit: Float
    propertyValue: Float
    monthlyMortgage: Float
    propertyTaxes: Float
    insurance: Float
    hoaFees: Float
    totalMonthlyExpenses: Float!
    netCashFlow: Float!
    capRate: Float!
    
    # Lease Terms
    minLeaseTermMonths: Int!
    maxLeaseTermMonths: Int!
    availableDate: String
    
    # Utilities
    electricityIncluded: Boolean!
    gasIncluded: Boolean!
    waterIncluded: Boolean!
    internetIncluded: Boolean!
    cableIncluded: Boolean!
    trashIncluded: Boolean!
    
    # Features
    features: [String!]!
    appliances: [String!]!
    floorTypes: [String!]!
    
    # Marketing
    virtualTourUrl: String
    videoUrl: String
    keywords: [String!]!
    
    # Analytics
    viewCount: Int!
    inquiryCount: Int!
    applicationCount: Int!
    lastViewedAt: String
    
    # SEO
    metaTitle: String
    metaDescription: String
    slug: String
    
    # Status
    isActive: Boolean!
    isFeatured: Boolean!
    isPublished: Boolean!
    isAvailable: Boolean!
    
    # Relations
    images: [PropertyImage!]!
    documents: [PropertyDocument!]!
    units: [Unit!]!
    amenities: [PropertyAmenity!]!
    
    createdAt: String!
    updatedAt: String!
  }

  type PropertyImage {
    id: ID!
    propertyId: ID!
    url: String!
    thumbnailUrl: String
    originalFilename: String
    alt: String
    caption: String
    type: ImageType!
    sortOrder: Int!
    isPrimary: Boolean!
    isPublic: Boolean!
    width: Int
    height: Int
    fileSize: Int
    mimeType: String
    uploadedBy: String
    aspectRatio: Float
    isLandscape: Boolean!
    isPortrait: Boolean!
    fileSizeFormatted: String!
    createdAt: String!
    updatedAt: String!
  }

  type PropertyDocument {
    id: ID!
    propertyId: ID!
    title: String!
    description: String
    documentType: DocumentType!
    status: DocumentStatus!
    fileName: String!
    originalFileName: String!
    filePath: String!
    fileUrl: String!
    mimeType: String
    fileSize: String
    pageCount: Int
    isPublic: Boolean!
    requiresSignature: Boolean!
    isSigned: Boolean!
    signedBy: String
    signedAt: String
    version: String
    expirationDate: String
    tags: [String!]!
    uploadedBy: String!
    lastModifiedBy: String
    approvedBy: String
    approvedAt: String
    rejectionReason: String
    isExpired: Boolean!
    isExpiringSoon: Boolean!
    fileSizeFormatted: String!
    fileExtension: String!
    isPDF: Boolean!
    isImage: Boolean!
    needsApproval: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Unit {
    id: ID!
    propertyId: ID!
    unitNumber: String!
    unitName: String
    description: String
    unitType: UnitType!
    status: UnitStatus!
    bedrooms: Int!
    bathrooms: Float!
    squareFootage: Int!
    floor: Int
    balcony: Boolean
    patio: Boolean
    privateEntrance: Boolean
    washerDryerInUnit: Boolean
    dishwasher: Boolean
    airConditioning: Boolean
    heating: Boolean
    fireplace: Boolean
    walkInCloset: Boolean
    rentAmount: Float!
    securityDeposit: Float
    petDeposit: Float
    currentTenantId: String
    leaseStartDate: String
    leaseEndDate: String
    availableDate: String
    currentRent: Float
    features: [String!]!
    appliances: [String!]!
    utilities: [String!]!
    lastInspectionDate: String
    nextInspectionDate: String
    maintenanceNotes: String
    images: [String!]!
    virtualTourUrl: String
    floorPlanUrl: String
    viewCount: Int!
    inquiryCount: Int!
    lastViewedAt: String
    isActive: Boolean!
    isFeatured: Boolean!
    isAvailable: Boolean!
    isOccupied: Boolean!
    daysUntilAvailable: Int!
    leaseExpiresSoon: Boolean!
    monthsRemainingOnLease: Int!
    rentPerSquareFoot: Float!
    unitDisplayName: String!
    bedroomBathroomDisplay: String!
    createdAt: String!
    updatedAt: String!
  }

  type PropertyAmenity {
    id: ID!
    propertyId: ID!
    name: String!
    description: String
    category: AmenityCategory!
    isIncluded: Boolean!
    additionalCost: Float
    iconName: String
    imageUrl: String
    sortOrder: Int!
    isActive: Boolean!
    isHighlight: Boolean!
    operatingHours: JSON
    capacity: Int
    ageRestriction: Int
    requiresReservation: Boolean!
    requiresDeposit: Boolean!
    depositAmount: Float
    lastMaintenanceDate: String
    nextMaintenanceDate: String
    maintenanceNotes: String
    isOperational: Boolean!
    isAvailable: Boolean!
    hasCost: Boolean!
    costDisplay: String!
    needsMaintenance: Boolean!
    isOverdueMaintenance: Boolean!
    categoryDisplay: String!
    createdAt: String!
    updatedAt: String!
  }

  type PropertySearchResult {
    properties: [Property!]!
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    totalPages: Int!
    filters: PropertySearchFilters!
  }

  type PropertySearchFilters {
    priceRange: PriceRange
    bedroomRange: Range
    bathroomRange: Range
    squareFootageRange: Range
    propertyTypes: [PropertyType!]
    amenities: [String!]
    features: [String!]
    utilities: [String!]
  }

  type PriceRange {
    min: Float
    max: Float
  }

  type Range {
    min: Int
    max: Int
  }

  type PropertyAnalytics {
    totalProperties: Int!
    activeProperties: Int!
    availableProperties: Int!
    occupiedProperties: Int!
    averageRent: Float!
    totalRentRevenue: Float!
    occupancyRate: Float!
    averageCapRate: Float!
    propertiesByType: [PropertyTypeCount!]!
    propertiesByStatus: [PropertyStatusCount!]!
    monthlyRevenueGrowth: Float!
  }

  type PropertyTypeCount {
    type: PropertyType!
    count: Int!
  }

  type PropertyStatusCount {
    status: PropertyStatus!
    count: Int!
  }

  enum PropertyType {
    APARTMENT
    HOUSE
    CONDO
    TOWNHOUSE
    DUPLEX
    STUDIO
    COMMERCIAL
    OFFICE
    RETAIL
    WAREHOUSE
  }

  enum PropertyStatus {
    ACTIVE
    INACTIVE
    PENDING
    SOLD
    RENTED
    MAINTENANCE
    DRAFT
  }

  enum ListingStatus {
    AVAILABLE
    RENTED
    PENDING
    OFF_MARKET
    MAINTENANCE
  }

  enum UnitType {
    STUDIO
    ONE_BEDROOM
    TWO_BEDROOM
    THREE_BEDROOM
    FOUR_BEDROOM
    FIVE_PLUS_BEDROOM
    LOFT
    PENTHOUSE
    BASEMENT
    COMMERCIAL
    OFFICE
    RETAIL
    STORAGE
  }

  enum UnitStatus {
    AVAILABLE
    OCCUPIED
    MAINTENANCE
    RESERVED
    OFF_MARKET
    PENDING_INSPECTION
    READY_TO_RENT
  }

  enum ImageType {
    EXTERIOR
    INTERIOR
    KITCHEN
    BATHROOM
    BEDROOM
    LIVING_ROOM
    DINING_ROOM
    GARAGE
    YARD
    AMENITY
    FLOOR_PLAN
    OTHER
  }

  enum DocumentType {
    LEASE_AGREEMENT
    PROPERTY_DEED
    INSURANCE_POLICY
    INSPECTION_REPORT
    FLOOR_PLAN
    HOA_DOCUMENTS
    TAX_RECORDS
    UTILITY_BILLS
    MAINTENANCE_RECORDS
    RENTAL_APPLICATION
    BACKGROUND_CHECK
    FINANCIAL_STATEMENTS
    PERMITS
    WARRANTIES
    CONTRACTS
    OTHER
  }

  enum DocumentStatus {
    ACTIVE
    ARCHIVED
    EXPIRED
    PENDING_REVIEW
    REJECTED
  }

  enum AmenityCategory {
    BUILDING
    UNIT
    OUTDOOR
    PARKING
    FITNESS
    ENTERTAINMENT
    BUSINESS
    SAFETY
    ACCESSIBILITY
    UTILITIES
    APPLIANCES
    OTHER
  }

  input PropertyInput {
    title: String!
    description: String!
    propertyType: PropertyType!
    streetAddress: String!
    addressLine2: String
    city: String!
    state: String!
    zipCode: String!
    country: String!
    latitude: Float
    longitude: Float
    bedrooms: Int!
    bathrooms: Float!
    squareFootage: Int
    lotSize: Int
    yearBuilt: Int
    parkingSpaces: Int!
    petFriendly: Boolean!
    smokingAllowed: Boolean!
    furnished: Boolean!
    rentAmount: Float!
    securityDeposit: Float
    applicationFee: Float
    petDeposit: Float
    propertyValue: Float
    monthlyMortgage: Float
    propertyTaxes: Float
    insurance: Float
    hoaFees: Float
    minLeaseTermMonths: Int!
    maxLeaseTermMonths: Int!
    availableDate: String
    electricityIncluded: Boolean!
    gasIncluded: Boolean!
    waterIncluded: Boolean!
    internetIncluded: Boolean!
    cableIncluded: Boolean!
    trashIncluded: Boolean!
    features: [String!]
    appliances: [String!]
    floorTypes: [String!]
    virtualTourUrl: String
    videoUrl: String
    keywords: [String!]
    metaTitle: String
    metaDescription: String
    isFeatured: Boolean
  }

  input PropertyUpdateInput {
    title: String
    description: String
    propertyType: PropertyType
    streetAddress: String
    addressLine2: String
    city: String
    state: String
    zipCode: String
    country: String
    latitude: Float
    longitude: Float
    bedrooms: Int
    bathrooms: Float
    squareFootage: Int
    lotSize: Int
    yearBuilt: Int
    parkingSpaces: Int
    petFriendly: Boolean
    smokingAllowed: Boolean
    furnished: Boolean
    rentAmount: Float
    securityDeposit: Float
    applicationFee: Float
    petDeposit: Float
    propertyValue: Float
    monthlyMortgage: Float
    propertyTaxes: Float
    insurance: Float
    hoaFees: Float
    minLeaseTermMonths: Int
    maxLeaseTermMonths: Int
    availableDate: String
    electricityIncluded: Boolean
    gasIncluded: Boolean
    waterIncluded: Boolean
    internetIncluded: Boolean
    cableIncluded: Boolean
    trashIncluded: Boolean
    features: [String!]
    appliances: [String!]
    floorTypes: [String!]
    virtualTourUrl: String
    videoUrl: String
    keywords: [String!]
    metaTitle: String
    metaDescription: String
    status: PropertyStatus
    listingStatus: ListingStatus
    isFeatured: Boolean
    isPublished: Boolean
  }

  input PropertySearchInput {
    query: String
    location: String
    city: String
    state: String
    zipCode: String
    propertyTypes: [PropertyType!]
    minRent: Float
    maxRent: Float
    minBedrooms: Int
    maxBedrooms: Int
    minBathrooms: Float
    maxBathrooms: Float
    minSquareFootage: Int
    maxSquareFootage: Int
    features: [String!]
    amenities: [String!]
    utilities: [String!]
    petFriendly: Boolean
    furnished: Boolean
    availableFrom: String
    maxDistance: Float
    latitude: Float
    longitude: Float
    sortBy: PropertySortBy
    sortOrder: SortOrder
    page: Int
    limit: Int
  }

  input UnitInput {
    unitNumber: String!
    unitName: String
    description: String
    unitType: UnitType!
    bedrooms: Int!
    bathrooms: Float!
    squareFootage: Int!
    floor: Int
    balcony: Boolean
    patio: Boolean
    privateEntrance: Boolean
    washerDryerInUnit: Boolean
    dishwasher: Boolean
    airConditioning: Boolean
    heating: Boolean
    fireplace: Boolean
    walkInCloset: Boolean
    rentAmount: Float!
    securityDeposit: Float
    petDeposit: Float
    availableDate: String
    features: [String!]
    appliances: [String!]
    utilities: [String!]
    virtualTourUrl: String
    floorPlanUrl: String
    isFeatured: Boolean
  }

  input PropertyImageInput {
    url: String!
    thumbnailUrl: String
    originalFilename: String
    alt: String
    caption: String
    type: ImageType!
    sortOrder: Int
    isPrimary: Boolean
    isPublic: Boolean
    width: Int
    height: Int
    fileSize: Int
    mimeType: String
  }

  input PropertyAmenityInput {
    name: String!
    description: String
    category: AmenityCategory!
    isIncluded: Boolean!
    additionalCost: Float
    iconName: String
    imageUrl: String
    sortOrder: Int
    isHighlight: Boolean
    operatingHours: JSON
    capacity: Int
    ageRestriction: Int
    requiresReservation: Boolean
    requiresDeposit: Boolean
    depositAmount: Float
    maintenanceNotes: String
  }

  enum PropertySortBy {
    CREATED_AT
    UPDATED_AT
    RENT_AMOUNT
    SQUARE_FOOTAGE
    BEDROOMS
    TITLE
    DISTANCE
    POPULARITY
  }

  enum SortOrder {
    ASC
    DESC
  }

  scalar JSON

  type Query {
    # Property queries
    property(id: ID!): Property
    properties(ownerId: ID, page: Int, limit: Int, status: PropertyStatus): PropertySearchResult!
    searchProperties(input: PropertySearchInput!): PropertySearchResult!
    featuredProperties(limit: Int): [Property!]!
    nearbyProperties(latitude: Float!, longitude: Float!, radius: Float!, limit: Int): [Property!]!
    
    # Analytics
    propertyAnalytics(ownerId: ID): PropertyAnalytics!
    
    # Units
    unit(id: ID!): Unit
    units(propertyId: ID!): [Unit!]!
    availableUnits(propertyId: ID): [Unit!]!
    
    # Images
    propertyImages(propertyId: ID!): [PropertyImage!]!
    
    # Amenities
    propertyAmenities(propertyId: ID!): [PropertyAmenity!]!
    commonAmenities: JSON!
  }

  type Mutation {
    # Property mutations
    createProperty(input: PropertyInput!): Property!
    updateProperty(id: ID!, input: PropertyUpdateInput!): Property!
    deleteProperty(id: ID!): Boolean!
    publishProperty(id: ID!): Property!
    unpublishProperty(id: ID!): Property!
    incrementPropertyViews(id: ID!): Property!
    
    # Unit mutations
    addUnit(propertyId: ID!, input: UnitInput!): Unit!
    updateUnit(id: ID!, input: UnitInput!): Unit!
    deleteUnit(id: ID!): Boolean!
    
    # Image mutations
    addPropertyImage(propertyId: ID!, input: PropertyImageInput!): PropertyImage!
    updatePropertyImage(id: ID!, input: PropertyImageInput!): PropertyImage!
    deletePropertyImage(id: ID!): Boolean!
    setPrimaryImage(id: ID!): PropertyImage!
    reorderImages(propertyId: ID!, imageIds: [ID!]!): [PropertyImage!]!
    
    # Amenity mutations
    addPropertyAmenity(propertyId: ID!, input: PropertyAmenityInput!): PropertyAmenity!
    updatePropertyAmenity(id: ID!, input: PropertyAmenityInput!): PropertyAmenity!
    deletePropertyAmenity(id: ID!): Boolean!
    
    # Bulk operations
    bulkUpdatePropertyStatus(propertyIds: [ID!]!, status: PropertyStatus!): [Property!]!
    bulkPublishProperties(propertyIds: [ID!]!): [Property!]!
  }
`;
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { AppDataSource } from '../database/connection';
import { Property, PropertyType, PropertyStatus, ListingStatus } from '../entities/Property';
import { PropertyImage } from '../entities/PropertyImage';
import { PropertyDocument } from '../entities/PropertyDocument';
import { Unit } from '../entities/Unit';
import { PropertyAmenity } from '../entities/PropertyAmenity';

interface PropertySearchInput {
  query?: string;
  location?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  propertyTypes?: PropertyType[];
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSquareFootage?: number;
  maxSquareFootage?: number;
  features?: string[];
  amenities?: string[];
  utilities?: string[];
  petFriendly?: boolean;
  furnished?: boolean;
  availableFrom?: Date;
  maxDistance?: number;
  latitude?: number;
  longitude?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

interface PropertySearchResult {
  properties: Property[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
}

export class PropertyService {
  private static propertyRepository: Repository<Property>;
  private static imageRepository: Repository<PropertyImage>;
  private static documentRepository: Repository<PropertyDocument>;
  private static unitRepository: Repository<Unit>;
  private static amenityRepository: Repository<PropertyAmenity>;

  static initialize() {
    this.propertyRepository = AppDataSource.getRepository(Property);
    this.imageRepository = AppDataSource.getRepository(PropertyImage);
    this.documentRepository = AppDataSource.getRepository(PropertyDocument);
    this.unitRepository = AppDataSource.getRepository(Unit);
    this.amenityRepository = AppDataSource.getRepository(PropertyAmenity);
  }

  // Property CRUD Operations
  static async createProperty(ownerId: string, input: any): Promise<Property> {
    const property = this.propertyRepository.create({
      ...input,
      ownerId,
      slug: this.generateSlug(input.title)
    });

    return await this.propertyRepository.save(property);
  }

  static async getProperty(id: string): Promise<Property | null> {
    return await this.propertyRepository.findOne({
      where: { id, isActive: true },
      relations: ['images', 'documents', 'units', 'amenities']
    });
  }

  static async updateProperty(id: string, input: any): Promise<Property> {
    const property = await this.getProperty(id);
    if (!property) {
      throw new Error('Property not found');
    }

    // Update slug if title changed
    if (input.title && input.title !== property.title) {
      input.slug = this.generateSlug(input.title);
    }

    Object.assign(property, input);
    return await this.propertyRepository.save(property);
  }

  static async deleteProperty(id: string): Promise<boolean> {
    const result = await this.propertyRepository.update(
      { id },
      { isActive: false }
    );
    return result.affected === 1;
  }

  static async publishProperty(id: string): Promise<Property> {
    const property = await this.getProperty(id);
    if (!property) {
      throw new Error('Property not found');
    }

    property.isPublished = true;
    property.status = PropertyStatus.ACTIVE;
    property.listingStatus = ListingStatus.AVAILABLE;

    return await this.propertyRepository.save(property);
  }

  static async unpublishProperty(id: string): Promise<Property> {
    const property = await this.getProperty(id);
    if (!property) {
      throw new Error('Property not found');
    }

    property.isPublished = false;
    property.listingStatus = ListingStatus.OFF_MARKET;

    return await this.propertyRepository.save(property);
  }

  static async incrementViews(id: string): Promise<Property> {
    const property = await this.getProperty(id);
    if (!property) {
      throw new Error('Property not found');
    }

    property.viewCount += 1;
    property.lastViewedAt = new Date();

    return await this.propertyRepository.save(property);
  }

  // Property Search and Filtering
  static async searchProperties(input: PropertySearchInput): Promise<PropertySearchResult> {
    const page = input.page || 1;
    const limit = input.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.images', 'images')
      .leftJoinAndSelect('property.units', 'units')
      .leftJoinAndSelect('property.amenities', 'amenities')
      .where('property.isActive = :isActive', { isActive: true })
      .andWhere('property.isPublished = :isPublished', { isPublished: true });

    // Text search
    if (input.query) {
      queryBuilder = queryBuilder.andWhere(
        '(property.title ILIKE :query OR property.description ILIKE :query OR property.keywords && :keywordArray)',
        { 
          query: `%${input.query}%`,
          keywordArray: [input.query]
        }
      );
    }

    // Location filters
    if (input.city) {
      queryBuilder = queryBuilder.andWhere('property.city ILIKE :city', { city: `%${input.city}%` });
    }
    if (input.state) {
      queryBuilder = queryBuilder.andWhere('property.state ILIKE :state', { state: `%${input.state}%` });
    }
    if (input.zipCode) {
      queryBuilder = queryBuilder.andWhere('property.zipCode = :zipCode', { zipCode: input.zipCode });
    }

    // Property type filter
    if (input.propertyTypes && input.propertyTypes.length > 0) {
      queryBuilder = queryBuilder.andWhere('property.propertyType IN (:...propertyTypes)', { 
        propertyTypes: input.propertyTypes 
      });
    }

    // Price range
    if (input.minRent) {
      queryBuilder = queryBuilder.andWhere('property.rentAmount >= :minRent', { minRent: input.minRent });
    }
    if (input.maxRent) {
      queryBuilder = queryBuilder.andWhere('property.rentAmount <= :maxRent', { maxRent: input.maxRent });
    }

    // Bedroom/Bathroom filters
    if (input.minBedrooms) {
      queryBuilder = queryBuilder.andWhere('property.bedrooms >= :minBedrooms', { minBedrooms: input.minBedrooms });
    }
    if (input.maxBedrooms) {
      queryBuilder = queryBuilder.andWhere('property.bedrooms <= :maxBedrooms', { maxBedrooms: input.maxBedrooms });
    }
    if (input.minBathrooms) {
      queryBuilder = queryBuilder.andWhere('property.bathrooms >= :minBathrooms', { minBathrooms: input.minBathrooms });
    }
    if (input.maxBathrooms) {
      queryBuilder = queryBuilder.andWhere('property.bathrooms <= :maxBathrooms', { maxBathrooms: input.maxBathrooms });
    }

    // Square footage
    if (input.minSquareFootage) {
      queryBuilder = queryBuilder.andWhere('property.squareFootage >= :minSquareFootage', { 
        minSquareFootage: input.minSquareFootage 
      });
    }
    if (input.maxSquareFootage) {
      queryBuilder = queryBuilder.andWhere('property.squareFootage <= :maxSquareFootage', { 
        maxSquareFootage: input.maxSquareFootage 
      });
    }

    // Feature filters
    if (input.features && input.features.length > 0) {
      queryBuilder = queryBuilder.andWhere('property.features && :features', { features: input.features });
    }

    // Boolean filters
    if (input.petFriendly !== undefined) {
      queryBuilder = queryBuilder.andWhere('property.petFriendly = :petFriendly', { petFriendly: input.petFriendly });
    }
    if (input.furnished !== undefined) {
      queryBuilder = queryBuilder.andWhere('property.furnished = :furnished', { furnished: input.furnished });
    }

    // Available date filter
    if (input.availableFrom) {
      queryBuilder = queryBuilder.andWhere(
        '(property.availableDate IS NULL OR property.availableDate <= :availableFrom)',
        { availableFrom: input.availableFrom }
      );
    }

    // Distance-based search (if coordinates provided)
    if (input.latitude && input.longitude && input.maxDistance) {
      queryBuilder = queryBuilder.andWhere(
        'ST_DWithin(ST_Point(property.longitude, property.latitude)::geography, ST_Point(:longitude, :latitude)::geography, :maxDistance)',
        {
          latitude: input.latitude,
          longitude: input.longitude,
          maxDistance: input.maxDistance * 1000 // Convert km to meters
        }
      );
    }

    // Sorting
    const sortBy = input.sortBy || 'createdAt';
    const sortOrder = input.sortOrder || 'DESC';
    
    if (sortBy === 'distance' && input.latitude && input.longitude) {
      queryBuilder = queryBuilder.orderBy(
        'ST_Distance(ST_Point(property.longitude, property.latitude)::geography, ST_Point(:longitude, :latitude)::geography)',
        sortOrder
      );
    } else {
      queryBuilder = queryBuilder.orderBy(`property.${sortBy}`, sortOrder);
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const properties = await queryBuilder
      .skip(offset)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      properties,
      total,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      totalPages
    };
  }

  static async getPropertiesByOwner(ownerId: string, page = 1, limit = 20): Promise<PropertySearchResult> {
    const offset = (page - 1) * limit;

    const [properties, total] = await this.propertyRepository.findAndCount({
      where: { ownerId, isActive: true },
      relations: ['images', 'units', 'amenities'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit
    });

    const totalPages = Math.ceil(total / limit);

    return {
      properties,
      total,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      totalPages
    };
  }

  static async getFeaturedProperties(limit = 10): Promise<Property[]> {
    return await this.propertyRepository.find({
      where: { 
        isFeatured: true, 
        isActive: true, 
        isPublished: true,
        status: PropertyStatus.ACTIVE
      },
      relations: ['images'],
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  static async getNearbyProperties(
    latitude: number, 
    longitude: number, 
    radiusKm = 10, 
    limit = 20
  ): Promise<Property[]> {
    return await this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.images', 'images')
      .where('property.isActive = :isActive', { isActive: true })
      .andWhere('property.isPublished = :isPublished', { isPublished: true })
      .andWhere('property.latitude IS NOT NULL AND property.longitude IS NOT NULL')
      .andWhere(
        'ST_DWithin(ST_Point(property.longitude, property.latitude)::geography, ST_Point(:longitude, :latitude)::geography, :radius)',
        {
          latitude,
          longitude,
          radius: radiusKm * 1000
        }
      )
      .orderBy(
        'ST_Distance(ST_Point(property.longitude, property.latitude)::geography, ST_Point(:longitude, :latitude)::geography)'
      )
      .setParameters({ latitude, longitude })
      .take(limit)
      .getMany();
  }

  // Analytics
  static async getPropertyAnalytics(ownerId?: string) {
    let queryBuilder = this.propertyRepository.createQueryBuilder('property');
    
    if (ownerId) {
      queryBuilder = queryBuilder.where('property.ownerId = :ownerId', { ownerId });
    }

    const totalProperties = await queryBuilder.getCount();
    
    const activeProperties = await queryBuilder
      .andWhere('property.status = :status', { status: PropertyStatus.ACTIVE })
      .getCount();

    const availableProperties = await queryBuilder
      .andWhere('property.listingStatus = :listingStatus', { listingStatus: ListingStatus.AVAILABLE })
      .getCount();

    const occupiedProperties = await queryBuilder
      .andWhere('property.listingStatus = :listingStatus', { listingStatus: ListingStatus.RENTED })
      .getCount();

    // Calculate averages
    const properties = await this.propertyRepository.find({
      where: ownerId ? { ownerId, isActive: true } : { isActive: true }
    });

    const averageRent = properties.length > 0 
      ? properties.reduce((sum, p) => sum + p.rentAmount, 0) / properties.length 
      : 0;

    const totalRentRevenue = properties.reduce((sum, p) => sum + p.rentAmount, 0);

    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;

    const propertiesWithValue = properties.filter(p => p.propertyValue && p.propertyValue > 0);
    const averageCapRate = propertiesWithValue.length > 0
      ? propertiesWithValue.reduce((sum, p) => sum + p.capRate, 0) / propertiesWithValue.length
      : 0;

    return {
      totalProperties,
      activeProperties,
      availableProperties,
      occupiedProperties,
      averageRent,
      totalRentRevenue,
      occupancyRate,
      averageCapRate,
      propertiesByType: await this.getPropertiesByType(ownerId),
      propertiesByStatus: await this.getPropertiesByStatus(ownerId),
      monthlyRevenueGrowth: 0 // TODO: Calculate based on historical data
    };
  }

  private static async getPropertiesByType(ownerId?: string) {
    let queryBuilder = this.propertyRepository
      .createQueryBuilder('property')
      .select('property.propertyType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('property.isActive = :isActive', { isActive: true })
      .groupBy('property.propertyType');

    if (ownerId) {
      queryBuilder = queryBuilder.andWhere('property.ownerId = :ownerId', { ownerId });
    }

    return await queryBuilder.getRawMany();
  }

  private static async getPropertiesByStatus(ownerId?: string) {
    let queryBuilder = this.propertyRepository
      .createQueryBuilder('property')
      .select('property.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('property.isActive = :isActive', { isActive: true })
      .groupBy('property.status');

    if (ownerId) {
      queryBuilder = queryBuilder.andWhere('property.ownerId = :ownerId', { ownerId });
    }

    return await queryBuilder.getRawMany();
  }

  // Bulk operations
  static async bulkUpdateStatus(propertyIds: string[], status: PropertyStatus): Promise<Property[]> {
    await this.propertyRepository.update(
      { id: In(propertyIds) },
      { status }
    );

    return await this.propertyRepository.find({
      where: { id: In(propertyIds) }
    });
  }

  static async bulkPublish(propertyIds: string[]): Promise<Property[]> {
    await this.propertyRepository.update(
      { id: In(propertyIds) },
      { 
        isPublished: true,
        status: PropertyStatus.ACTIVE,
        listingStatus: ListingStatus.AVAILABLE
      }
    );

    return await this.propertyRepository.find({
      where: { id: In(propertyIds) }
    });
  }

  // Utility methods
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Image operations
  static async addImage(propertyId: string, imageData: any): Promise<PropertyImage> {
    const image = this.imageRepository.create({
      ...imageData,
      propertyId
    });

    return await this.imageRepository.save(image);
  }

  static async getImages(propertyId: string): Promise<PropertyImage[]> {
    return await this.imageRepository.find({
      where: { propertyId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    });
  }

  static async deleteImage(imageId: string): Promise<boolean> {
    const result = await this.imageRepository.delete({ id: imageId });
    return result.affected === 1;
  }

  // Unit operations
  static async addUnit(propertyId: string, unitData: any): Promise<Unit> {
    const unit = this.unitRepository.create({
      ...unitData,
      propertyId
    });

    return await this.unitRepository.save(unit);
  }

  static async getUnits(propertyId: string): Promise<Unit[]> {
    return await this.unitRepository.find({
      where: { propertyId, isActive: true },
      order: { unitNumber: 'ASC' }
    });
  }

  static async getAvailableUnits(propertyId?: string): Promise<Unit[]> {
    const where: any = { 
      status: 'AVAILABLE',
      isActive: true 
    };
    
    if (propertyId) {
      where.propertyId = propertyId;
    }

    return await this.unitRepository.find({
      where,
      order: { rentAmount: 'ASC' }
    });
  }

  // Amenity operations
  static async addAmenity(propertyId: string, amenityData: any): Promise<PropertyAmenity> {
    const amenity = this.amenityRepository.create({
      ...amenityData,
      propertyId
    });

    return await this.amenityRepository.save(amenity);
  }

  static async getAmenities(propertyId: string): Promise<PropertyAmenity[]> {
    return await this.amenityRepository.find({
      where: { propertyId, isActive: true },
      order: { category: 'ASC', sortOrder: 'ASC' }
    });
  }
}
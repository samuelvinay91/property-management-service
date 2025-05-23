import { Test, TestingModule } from '@nestjs/testing';
import { PropertyService } from '../../src/services/PropertyService';
import { Repository } from 'typeorm';
import { Property } from '../../src/entities/Property';
import { PropertyImage } from '../../src/entities/PropertyImage';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('PropertyService', () => {
  let service: PropertyService;
  let propertyRepository: jest.Mocked<Repository<Property>>;
  let imageRepository: jest.Mocked<Repository<PropertyImage>>;

  const mockProperty = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    ownerId: '456e7890-e89b-12d3-a456-426614174000',
    title: 'Modern Downtown Apartment',
    description: 'Beautiful apartment in the heart of downtown',
    type: 'APARTMENT',
    status: 'AVAILABLE',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1200,
    rentAmount: 3500,
    securityDeposit: 3500,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Property;

  beforeEach(async () => {
    const mockPropertyRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn(),
        getManyAndCount: jest.fn(),
      })),
    };

    const mockImageRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: getRepositoryToken(Property),
          useValue: mockPropertyRepository,
        },
        {
          provide: getRepositoryToken(PropertyImage),
          useValue: mockImageRepository,
        },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    propertyRepository = module.get(getRepositoryToken(Property));
    imageRepository = module.get(getRepositoryToken(PropertyImage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProperty', () => {
    it('should create a property successfully', async () => {
      const createPropertyData = {
        ownerId: '456e7890-e89b-12d3-a456-426614174000',
        title: 'Test Property',
        description: 'Test description',
        type: 'APARTMENT' as const,
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        bedrooms: 2,
        bathrooms: 2,
        squareFootage: 1000,
        rentAmount: 2500,
      };

      propertyRepository.create.mockReturnValue(mockProperty);
      propertyRepository.save.mockResolvedValue(mockProperty);

      const result = await service.createProperty(createPropertyData);

      expect(propertyRepository.create).toHaveBeenCalledWith(createPropertyData);
      expect(propertyRepository.save).toHaveBeenCalledWith(mockProperty);
      expect(result).toEqual(mockProperty);
    });

    it('should throw error for invalid property type', async () => {
      const createPropertyData = {
        ownerId: '456e7890-e89b-12d3-a456-426614174000',
        title: 'Test Property',
        type: 'INVALID_TYPE' as any,
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
      };

      await expect(service.createProperty(createPropertyData)).rejects.toThrow();
    });
  });

  describe('searchProperties', () => {
    it('should search properties with filters', async () => {
      const searchParams = {
        city: 'San Francisco',
        minPrice: 2000,
        maxPrice: 5000,
        bedrooms: 2,
        propertyType: 'APARTMENT',
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProperty], 1]),
      };

      propertyRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchProperties(searchParams);

      expect(queryBuilder.where).toHaveBeenCalled();
      expect(queryBuilder.andWhere).toHaveBeenCalled();
      expect(result.properties).toEqual([mockProperty]);
      expect(result.total).toBe(1);
    });

    it('should return empty result when no properties match', async () => {
      const searchParams = {
        city: 'Nonexistent City',
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      propertyRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.searchProperties(searchParams);

      expect(result.properties).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('updateProperty', () => {
    it('should update property successfully', async () => {
      const propertyId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { title: 'Updated Title' };
      const updatedProperty = { ...mockProperty, title: 'Updated Title' };

      propertyRepository.findOne.mockResolvedValue(mockProperty);
      propertyRepository.save.mockResolvedValue(updatedProperty);

      const result = await service.updateProperty(propertyId, updateData);

      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(propertyRepository.save).toHaveBeenCalledWith({
        ...mockProperty,
        ...updateData,
      });
      expect(result).toEqual(updatedProperty);
    });

    it('should throw error if property not found', async () => {
      const propertyId = 'nonexistent-id';
      const updateData = { title: 'Updated Title' };

      propertyRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProperty(propertyId, updateData)).rejects.toThrow(
        'Property not found'
      );
    });
  });

  describe('deleteProperty', () => {
    it('should soft delete property successfully', async () => {
      const propertyId = '123e4567-e89b-12d3-a456-426614174000';
      const archivedProperty = { ...mockProperty, status: 'ARCHIVED' };

      propertyRepository.findOne.mockResolvedValue(mockProperty);
      propertyRepository.save.mockResolvedValue(archivedProperty);

      await service.deleteProperty(propertyId);

      expect(propertyRepository.findOne).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(propertyRepository.save).toHaveBeenCalledWith({
        ...mockProperty,
        status: 'ARCHIVED',
      });
    });

    it('should throw error if property not found', async () => {
      const propertyId = 'nonexistent-id';
      propertyRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteProperty(propertyId)).rejects.toThrow(
        'Property not found'
      );
    });
  });

  describe('getPropertyById', () => {
    it('should return property with images', async () => {
      const propertyId = '123e4567-e89b-12d3-a456-426614174000';

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockProperty),
      };

      propertyRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getPropertyById(propertyId);

      expect(queryBuilder.where).toHaveBeenCalledWith('property.id = :id', { id: propertyId });
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('property.images', 'images');
      expect(result).toEqual(mockProperty);
    });

    it('should return null if property not found', async () => {
      const propertyId = 'nonexistent-id';

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      propertyRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getPropertyById(propertyId);

      expect(result).toBeNull();
    });
  });

  describe('getPropertiesByOwner', () => {
    it('should return properties for owner', async () => {
      const ownerId = '456e7890-e89b-12d3-a456-426614174000';
      propertyRepository.find.mockResolvedValue([mockProperty]);

      const result = await service.getPropertiesByOwner(ownerId);

      expect(propertyRepository.find).toHaveBeenCalledWith({
        where: { ownerId, status: expect.not.stringMatching('ARCHIVED') },
        relations: ['images', 'amenities'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockProperty]);
    });
  });
});
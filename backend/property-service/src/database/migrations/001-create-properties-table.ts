import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreatePropertiesTable001 implements MigrationInterface {
  name = 'CreatePropertiesTable001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'properties',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ownerId',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO', 'DUPLEX', 'TRIPLEX', 'FOURPLEX'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'DRAFT', 'ARCHIVED'],
            default: "'DRAFT'",
          },
          {
            name: 'address',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'state',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'zipCode',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'country',
            type: 'varchar',
            length: '50',
            default: "'US'",
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'bedrooms',
            type: 'integer',
            default: 0,
          },
          {
            name: 'bathrooms',
            type: 'decimal',
            precision: 3,
            scale: 1,
            default: 0,
          },
          {
            name: 'squareFootage',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'lotSize',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'yearBuilt',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'parkingSpaces',
            type: 'integer',
            default: 0,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'rentAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'securityDeposit',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'applicationFee',
            type: 'decimal',
            precision: 8,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'petDeposit',
            type: 'decimal',
            precision: 8,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'petPolicy',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'leaseTerm',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'availableFrom',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'propertyTax',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'hoaFees',
            type: 'decimal',
            precision: 8,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'insurance',
            type: 'decimal',
            precision: 8,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'utilities',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'features',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'virtualTourUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'videoUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'featured',
            type: 'boolean',
            default: false,
          },
          {
            name: 'verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'views',
            type: 'integer',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'properties',
      new Index('IDX_PROPERTY_OWNER', ['ownerId']),
    );

    await queryRunner.createIndex(
      'properties',
      new Index('IDX_PROPERTY_STATUS', ['status']),
    );

    await queryRunner.createIndex(
      'properties',
      new Index('IDX_PROPERTY_TYPE', ['type']),
    );

    await queryRunner.createIndex(
      'properties',
      new Index('IDX_PROPERTY_LOCATION', ['city', 'state']),
    );

    await queryRunner.createIndex(
      'properties',
      new Index('IDX_PROPERTY_COORDINATES', ['latitude', 'longitude']),
    );

    await queryRunner.createIndex(
      'properties',
      new Index('IDX_PROPERTY_PRICE', ['rentAmount']),
    );

    await queryRunner.createIndex(
      'properties',
      new Index('IDX_PROPERTY_BEDROOMS', ['bedrooms']),
    );

    await queryRunner.createIndex(
      'properties',
      new Index('IDX_PROPERTY_FEATURED', ['featured']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('properties');
  }
}
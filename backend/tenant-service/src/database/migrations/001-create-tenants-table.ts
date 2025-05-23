import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateTenantsTable001 implements MigrationInterface {
  name = 'CreateTenantsTable001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'ssn',
            type: 'varchar',
            length: '11',
            isNullable: true,
          },
          {
            name: 'driversLicense',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'currentAddress',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'employmentInfo',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'monthlyIncome',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'creditScore',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'backgroundCheckStatus',
            type: 'enum',
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
            default: "'PENDING'",
          },
          {
            name: 'backgroundCheckDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'references',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'pets',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED'],
            default: "'ACTIVE'",
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
      'tenants',
      new Index('IDX_TENANT_USER', ['userId']),
    );

    await queryRunner.createIndex(
      'tenants',
      new Index('IDX_TENANT_EMAIL', ['email']),
    );

    await queryRunner.createIndex(
      'tenants',
      new Index('IDX_TENANT_STATUS', ['status']),
    );

    await queryRunner.createIndex(
      'tenants',
      new Index('IDX_TENANT_BACKGROUND_CHECK', ['backgroundCheckStatus']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tenants');
  }
}
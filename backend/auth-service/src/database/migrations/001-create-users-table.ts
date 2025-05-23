import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateUsersTable001 implements MigrationInterface {
  name = 'CreateUsersTable001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
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
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['ADMIN', 'PROPERTY_OWNER', 'PROPERTY_MANAGER', 'TENANT', 'MAINTENANCE', 'VENDOR'],
            default: "'TENANT'",
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isEmailVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isPhoneVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'twoFactorEnabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'twoFactorSecret',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'lastLoginAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'profilePicture',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            isNullable: true,
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
      'users',
      new Index('IDX_USER_EMAIL', ['email']),
    );

    await queryRunner.createIndex(
      'users',
      new Index('IDX_USER_PHONE', ['phone']),
    );

    await queryRunner.createIndex(
      'users',
      new Index('IDX_USER_ROLE', ['role']),
    );

    await queryRunner.createIndex(
      'users',
      new Index('IDX_USER_ACTIVE', ['isActive']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
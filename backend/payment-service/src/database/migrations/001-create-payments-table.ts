import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreatePaymentsTable001 implements MigrationInterface {
  name = 'CreatePaymentsTable001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
          },
          {
            name: 'propertyId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'leaseId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['RENT', 'SECURITY_DEPOSIT', 'PET_DEPOSIT', 'APPLICATION_FEE', 'LATE_FEE', 'MAINTENANCE_FEE', 'UTILITY', 'OTHER'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'],
            default: "'PENDING'",
          },
          {
            name: 'paymentMethodId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'stripePaymentIntentId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stripeChargeId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'processingFee',
            type: 'decimal',
            precision: 8,
            scale: 2,
            default: 0,
          },
          {
            name: 'netAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'dueDate',
            type: 'date',
          },
          {
            name: 'paidAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'failureReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'receiptUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'isRecurring',
            type: 'boolean',
            default: false,
          },
          {
            name: 'recurringPeriod',
            type: 'enum',
            enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
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
      'payments',
      new Index('IDX_PAYMENT_TENANT', ['tenantId']),
    );

    await queryRunner.createIndex(
      'payments',
      new Index('IDX_PAYMENT_PROPERTY', ['propertyId']),
    );

    await queryRunner.createIndex(
      'payments',
      new Index('IDX_PAYMENT_STATUS', ['status']),
    );

    await queryRunner.createIndex(
      'payments',
      new Index('IDX_PAYMENT_TYPE', ['type']),
    );

    await queryRunner.createIndex(
      'payments',
      new Index('IDX_PAYMENT_DUE_DATE', ['dueDate']),
    );

    await queryRunner.createIndex(
      'payments',
      new Index('IDX_PAYMENT_STRIPE_INTENT', ['stripePaymentIntentId']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payments');
  }
}
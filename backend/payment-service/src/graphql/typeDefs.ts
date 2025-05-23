import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  enum PaymentStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
    REFUNDED
    PARTIALLY_REFUNDED
    DISPUTED
  }

  enum PaymentType {
    RENT
    SECURITY_DEPOSIT
    APPLICATION_FEE
    PET_DEPOSIT
    LATE_FEE
    MAINTENANCE_FEE
    UTILITY_BILL
    PARKING_FEE
    AMENITY_FEE
    OTHER
  }

  enum PaymentFrequency {
    ONE_TIME
    DAILY
    WEEKLY
    MONTHLY
    QUARTERLY
    ANNUALLY
  }

  enum PaymentMethodType {
    CREDIT_CARD
    DEBIT_CARD
    BANK_ACCOUNT
    DIGITAL_WALLET
    ACH
  }

  enum PaymentMethodStatus {
    ACTIVE
    INACTIVE
    EXPIRED
    FAILED_VERIFICATION
  }

  enum RefundStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  enum RefundReason {
    DUPLICATE_CHARGE
    FRAUDULENT
    REQUESTED_BY_CUSTOMER
    SUBSCRIPTION_CANCELLATION
    OVERPAYMENT
    OTHER
  }

  type Payment {
    id: ID!
    tenantId: String!
    propertyId: String!
    unitId: String
    leaseId: String
    type: PaymentType!
    status: PaymentStatus!
    frequency: PaymentFrequency!
    amount: Float!
    paidAmount: Float!
    refundedAmount: Float!
    feeAmount: Float!
    lateFeeAmount: Float!
    dueDate: String!
    paidDate: String
    scheduledDate: String
    paymentMethod: PaymentMethod
    stripePaymentIntentId: String
    stripeChargeId: String
    description: String
    notes: String
    receiptNumber: String
    receiptUrl: String
    isRecurring: Boolean!
    isAutoPay: Boolean!
    retryCount: Int!
    totalAmount: Float!
    remainingAmount: Float!
    isOverdue: Boolean!
    daysPastDue: Int!
    isPartiallyPaid: Boolean!
    isFullyPaid: Boolean!
    paymentProgress: Float!
    daysUntilDue: Int!
    isDueSoon: Boolean!
    canRetry: Boolean!
    formattedAmount: String!
    refunds: [Refund!]!
    createdAt: String!
    updatedAt: String!
  }

  type PaymentMethod {
    id: ID!
    userId: String!
    type: PaymentMethodType!
    status: PaymentMethodStatus!
    nickname: String!
    last4: String
    brand: String
    expiryMonth: Int
    expiryYear: Int
    bankName: String
    accountType: String
    isDefault: Boolean!
    isVerified: Boolean!
    lastUsedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type Refund {
    id: ID!
    payment: Payment!
    status: RefundStatus!
    reason: RefundReason!
    amount: Float!
    currency: String!
    stripeRefundId: String
    description: String
    processedAt: String
    failureReason: String
    createdAt: String!
    updatedAt: String!
  }

  input CreatePaymentInput {
    tenantId: String!
    propertyId: String!
    unitId: String
    leaseId: String
    type: PaymentType!
    amount: Float!
    dueDate: String!
    description: String
    paymentMethodId: String
    isRecurring: Boolean
    frequency: PaymentFrequency
  }

  input ProcessPaymentInput {
    paymentId: String!
    paymentMethodId: String
    amount: Float
  }

  input CreatePaymentMethodInput {
    userId: String!
    type: PaymentMethodType!
    nickname: String!
    stripePaymentMethodId: String
  }

  input CreateRefundInput {
    paymentId: String!
    amount: Float!
    reason: RefundReason!
    description: String
  }

  type Query {
    payment(id: ID!): Payment
    payments(
      tenantId: String
      propertyId: String
      status: PaymentStatus
      limit: Int = 50
      offset: Int = 0
    ): [Payment!]!
    overduePayments: [Payment!]!
    paymentMethod(id: ID!): PaymentMethod
    paymentMethods(userId: String!): [PaymentMethod!]!
    refund(id: ID!): Refund
    refunds(paymentId: String!): [Refund!]!
  }

  type Mutation {
    createPayment(input: CreatePaymentInput!): Payment!
    processPayment(input: ProcessPaymentInput!): Payment!
    cancelPayment(id: ID!): Payment!
    retryPayment(id: ID!): Payment!
    createPaymentMethod(input: CreatePaymentMethodInput!): PaymentMethod!
    updatePaymentMethod(id: ID!, nickname: String, isDefault: Boolean): PaymentMethod!
    deletePaymentMethod(id: ID!): Boolean!
    createRefund(input: CreateRefundInput!): Refund!
    calculateLateFees: Boolean!
  }
`;
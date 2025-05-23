import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  type User @key(fields: "id") {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    role: UserRole!
    avatar: String
    phoneNumber: String
    isEmailVerified: Boolean!
    isPhoneVerified: Boolean!
    isTwoFactorEnabled: Boolean!
    lastLoginAt: String
    createdAt: String!
    updatedAt: String!
  }

  enum UserRole {
    SUPER_ADMIN
    PROPERTY_MANAGER
    LANDLORD
    TENANT
    MAINTENANCE_STAFF
    AGENT
  }

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
    expiresIn: Int!
  }

  type TwoFactorSetup {
    secret: String!
    qrCodeUrl: String!
    backupCodes: [String!]!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phoneNumber: String
    role: UserRole = TENANT
  }

  input LoginInput {
    email: String!
    password: String!
    twoFactorCode: String
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    phoneNumber: String
    avatar: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  input VerifyEmailInput {
    token: String!
  }

  input VerifyPhoneInput {
    code: String!
  }

  input EnableTwoFactorInput {
    code: String!
    secret: String!
  }

  input RefreshTokenInput {
    refreshToken: String!
  }

  type Query {
    me: User
    verifyToken(token: String!): User
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
    refreshToken(input: RefreshTokenInput!): AuthPayload!
    
    updateProfile(input: UpdateProfileInput!): User!
    changePassword(input: ChangePasswordInput!): Boolean!
    
    forgotPassword(input: ForgotPasswordInput!): Boolean!
    resetPassword(input: ResetPasswordInput!): Boolean!
    
    sendEmailVerification: Boolean!
    verifyEmail(input: VerifyEmailInput!): Boolean!
    
    sendPhoneVerification: Boolean!
    verifyPhone(input: VerifyPhoneInput!): Boolean!
    
    setupTwoFactor: TwoFactorSetup!
    enableTwoFactor(input: EnableTwoFactorInput!): Boolean!
    disableTwoFactor(code: String!): Boolean!
    generateBackupCodes: [String!]!
    
    deleteAccount(password: String!): Boolean!
  }
`;
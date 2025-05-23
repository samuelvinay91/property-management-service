import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.3", import: ["@key", "@shareable", "@external", "@provides", "@requires"])

  type User @key(fields: "id") {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    role: UserRole!
    status: UserStatus!
    avatar: String
    phoneNumber: String
    isEmailVerified: Boolean!
    isPhoneVerified: Boolean!
    isTwoFactorEnabled: Boolean!
    lastLoginAt: String
    createdAt: String!
    updatedAt: String!
    
    # Security fields
    loginAttempts: Int
    lockedUntil: String
    
    # Preferences
    timezone: String
    language: String
    notifications: UserNotificationPreferences
  }

  type UserNotificationPreferences {
    email: Boolean!
    sms: Boolean!
    push: Boolean!
    marketing: Boolean!
  }

  enum UserRole {
    SUPER_ADMIN
    PROPERTY_MANAGER
    LANDLORD
    TENANT
    MAINTENANCE_STAFF
    AGENT
  }

  enum UserStatus {
    ACTIVE
    INACTIVE
    PENDING_VERIFICATION
    SUSPENDED
    DELETED
  }

  enum AuthProvider {
    LOCAL
    GOOGLE
    FACEBOOK
    APPLE
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
    timezone: String
    language: String
  }

  input UpdateNotificationPreferencesInput {
    email: Boolean
    sms: Boolean
    push: Boolean
    marketing: Boolean
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
    # Current user
    me: User
    
    # User management (admin only)
    users(
      limit: Int = 20
      offset: Int = 0
      role: UserRole
      status: UserStatus
      search: String
    ): [User!]!
    
    user(id: ID!): User
    
    # Verify tokens
    verifyToken(token: String!): User
    
    # OAuth URLs
    getGoogleAuthUrl: String!
  }

  type Mutation {
    # Authentication
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
    logoutAll: Boolean!
    refreshToken(input: RefreshTokenInput!): AuthPayload!
    
    # Profile management
    updateProfile(input: UpdateProfileInput!): User!
    changePassword(input: ChangePasswordInput!): Boolean!
    deleteAccount(password: String!): Boolean!
    
    # Password recovery
    forgotPassword(input: ForgotPasswordInput!): Boolean!
    resetPassword(input: ResetPasswordInput!): Boolean!
    
    # Email verification
    sendEmailVerification: Boolean!
    verifyEmail(input: VerifyEmailInput!): Boolean!
    
    # Phone verification
    sendPhoneVerification: Boolean!
    verifyPhone(input: VerifyPhoneInput!): Boolean!
    
    # Two-factor authentication
    setupTwoFactor: TwoFactorSetup!
    enableTwoFactor(input: EnableTwoFactorInput!): Boolean!
    disableTwoFactor(code: String!): Boolean!
    generateBackupCodes: [String!]!
    
    # Notification preferences
    updateNotificationPreferences(input: UpdateNotificationPreferencesInput!): User!
    
    # OAuth
    googleAuth(code: String!): AuthPayload!
    
    # Admin operations
    createUser(input: RegisterInput!): User!
    updateUserRole(userId: ID!, role: UserRole!): User!
    updateUserStatus(userId: ID!, status: UserStatus!): User!
    deleteUser(userId: ID!): Boolean!
    unlockUser(userId: ID!): Boolean!
    resetUserPassword(userId: ID!, newPassword: String!): Boolean!
  }

  type Subscription {
    userStatusChanged(userId: ID!): User!
    securityAlert: SecurityAlert!
  }

  type SecurityAlert {
    id: ID!
    userId: ID!
    type: SecurityAlertType!
    message: String!
    metadata: String
    createdAt: String!
  }

  enum SecurityAlertType {
    LOGIN_ATTEMPT
    PASSWORD_CHANGE
    ACCOUNT_LOCKED
    TWO_FACTOR_DISABLED
    SUSPICIOUS_ACTIVITY
  }
`;
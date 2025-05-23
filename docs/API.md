# 📖 API Documentation

PropFlow uses a GraphQL-first API architecture with a federated gateway pattern. This document covers the available APIs, authentication, and usage examples.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [GraphQL API](#graphql-api)
- [REST Endpoints](#rest-endpoints)
- [WebSocket Events](#websocket-events)
- [AI Services API](#ai-services-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## 🔍 Overview

### API Architecture

PropFlow uses a microservices architecture with:
- **GraphQL Gateway**: Single entry point at `http://localhost:4000/graphql`
- **Individual Services**: Each domain has its own service
- **Real-time Updates**: WebSocket support for live updates
- **AI Services**: Separate Python API for AI/ML features

### Base URLs

| Environment | GraphQL Gateway | AI Services |
|-------------|----------------|-------------|
| Development | `http://localhost:4000/graphql` | `http://localhost:8000` |
| Staging | `https://api-staging.propflow.com/graphql` | `https://ai-staging.propflow.com` |
| Production | `https://api.propflow.com/graphql` | `https://ai.propflow.com` |

## 🔐 Authentication

### JWT Token Authentication

PropFlow uses JWT tokens for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    refreshToken
    user {
      id
      email
      role
    }
  }
}
```

### Refreshing Tokens

```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    token
    refreshToken
  }
}
```

### User Roles

- **ADMIN**: Full system access
- **PROPERTY_OWNER**: Manage owned properties
- **PROPERTY_MANAGER**: Manage assigned properties
- **TENANT**: Access to leased properties

## 🔗 GraphQL API

### Schema Overview

The GraphQL schema is federated across multiple services:

```graphql
type Query {
  # Auth Service
  me: User
  
  # Property Service
  properties(filter: PropertyFilter): [Property!]!
  property(id: ID!): Property
  
  # Tenant Service
  tenants(filter: TenantFilter): [Tenant!]!
  tenant(id: ID!): Tenant
  
  # Payment Service
  payments(filter: PaymentFilter): [Payment!]!
  
  # Maintenance Service
  maintenanceRequests(filter: MaintenanceFilter): [MaintenanceRequest!]!
  
  # Booking Service
  bookings(filter: BookingFilter): [Booking!]!
}

type Mutation {
  # Auth
  login(input: LoginInput!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!
  logout: Boolean!
  
  # Properties
  createProperty(input: CreatePropertyInput!): Property!
  updateProperty(id: ID!, input: UpdatePropertyInput!): Property!
  deleteProperty(id: ID!): Boolean!
  
  # Tenants
  createTenant(input: CreateTenantInput!): Tenant!
  updateTenant(id: ID!, input: UpdateTenantInput!): Tenant!
  
  # Payments
  createPayment(input: CreatePaymentInput!): Payment!
  processPayment(id: ID!): PaymentResult!
  
  # Maintenance
  createMaintenanceRequest(input: CreateMaintenanceRequestInput!): MaintenanceRequest!
  updateMaintenanceRequest(id: ID!, input: UpdateMaintenanceRequestInput!): MaintenanceRequest!
  
  # Bookings
  createBooking(input: CreateBookingInput!): Booking!
  cancelBooking(id: ID!): Boolean!
}

type Subscription {
  # Real-time updates
  propertyUpdated(propertyId: ID!): Property!
  paymentStatusChanged(tenantId: ID!): Payment!
  maintenanceRequestUpdated(propertyId: ID!): MaintenanceRequest!
  messageReceived(chatId: ID!): Message!
}
```

### Core Types

#### User

```graphql
type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  role: UserRole!
  isEmailVerified: Boolean!
  isPhoneVerified: Boolean!
  profile: UserProfile
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum UserRole {
  ADMIN
  PROPERTY_OWNER
  PROPERTY_MANAGER
  TENANT
}
```

#### Property

```graphql
type Property {
  id: ID!
  name: String!
  description: String
  address: Address!
  type: PropertyType!
  status: PropertyStatus!
  units: [Unit!]!
  amenities: [Amenity!]!
  images: [PropertyImage!]!
  documents: [PropertyDocument!]!
  owner: User!
  manager: User
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum PropertyType {
  APARTMENT
  HOUSE
  CONDO
  TOWNHOUSE
  COMMERCIAL
  OFFICE
}

enum PropertyStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  SOLD
}
```

#### Lease

```graphql
type Lease {
  id: ID!
  property: Property!
  unit: Unit!
  tenant: User!
  startDate: Date!
  endDate: Date!
  monthlyRent: Float!
  securityDeposit: Float!
  status: LeaseStatus!
  terms: String
  documents: [LeaseDocument!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum LeaseStatus {
  DRAFT
  ACTIVE
  EXPIRED
  TERMINATED
  RENEWED
}
```

### Query Examples

#### Get Properties

```graphql
query GetProperties($filter: PropertyFilter) {
  properties(filter: $filter) {
    id
    name
    address {
      street
      city
      state
      zipCode
    }
    type
    status
    units {
      id
      unitNumber
      rent
      isOccupied
    }
    owner {
      id
      firstName
      lastName
      email
    }
  }
}
```

#### Get Property Details

```graphql
query GetProperty($id: ID!) {
  property(id: $id) {
    id
    name
    description
    address {
      street
      city
      state
      zipCode
      coordinates {
        latitude
        longitude
      }
    }
    type
    status
    units {
      id
      unitNumber
      bedrooms
      bathrooms
      squareFeet
      rent
      isOccupied
      tenant {
        id
        firstName
        lastName
        email
      }
    }
    amenities {
      id
      name
      description
    }
    images {
      id
      url
      caption
      isPrimary
    }
    maintenanceRequests {
      id
      title
      status
      priority
      createdAt
    }
  }
}
```

### Mutation Examples

#### Create Property

```graphql
mutation CreateProperty($input: CreatePropertyInput!) {
  createProperty(input: $input) {
    id
    name
    address {
      street
      city
      state
      zipCode
    }
    type
    status
  }
}
```

Variables:
```json
{
  "input": {
    "name": "Sunset Apartments",
    "description": "Modern apartment complex with great amenities",
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105"
    },
    "type": "APARTMENT",
    "units": [
      {
        "unitNumber": "101",
        "bedrooms": 2,
        "bathrooms": 2,
        "squareFeet": 1200,
        "rent": 3500
      }
    ]
  }
}
```

#### Process Payment

```graphql
mutation ProcessPayment($input: ProcessPaymentInput!) {
  processPayment(input: $input) {
    id
    amount
    status
    transactionId
    paymentMethod {
      type
      last4
    }
  }
}
```

## 🔌 REST Endpoints

Some functionality is exposed via REST endpoints for external integrations:

### Health Checks

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ai": "healthy"
  }
}
```

### File Uploads

```http
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <binary>
type: "property_image" | "document" | "avatar"
```

### Webhooks

#### Stripe Webhook

```http
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: <signature>

{
  "id": "evt_1...",
  "type": "payment_intent.succeeded",
  "data": { ... }
}
```

## 🔄 WebSocket Events

PropFlow supports real-time updates via WebSocket connections at `/graphql` with subscription support.

### Connection Setup

```javascript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: {
    authorization: `Bearer ${token}`,
  },
});
```

### Subscription Examples

#### Property Updates

```graphql
subscription PropertyUpdated($propertyId: ID!) {
  propertyUpdated(propertyId: $propertyId) {
    id
    name
    status
    units {
      id
      isOccupied
      tenant {
        id
        firstName
        lastName
      }
    }
  }
}
```

#### Chat Messages

```graphql
subscription MessageReceived($chatId: ID!) {
  messageReceived(chatId: $chatId) {
    id
    content
    sender {
      id
      firstName
      lastName
    }
    timestamp
  }
}
```

## 🤖 AI Services API

The AI services provide machine learning and natural language processing capabilities.

### Base URL
- Development: `http://localhost:8000`
- Production: `https://ai.propflow.com`

### Authentication
Use the same JWT token in the Authorization header.

### Endpoints

#### Chatbot

```http
POST /api/v1/chat/message
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "What properties are available in San Francisco?",
  "context": {
    "userId": "user_123",
    "sessionId": "session_456"
  }
}
```

Response:
```json
{
  "response": "I found 15 properties available in San Francisco. Here are the top matches...",
  "intent": "property_search",
  "entities": {
    "location": "San Francisco",
    "property_type": null
  },
  "suggestions": [
    "Show me 2-bedroom apartments",
    "Filter by price under $4000"
  ]
}
```

#### Property Analysis

```http
POST /api/v1/analyze/property
Content-Type: application/json
Authorization: Bearer <token>

{
  "propertyId": "prop_123",
  "analysisType": "market_value"
}
```

#### Document Processing

```http
POST /api/v1/documents/extract
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <lease_document.pdf>
type: "lease"
```

## ⚠️ Error Handling

### GraphQL Errors

GraphQL errors follow the standard format:

```json
{
  "errors": [
    {
      "message": "Property not found",
      "code": "PROPERTY_NOT_FOUND",
      "path": ["property"],
      "locations": [{"line": 2, "column": 3}],
      "extensions": {
        "code": "PROPERTY_NOT_FOUND",
        "propertyId": "prop_123"
      }
    }
  ]
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHENTICATED` | User is not authenticated |
| `UNAUTHORIZED` | User doesn't have permission |
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `PROPERTY_NOT_FOUND` | Specific property not found |
| `TENANT_NOT_FOUND` | Specific tenant not found |
| `PAYMENT_FAILED` | Payment processing failed |
| `INTERNAL_ERROR` | Internal server error |

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| `200` | Success |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

## 🚦 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour
- **File uploads**: 50 requests per hour

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
```

## 💡 Examples

### Frontend Integration (React)

```typescript
import { useQuery, useMutation } from '@apollo/client';
import { GET_PROPERTIES, CREATE_PROPERTY } from './queries';

function PropertyList() {
  const { data, loading, error } = useQuery(GET_PROPERTIES);
  const [createProperty] = useMutation(CREATE_PROPERTY);

  const handleCreate = async (propertyData) => {
    try {
      const { data } = await createProperty({
        variables: { input: propertyData }
      });
      console.log('Property created:', data.createProperty);
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
```

### Mobile Integration (React Native)

```typescript
import { useQuery } from '@apollo/client';
import { GET_PROPERTIES } from './queries';

export const PropertyListScreen = () => {
  const { data, loading, refetch } = useQuery(GET_PROPERTIES);

  return (
    <FlatList
      data={data?.properties}
      renderItem={({ item }) => <PropertyCard property={item} />}
      onRefresh={refetch}
      refreshing={loading}
    />
  );
};
```

### Python Integration

```python
import requests

class PropFlowAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def get_properties(self, filters=None):
        query = """
        query GetProperties($filter: PropertyFilter) {
          properties(filter: $filter) {
            id
            name
            address { street city state }
            type
            status
          }
        }
        """
        
        response = requests.post(
            f"{self.base_url}/graphql",
            json={"query": query, "variables": {"filter": filters}},
            headers=self.headers
        )
        
        return response.json()
```

## 📞 Support

For API questions and support:

- 📖 **Interactive Docs**: Visit `/graphql` for GraphQL Playground
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/propflow-platform/issues)
- 💬 **Discord**: [Join our Discord](https://discord.gg/propflow)
- 📧 **Email**: [api-support@propflow.com](mailto:api-support@propflow.com)

---

**Happy Coding! 🚀**"
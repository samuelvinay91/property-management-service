# 🔧 Development Guide

This guide covers everything you need to know for developing PropFlow locally.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Database Management](#database-management)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Mobile Development](#mobile-development)
- [AI Services Development](#ai-services-development)
- [Debugging](#debugging)
- [Best Practices](#best-practices)

## 🔧 Prerequisites

### Required Software
- **Node.js** 18.x or higher
- **Python** 3.9+ (for AI services)
- **Docker** and Docker Compose
- **Git**
- **PostgreSQL** 14+ (for local development)
- **Redis** 6+ (for caching)

### Recommended Tools
- **Visual Studio Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Python
  - Docker
  - GraphQL
  - Prettier
  - ESLint
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **DBeaver** for database management
- **Redis Desktop Manager** for Redis management

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/propflow-platform.git
cd propflow-platform

# Run the quick start script
./scripts/quick-start.sh
```

### 2. Manual Setup (Alternative)

```bash
# Copy environment variables
cp .env.example .env

# Install dependencies
npm run install:all

# Start infrastructure services
docker-compose up -d postgres redis

# Run database migrations
npm run migrate

# Start development servers
npm run dev
```

## 🏗️ Development Environment

### Environment Variables

Edit your `.env` file with the following key variables for development:

```bash
# Development settings
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://propflow:password@localhost:5432/propflow

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Services (optional for basic development)
OPENAI_API_KEY=your_openai_key_here
```

### Services Overview

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Frontend | 3000 | http://localhost:3000 | Next.js web app |
| API Gateway | 4000 | http://localhost:4000/graphql | GraphQL endpoint |
| Auth Service | 4001 | http://localhost:4001 | Authentication |
| Property Service | 4002 | http://localhost:4002 | Property management |
| AI Services | 8000 | http://localhost:8000/docs | Python AI/ML APIs |
| PostgreSQL | 5432 | localhost:5432 | Database |
| Redis | 6379 | localhost:6379 | Cache |

## 📁 Project Structure

```
propflow-platform/
├── 🖥️  frontend/              # Next.js application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities
│   │   ├── hooks/            # Custom hooks
│   │   └── types/            # TypeScript types
│   ├── public/               # Static assets
│   └── package.json
├── ⚙️  backend/               # Microservices
│   ├── api-gateway/          # GraphQL gateway
│   ├── auth-service/         # Authentication
│   ├── property-service/     # Properties
│   ├── tenant-service/       # Tenants
│   ├── payment-service/      # Payments
│   ├── maintenance-service/  # Maintenance
│   ├── booking-service/      # Bookings
│   ├── notification-service/ # Notifications
│   └── shared/               # Shared utilities
├── 📱  mobile/               # React Native app
│   ├── src/
│   │   ├── screens/          # App screens
│   │   ├── components/       # Components
│   │   └── navigation/       # Navigation
│   └── package.json
├── 🤖  ai-services/          # Python AI services
│   ├── src/
│   │   ├── api/              # FastAPI routes
│   │   ├── chatbot/          # AI chatbot
│   │   └── analytics/        # AI analytics
│   └── requirements.txt
├── 📚  docs/                 # Documentation
├── 🚀  scripts/              # Deployment scripts
└── 🧪  tests/                # End-to-end tests
```

## 🔄 Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... develop your feature ...

# Run tests
npm run test

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### 2. Running Services

```bash
# Start all services
npm run dev

# Start specific service
npm run dev:frontend
npm run dev:backend
npm run dev:mobile
npm run dev:ai

# Start with specific environment
npm run dev:staging
```

### 3. Database Operations

```bash
# Run migrations
npm run migrate

# Create new migration
npm run migrate:create add_new_table

# Rollback migration
npm run migrate:rollback

# Seed development data
npm run seed

# Reset database
npm run db:reset
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests by category
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

```
tests/
├── unit/                     # Unit tests
│   ├── frontend/            # Frontend unit tests
│   ├── backend/             # Backend unit tests
│   └── mobile/              # Mobile unit tests
├── integration/             # Integration tests
├── e2e/                     # End-to-end tests
└── fixtures/                # Test data
```

### Writing Tests

#### Frontend Tests (Jest + Testing Library)

```typescript
// components/__tests__/PropertyCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';

describe('PropertyCard', () => {
  it('renders property information', () => {
    const property = {
      id: '1',
      name: 'Test Property',
      address: '123 Test St',
      price: 2000,
    };
    
    render(<PropertyCard property={property} />);
    
    expect(screen.getByText('Test Property')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
  });
});
```

#### Backend Tests (Jest + Supertest)

```typescript
// services/__tests__/PropertyService.test.ts
import { PropertyService } from '../PropertyService';

describe('PropertyService', () => {
  let propertyService: PropertyService;
  
  beforeEach(() => {
    propertyService = new PropertyService();
  });
  
  it('should create a new property', async () => {
    const propertyData = {
      name: 'Test Property',
      address: '123 Test St',
      price: 2000,
    };
    
    const property = await propertyService.create(propertyData);
    
    expect(property.name).toBe('Test Property');
    expect(property.id).toBeDefined();
  });
});
```

## 🗄️ Database Management

### Migrations

```bash
# Create migration
npm run migrate:create migration_name

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

### Seeding Data

```bash
# Seed all data
npm run seed

# Seed specific data
npm run seed:users
npm run seed:properties
npm run seed:demo
```

### Database Schema

Key entities and relationships:

```sql
-- Users (authentication)
users
├── id (uuid)
├── email (unique)
├── password_hash
├── role (enum)
└── created_at

-- Properties
properties
├── id (uuid)
├── owner_id (fk -> users.id)
├── name
├── address
├── type (enum)
└── created_at

-- Leases
leases
├── id (uuid)
├── property_id (fk -> properties.id)
├── tenant_id (fk -> users.id)
├── start_date
├── end_date
└── monthly_rent
```

## 🔌 API Development

### GraphQL Schema

The API uses GraphQL with a federated approach. Each service defines its own schema:

```graphql
# Property Service Schema
type Property {
  id: ID!
  name: String!
  address: String!
  type: PropertyType!
  owner: User!
  units: [Unit!]!
}

type Query {
  properties: [Property!]!
  property(id: ID!): Property
}

type Mutation {
  createProperty(input: CreatePropertyInput!): Property!
  updateProperty(id: ID!, input: UpdatePropertyInput!): Property!
}
```

### Adding New Endpoints

1. **Define GraphQL Schema**

```typescript
// backend/property-service/src/graphql/typeDefs.ts
export const typeDefs = gql`
  extend type Query {
    newPropertyEndpoint(filter: String): [Property!]!
  }
`;
```

2. **Implement Resolver**

```typescript
// backend/property-service/src/graphql/resolvers.ts
export const resolvers = {
  Query: {
    newPropertyEndpoint: async (_, { filter }, { dataSources }) => {
      return await dataSources.propertyService.findWithFilter(filter);
    },
  },
};
```

3. **Add to Gateway**

```typescript
// backend/api-gateway/src/index.ts
const gateway = new ApolloGateway({
  serviceList: [
    { name: 'property', url: 'http://property-service:4002/graphql' },
    // ... other services
  ],
});
```

## 🖥️ Frontend Development

### Component Development

```typescript
// src/components/PropertyCard.tsx
import { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
  onSelect?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
}) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold">{property.name}</h3>
      <p className="text-gray-600">{property.address}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-2xl font-bold">${property.rent}/mo</span>
        <button
          onClick={() => onSelect?.(property)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
```

### State Management

```typescript
// src/store/properties.ts
import { create } from 'zustand';
import { Property } from '@/types';

interface PropertyStore {
  properties: Property[];
  loading: boolean;
  fetchProperties: () => Promise<void>;
  addProperty: (property: Property) => void;
}

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  loading: false,
  
  fetchProperties: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/properties');
      const properties = await response.json();
      set({ properties, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to fetch properties:', error);
    }
  },
  
  addProperty: (property) => {
    set((state) => ({
      properties: [...state.properties, property],
    }));
  },
}));
```

## 📱 Mobile Development

### React Native Setup

```bash
# Start mobile development
cd mobile
npm install

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Screen Development

```typescript
// src/screens/PropertyListScreen.tsx
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { PropertyCard } from '@/components/PropertyCard';
import { useProperties } from '@/hooks/useProperties';

export const PropertyListScreen: React.FC = () => {
  const { properties, loading, fetchProperties } = useProperties();
  
  return (
    <FlatList
      data={properties}
      renderItem={({ item }) => (
        <PropertyCard property={item} />
      )}
      onRefresh={fetchProperties}
      refreshing={loading}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

## 🤖 AI Services Development

### Python Environment Setup

```bash
# Create virtual environment
cd ai-services
python -m venv venv

# Activate environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Adding New AI Endpoints

```python
# src/api/routes/new_feature.py
from fastapi import APIRouter, Depends
from src.services.ai_service import AIService

router = APIRouter()

@router.post("/analyze-property")
async def analyze_property(
    property_data: dict,
    ai_service: AIService = Depends(get_ai_service)
):
    """Analyze property using AI."""
    analysis = await ai_service.analyze_property(property_data)
    return {"analysis": analysis}
```

## 🐛 Debugging

### Frontend Debugging

```typescript
// Debug hooks
import { useEffect } from 'react';

export const useDebugValue = (value: any, label?: string) => {
  useEffect(() => {
    console.log(`[DEBUG ${label || 'Value'}]:`, value);
  }, [value, label]);
};

// Usage
const MyComponent = () => {
  const [data, setData] = useState(null);
  useDebugValue(data, 'Component Data');
  // ...
};
```

### Backend Debugging

```typescript
// Add logging
import { logger } from '@/utils/logger';

export class PropertyService {
  async findById(id: string) {
    logger.debug('Finding property by ID', { id });
    
    try {
      const property = await this.repository.findById(id);
      logger.info('Property found', { propertyId: id, propertyName: property.name });
      return property;
    } catch (error) {
      logger.error('Failed to find property', { id, error: error.message });
      throw error;
    }
  }
}
```

### Database Debugging

```bash
# Enable query logging
export DEBUG=typeorm:*

# Or in .env
DEBUG=typeorm:query,typeorm:error
```

## 📝 Best Practices

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** configurations
- Use **meaningful variable names**
- Add **JSDoc comments** for complex functions
- Follow **React best practices** (hooks, functional components)

### Git Workflow

```bash
# Feature branch naming
feature/add-property-search
bugfix/fix-payment-processing
hotfix/security-patch

# Commit message format
feat: add property search functionality
fix: resolve payment processing bug
docs: update API documentation
test: add unit tests for PropertyService
```

### Performance

- Use **React.memo** for expensive components
- Implement **pagination** for large datasets
- Use **database indexes** for frequently queried fields
- Implement **caching** with Redis
- **Optimize images** and static assets

### Security

- **Validate all inputs** on both client and server
- Use **parameterized queries** to prevent SQL injection
- Implement **rate limiting** on APIs
- **Sanitize user data** before storing
- Use **HTTPS** in production

## 📞 Getting Help

- 📚 **Documentation**: Check this guide and API docs
- 💬 **Discord**: Join our [Discord server](https://discord.gg/propflow)
- 🐛 **Issues**: Create a [GitHub issue](https://github.com/yourusername/propflow-platform/issues)
- 📧 **Email**: Contact [dev@propflow.com](mailto:dev@propflow.com)

---

**Happy Coding! 🚀**"
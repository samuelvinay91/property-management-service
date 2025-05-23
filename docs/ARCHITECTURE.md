# PropFlow - Technical Architecture Documentation

## 🏗️ System Architecture Overview

PropFlow is built using a modern microservices architecture designed for scalability, maintainability, and cloud-native deployment. The platform follows Domain-Driven Design (DDD) principles with clear service boundaries.

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>Next.js 14]
        MOBILE[Mobile App<br/>React Native]
        API_CLIENT[External APIs<br/>Third-party Integrations]
    end

    subgraph "API Gateway Layer"
        GATEWAY[API Gateway<br/>GraphQL Federation<br/>Express.js]
    end

    subgraph "Microservices Layer"
        AUTH[Auth Service<br/>JWT, OAuth, 2FA]
        PROPERTY[Property Service<br/>Listings, Search]
        TENANT[Tenant Service<br/>Management, Screening]
        PAYMENT[Payment Service<br/>Stripe, PayPal]
        NOTIFICATION[Notification Service<br/>Email, SMS, Push]
        MAINTENANCE[Maintenance Service<br/>Work Orders]
        BOOKING[Booking Service<br/>Property Viewings]
        AI[AI Services<br/>ChatBot, ML]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>Primary Database)]
        REDIS[(Redis<br/>Cache & Sessions)]
        MONGO[(MongoDB<br/>Analytics & Logs)]
        ELASTICSEARCH[(Elasticsearch<br/>Search Index)]
        S3[(Cloud Storage<br/>Files & Images)]
    end

    subgraph "External Services"
        STRIPE[Stripe<br/>Payments]
        TWILIO[Twilio<br/>SMS]
        SENDGRID[SendGrid<br/>Email]
        MAPS[Google Maps<br/>Location]
        OPENAI[OpenAI<br/>AI/ML]
    end

    WEB --> GATEWAY
    MOBILE --> GATEWAY
    API_CLIENT --> GATEWAY

    GATEWAY --> AUTH
    GATEWAY --> PROPERTY
    GATEWAY --> TENANT
    GATEWAY --> PAYMENT
    GATEWAY --> NOTIFICATION
    GATEWAY --> MAINTENANCE
    GATEWAY --> BOOKING
    GATEWAY --> AI

    AUTH --> POSTGRES
    AUTH --> REDIS
    PROPERTY --> POSTGRES
    PROPERTY --> REDIS
    PROPERTY --> ELASTICSEARCH
    TENANT --> POSTGRES
    PAYMENT --> POSTGRES
    PAYMENT --> STRIPE
    NOTIFICATION --> POSTGRES
    NOTIFICATION --> TWILIO
    NOTIFICATION --> SENDGRID
    MAINTENANCE --> POSTGRES
    BOOKING --> POSTGRES
    AI --> MONGO
    AI --> OPENAI

    PROPERTY --> S3
    TENANT --> S3
    MAINTENANCE --> S3
```

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Maps**: Mapbox GL JS

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **API**: GraphQL with Apollo Federation
- **Authentication**: JWT + Passport.js
- **Validation**: Zod
- **File Upload**: Multer + Sharp

### AI Services
- **Framework**: FastAPI (Python)
- **LLM**: OpenAI GPT-4, Anthropic Claude
- **Vector DB**: Pinecone
- **ML Framework**: LangChain
- **Document Processing**: PyPDF2, python-docx

### Databases
- **Primary**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Search**: Elasticsearch 8+
- **Analytics**: MongoDB 7+
- **File Storage**: AWS S3 / Google Cloud Storage

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Orchestration**: Kubernetes / Google Cloud Run
- **CI/CD**: GitHub Actions
- **Infrastructure as Code**: Terraform
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

## 🔐 Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Network Security"
            WAF[Web Application Firewall]
            CDN[CDN with DDoS Protection]
            VPC[Private Network/VPC]
        end
        
        subgraph "API Security"
            GATEWAY_SEC[API Gateway<br/>Rate Limiting<br/>Input Validation]
            JWT_AUTH[JWT Authentication<br/>Refresh Tokens]
            RBAC[Role-Based Access Control]
        end
        
        subgraph "Data Security"
            ENCRYPTION[Encryption at Rest<br/>TLS in Transit]
            SECRETS[Secret Management<br/>Vault/Secret Manager]
            BACKUP[Encrypted Backups]
        end
        
        subgraph "Application Security"
            INPUT_VAL[Input Validation<br/>SQL Injection Prevention]
            CORS[CORS Configuration]
            HELMET[Security Headers]
        end
    end

    CDN --> WAF
    WAF --> GATEWAY_SEC
    GATEWAY_SEC --> JWT_AUTH
    JWT_AUTH --> RBAC
```

### Security Features
- **Authentication**: Multi-factor authentication (2FA) with TOTP
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: End-to-end encryption, GDPR compliance
- **API Security**: Rate limiting, input validation, CORS
- **Infrastructure**: VPC isolation, security groups, SSL/TLS
- **Secrets Management**: Encrypted secret storage
- **Audit Logging**: Comprehensive security event logging

## 📊 Data Architecture

```mermaid
erDiagram
    USERS ||--o{ PROPERTIES : owns
    USERS ||--o{ TENANTS : manages
    PROPERTIES ||--o{ UNITS : contains
    PROPERTIES ||--o{ IMAGES : has
    PROPERTIES ||--o{ DOCUMENTS : has
    PROPERTIES ||--o{ AMENITIES : includes
    UNITS ||--o{ LEASES : occupied_by
    TENANTS ||--o{ LEASES : signs
    TENANTS ||--o{ APPLICATIONS : submits
    PROPERTIES ||--o{ APPLICATIONS : receives
    LEASES ||--o{ PAYMENTS : generates
    PROPERTIES ||--o{ MAINTENANCE_REQUESTS : has
    MAINTENANCE_REQUESTS ||--o{ WORK_ORDERS : creates
    PROPERTIES ||--o{ BOOKINGS : scheduled_for
    TENANTS ||--o{ BOOKINGS : makes

    USERS {
        uuid id PK
        string email UK
        string password_hash
        enum role
        boolean is_active
        timestamp created_at
    }

    PROPERTIES {
        uuid id PK
        uuid owner_id FK
        string title
        text description
        enum property_type
        enum status
        string address
        decimal rent_amount
        int bedrooms
        float bathrooms
        int square_footage
        json features
        boolean is_published
        timestamp created_at
    }

    UNITS {
        uuid id PK
        uuid property_id FK
        string unit_number
        enum unit_type
        enum status
        int bedrooms
        float bathrooms
        decimal rent_amount
        timestamp available_date
    }

    TENANTS {
        uuid id PK
        uuid user_id FK
        string first_name
        string last_name
        string phone
        string email
        decimal monthly_income
        enum screening_status
        timestamp created_at
    }

    LEASES {
        uuid id PK
        uuid unit_id FK
        uuid tenant_id FK
        date start_date
        date end_date
        decimal rent_amount
        decimal security_deposit
        enum status
        json terms
    }

    PAYMENTS {
        uuid id PK
        uuid lease_id FK
        decimal amount
        date due_date
        date paid_date
        enum status
        enum payment_method
        string transaction_id
    }

    MAINTENANCE_REQUESTS {
        uuid id PK
        uuid property_id FK
        uuid unit_id FK
        uuid tenant_id FK
        string title
        text description
        enum priority
        enum status
        timestamp created_at
    }

    BOOKINGS {
        uuid id PK
        uuid property_id FK
        uuid tenant_id FK
        datetime scheduled_at
        int duration_minutes
        enum status
        text notes
    }
```

## 🚀 Deployment Architecture

### Google Cloud Run Deployment

```mermaid
graph TB
    subgraph "Google Cloud Platform"
        subgraph "Frontend Tier"
            CDN[Cloud CDN]
            LB[Load Balancer]
            FRONTEND[Frontend Service<br/>Cloud Run]
        end
        
        subgraph "API Tier"
            API_GW[API Gateway<br/>Cloud Run]
            AUTH_SVC[Auth Service<br/>Cloud Run]
            PROP_SVC[Property Service<br/>Cloud Run]
            PAY_SVC[Payment Service<br/>Cloud Run]
            AI_SVC[AI Services<br/>Cloud Run]
        end
        
        subgraph "Data Tier"
            SQL[Cloud SQL<br/>PostgreSQL]
            REDIS_MEM[Memorystore<br/>Redis]
            STORAGE[Cloud Storage<br/>Files & Images]
            SECRET[Secret Manager]
        end
        
        subgraph "Monitoring"
            LOGGING[Cloud Logging]
            MONITORING[Cloud Monitoring]
            TRACE[Cloud Trace]
        end
    end

    CDN --> LB
    LB --> FRONTEND
    FRONTEND --> API_GW
    API_GW --> AUTH_SVC
    API_GW --> PROP_SVC
    API_GW --> PAY_SVC
    API_GW --> AI_SVC
    
    AUTH_SVC --> SQL
    PROP_SVC --> SQL
    PAY_SVC --> SQL
    AI_SVC --> SQL
    
    AUTH_SVC --> REDIS_MEM
    PROP_SVC --> REDIS_MEM
    
    PROP_SVC --> STORAGE
    AI_SVC --> STORAGE
    
    AUTH_SVC --> SECRET
    PAY_SVC --> SECRET
    AI_SVC --> SECRET
    
    ALL_SERVICES --> LOGGING
    ALL_SERVICES --> MONITORING
    ALL_SERVICES --> TRACE
```

### Container Architecture

```mermaid
graph TB
    subgraph "Container Registry"
        REG[Google Container Registry]
    end
    
    subgraph "Build Pipeline"
        GH[GitHub Repository]
        ACTIONS[GitHub Actions]
        BUILD[Cloud Build]
    end
    
    subgraph "Cloud Run Services"
        FRONTEND_CR[Frontend Container<br/>Port 3000]
        GATEWAY_CR[API Gateway Container<br/>Port 4000]
        AUTH_CR[Auth Service Container<br/>Port 4001]
        PROPERTY_CR[Property Service Container<br/>Port 4002]
        PAYMENT_CR[Payment Service Container<br/>Port 4004]
        AI_CR[AI Services Container<br/>Port 8000]
    end

    GH --> ACTIONS
    ACTIONS --> BUILD
    BUILD --> REG
    REG --> FRONTEND_CR
    REG --> GATEWAY_CR
    REG --> AUTH_CR
    REG --> PROPERTY_CR
    REG --> PAYMENT_CR
    REG --> AI_CR
```

## 🔄 API Architecture

### GraphQL Federation Schema

```mermaid
graph TB
    subgraph "API Gateway"
        FEDERATION[GraphQL Federation<br/>Apollo Gateway]
    end
    
    subgraph "Subgraph Services"
        AUTH_SCHEMA[Auth Subgraph<br/>Users, Sessions, Roles]
        PROPERTY_SCHEMA[Property Subgraph<br/>Properties, Units, Images]
        TENANT_SCHEMA[Tenant Subgraph<br/>Tenants, Applications]
        PAYMENT_SCHEMA[Payment Subgraph<br/>Payments, Invoices]
        BOOKING_SCHEMA[Booking Subgraph<br/>Bookings, Calendar]
    end

    FEDERATION --> AUTH_SCHEMA
    FEDERATION --> PROPERTY_SCHEMA
    FEDERATION --> TENANT_SCHEMA
    FEDERATION --> PAYMENT_SCHEMA
    FEDERATION --> BOOKING_SCHEMA
```

### API Patterns

#### Query Examples
```graphql
# Property Search with Federation
query SearchProperties($input: PropertySearchInput!) {
  searchProperties(input: $input) {
    properties {
      id
      title
      rentAmount
      images {
        url
        isPrimary
      }
      owner {
        id
        fullName
      }
      availableUnits {
        id
        rentAmount
        bedrooms
      }
    }
    total
    hasNextPage
  }
}

# Tenant Application with Cross-Service Data
query TenantApplication($id: ID!) {
  tenantApplication(id: $id) {
    id
    status
    tenant {
      id
      fullName
      creditScore
    }
    property {
      id
      title
      address
    }
    documents {
      id
      type
      status
    }
    payments {
      id
      amount
      status
    }
  }
}
```

## 🔍 Monitoring & Observability

```mermaid
graph TB
    subgraph "Application Metrics"
        APP_METRICS[Custom Metrics<br/>Business KPIs]
        PERF_METRICS[Performance Metrics<br/>Response Time, Throughput]
        ERROR_METRICS[Error Metrics<br/>Error Rate, Failed Requests]
    end
    
    subgraph "Infrastructure Metrics"
        INFRA_METRICS[Infrastructure Metrics<br/>CPU, Memory, Disk]
        NETWORK_METRICS[Network Metrics<br/>Bandwidth, Latency]
        DB_METRICS[Database Metrics<br/>Connections, Query Time]
    end
    
    subgraph "Monitoring Stack"
        PROMETHEUS[Prometheus<br/>Metrics Collection]
        GRAFANA[Grafana<br/>Dashboards]
        ALERTMANAGER[AlertManager<br/>Alerting]
    end
    
    subgraph "Logging Stack"
        LOGS[Application Logs<br/>Structured JSON]
        ELK[ELK Stack<br/>Log Processing]
        JAEGER[Jaeger<br/>Distributed Tracing]
    end

    APP_METRICS --> PROMETHEUS
    PERF_METRICS --> PROMETHEUS
    ERROR_METRICS --> PROMETHEUS
    INFRA_METRICS --> PROMETHEUS
    NETWORK_METRICS --> PROMETHEUS
    DB_METRICS --> PROMETHEUS
    
    PROMETHEUS --> GRAFANA
    PROMETHEUS --> ALERTMANAGER
    
    LOGS --> ELK
    ELK --> GRAFANA
```

## 📱 Mobile Architecture

```mermaid
graph TB
    subgraph "React Native App"
        NAVIGATION[React Navigation<br/>Stack & Tab Navigators]
        COMPONENTS[Reusable Components<br/>Property Cards, Forms]
        SCREENS[Feature Screens<br/>Search, Details, Profile]
    end
    
    subgraph "State Management"
        REDUX[Redux Toolkit<br/>Global State]
        QUERY[React Query<br/>Server State]
        ASYNC[AsyncStorage<br/>Local Persistence]
    end
    
    subgraph "Native Features"
        CAMERA[Camera<br/>Document Capture]
        LOCATION[Location Services<br/>Property Search]
        NOTIFICATIONS[Push Notifications<br/>Firebase]
        BIOMETRIC[Biometric Auth<br/>TouchID/FaceID]
    end

    SCREENS --> NAVIGATION
    SCREENS --> COMPONENTS
    COMPONENTS --> REDUX
    COMPONENTS --> QUERY
    REDUX --> ASYNC
    
    SCREENS --> CAMERA
    SCREENS --> LOCATION
    SCREENS --> NOTIFICATIONS
    SCREENS --> BIOMETRIC
```

## 🔧 Development Workflow

```mermaid
graph LR
    DEV[Development<br/>Local Environment]
    COMMIT[Git Commit<br/>Feature Branch]
    PR[Pull Request<br/>Code Review]
    TEST[Automated Testing<br/>Unit, Integration, E2E]
    BUILD[Container Build<br/>Docker Images]
    STAGING[Staging Deployment<br/>Cloud Run]
    PROD[Production Deployment<br/>Blue-Green]

    DEV --> COMMIT
    COMMIT --> PR
    PR --> TEST
    TEST --> BUILD
    BUILD --> STAGING
    STAGING --> PROD
```

## 🚦 Performance Optimization

### Caching Strategy
```mermaid
graph TB
    subgraph "Caching Layers"
        CDN_CACHE[CDN Cache<br/>Static Assets]
        REDIS_CACHE[Redis Cache<br/>API Responses]
        DB_CACHE[Database Cache<br/>Query Results]
        BROWSER_CACHE[Browser Cache<br/>Local Storage]
    end
    
    subgraph "Cache Invalidation"
        TTL[Time-Based TTL]
        EVENT[Event-Based<br/>Cache Invalidation]
        MANUAL[Manual Cache<br/>Clearing]
    end

    CDN_CACHE --> TTL
    REDIS_CACHE --> EVENT
    DB_CACHE --> EVENT
    BROWSER_CACHE --> TTL
```

### Database Optimization
- **Indexing**: Strategic indexing on frequently queried columns
- **Connection Pooling**: Efficient database connection management
- **Read Replicas**: Separate read/write operations
- **Query Optimization**: Optimized GraphQL resolvers to prevent N+1 queries

## 📊 Business Intelligence & Analytics

```mermaid
graph TB
    subgraph "Data Sources"
        OPERATIONAL[Operational Databases<br/>PostgreSQL]
        EVENTS[Event Streams<br/>Application Events]
        EXTERNAL[External APIs<br/>Market Data]
    end
    
    subgraph "Data Pipeline"
        ETL[ETL Processes<br/>Data Transformation]
        WAREHOUSE[Data Warehouse<br/>BigQuery/Snowflake]
        MART[Data Marts<br/>Domain-Specific]
    end
    
    subgraph "Analytics & Reporting"
        BI[Business Intelligence<br/>Tableau/Looker]
        DASHBOARDS[Real-time Dashboards<br/>Property Metrics]
        ML[Machine Learning<br/>Predictive Analytics]
    end

    OPERATIONAL --> ETL
    EVENTS --> ETL
    EXTERNAL --> ETL
    ETL --> WAREHOUSE
    WAREHOUSE --> MART
    MART --> BI
    MART --> DASHBOARDS
    MART --> ML
```

This architecture provides:
- **Scalability**: Microservices can scale independently
- **Reliability**: Fault isolation and graceful degradation
- **Maintainability**: Clear service boundaries and separation of concerns
- **Security**: Multiple layers of security controls
- **Performance**: Optimized caching and database strategies
- **Observability**: Comprehensive monitoring and logging
- **Cloud-Native**: Designed for modern cloud deployment
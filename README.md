# 🏠 Rentova - AI-Powered Property Management Platform

[![Deploy to Google Cloud Run](https://github.com/GoogleCloudPlatform/cloud-run-button/blob/master/deploy.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/yourusername/rentova-platform.git&cloudshell_working_dir=.&cloudshell_image=gcr.io/google.com/cloudsdktool/cloud-sdk:latest)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/r/rentova/platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive, AI-powered property management platform built with modern microservices architecture. Featuring intelligent automation, real-time communication, advanced analytics, and seamless multi-cloud deployment.

## 🚀 One-Click Deployment

### Deploy to Google Cloud Run
```bash
# Single command deployment
./scripts/deploy-cloudrun.sh

# Or use the deploy button above
```

### Local Development (Single Command)
```bash
# Clone and start everything
git clone https://github.com/yourusername/rentova-platform.git
cd rentova-platform
./scripts/quick-start.sh
```

### Docker Compose (Instant Setup)
```bash
# Start entire platform
docker-compose up -d

# Access applications:
# 🌐 Frontend: http://localhost:3000
# 🔧 Admin Panel: http://localhost:3000/admin
# 📊 Monitoring: http://localhost:3000/monitoring
# 🤖 AI Services: http://localhost:8000
# 📱 Mobile (Expo): http://localhost:19006
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mobile App     │    │   Admin Panel   │
│   (Next.js)     │    │ (React Native)   │    │   (React)       │
└─────────┬───────┘    └────────┬─────────┘    └─────────┬───────┘
          │                     │                        │
          └─────────────────────┼────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │     API Gateway         │
                    │   (GraphQL + REST)      │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐    ┌─────────▼──────────┐    ┌───────▼───────┐
│ Auth Service   │    │ Property Service   │    │ AI Services   │
│ (Node.js)      │    │ (Node.js)         │    │ (Python)      │
└───────┬───────┘    └─────────┬──────────┘    └───────┬───────┘
        │                      │                       │
        ├─────────────────┬────┼───────────────────────┘
        │                 │    │
┌───────▼───────┐ ┌───────▼────▼──────┐ ┌─────────────────┐
│ PostgreSQL    │ │     Redis         │ │   Monitoring    │
│ (Database)    │ │   (Cache)         │ │ (Prometheus)    │
└───────────────┘ └───────────────────┘ └─────────────────┘
```

## ✨ Key Features

### 🏢 **Property Management**
- Multi-property portfolio management
- Advanced property analytics & reporting
- Lease management & automated renewals
- Maintenance request tracking & scheduling
- Financial reporting & tax documents

### 🤖 **AI-Powered Intelligence**
- Intelligent chatbot for tenants & landlords
- Automated lease document generation
- Predictive maintenance scheduling
- Market analysis & pricing optimization
- Smart expense categorization

### 💰 **Payment & Financial**
- Integrated payment processing (Stripe)
- Automated rent collection & late fees
- Comprehensive financial reporting
- Tax document generation
- Real-time payment tracking

### 📱 **Multi-Platform Access**
- Responsive web application
- Native mobile app (iOS & Android)
- Progressive Web App (PWA)
- Admin dashboard with advanced analytics

### 📊 **Advanced Analytics**
- Real-time performance monitoring
- Predictive analytics & forecasting
- Market trend analysis
- Occupancy optimization
- Revenue performance insights

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| **Mobile** | React Native, Expo, TypeScript |
| **Backend** | Node.js, Express, GraphQL, TypeScript |
| **AI Services** | Python, FastAPI, LangChain, OpenAI |
| **Databases** | PostgreSQL, Redis, Vector DB |
| **Infrastructure** | Docker, Kubernetes, Google Cloud Run |
| **Monitoring** | Prometheus, Grafana, Custom Analytics |
| **Security** | JWT, OAuth2, RBAC, Encryption |

## 📁 Project Structure

```
propflow-platform/
├── 🖥️  frontend/              # Next.js web application
├── 📱  mobile/                # React Native mobile app
├── ⚙️   backend/               # Microservices (Node.js)
│   ├── api-gateway/           # GraphQL API Gateway
│   ├── auth-service/          # Authentication service
│   ├── property-service/      # Property management
│   ├── tenant-service/        # Tenant management
│   ├── payment-service/       # Payment processing
│   ├── maintenance-service/   # Maintenance tracking
│   ├── booking-service/       # Appointment booking
│   └── notification-service/  # Multi-channel notifications
├── 🤖  ai-services/           # Python AI/ML services
├── 🚀  infrastructure/        # Deployment & DevOps
├── 📋  tests/                 # End-to-end tests
└── 📚  docs/                  # Documentation
```

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Python 3.9+
- PostgreSQL 14+
- Redis 6+

### 1. Clone & Setup
```bash
git clone https://github.com/yourusername/rentova-platform.git
cd rentova-platform
cp .env.example .env  # Configure your environment variables
```

### 2. One-Command Start
```bash
# Start everything with Docker Compose
./scripts/quick-start.sh

# Or manually:
docker-compose up -d
```

### 3. Access Applications
- **Web App**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin  
- **API Gateway**: http://localhost:4000/graphql
- **AI Services**: http://localhost:8000/docs
- **Mobile (Expo)**: http://localhost:19006
- **Monitoring**: http://localhost:3000/monitoring

### 4. Demo Data
```bash
# Load sample data
npm run seed:demo-data
```

## 🌐 Deployment Options

### Google Cloud Run (Recommended)
```bash
# One-click deployment
./scripts/deploy-cloudrun.sh

# Or use gcloud CLI
gcloud run deploy propflow \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### AWS ECS
```bash
./scripts/deploy-aws.sh
```

### Azure Container Instances
```bash
./scripts/deploy-azure.sh
```

### Kubernetes
```bash
kubectl apply -f infrastructure/k8s/
```

## 📊 Monitoring & Analytics

### Real-time Metrics
- System performance monitoring
- Request tracking & error rates
- Database query optimization
- Memory & CPU usage alerts

### Business Analytics
- Property performance insights
- Revenue forecasting
- Tenant satisfaction metrics
- Market trend analysis

### Access Monitoring Dashboard
```
http://localhost:3000/monitoring
```

## 🔐 Security Features

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: End-to-end encryption
- **Compliance**: GDPR, SOC 2 ready
- **Security Monitoring**: Real-time threat detection

## 🧪 Testing

```bash
# Run all tests
npm run test

# Frontend tests
npm run test:frontend

# Backend tests  
npm run test:backend

# E2E tests
npm run test:e2e

# Load testing
npm run test:load
```

## 📱 Mobile App

The React Native mobile app provides:
- Property browsing & booking
- Tenant portal access
- Maintenance requests
- Payment processing
- Real-time notifications
- Biometric authentication

### Build Mobile App
```bash
cd mobile
npm install
npm run android  # or npm run ios
```

## 🤖 AI Features

### Intelligent Chatbot
- Natural language processing
- Context-aware responses
- Multi-language support
- Integration with property data

### Predictive Analytics
- Maintenance forecasting
- Occupancy predictions
- Market analysis
- Pricing optimization

## 📚 Documentation

- [📖 API Documentation](docs/API.md)
- [🔧 Development Guide](docs/DEVELOPMENT.md)
- [🚀 Deployment Guide](docs/DEPLOYMENT.md)
- [🤝 Contributing Guide](docs/CONTRIBUTING.md)
- [🏗️ Architecture Deep Dive](docs/ARCHITECTURE.md)

## 🌟 Demo & Screenshots

### Admin Dashboard
![Admin Dashboard](docs/images/admin-dashboard.png)

### Mobile App
![Mobile App](docs/images/mobile-app.png)

### Analytics
![Analytics](docs/images/analytics.png)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by the PropFlow team
- Powered by modern open-source technologies
- Inspired by the need for intelligent property management

## 📞 Support & Community

- 🐛 [Report Issues](https://github.com/yourusername/propflow-platform/issues)
- 💬 [Join Discord](https://discord.gg/propflow)
- 📧 [Email Support](mailto:support@propflow.com)
- 📖 [Documentation](https://docs.propflow.com)

---

<div align=\"center\">
  <strong>⭐ Star this repository if you find it helpful! ⭐</strong>
</div>"
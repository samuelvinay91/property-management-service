# 🤝 Contributing to PropFlow

We love your input! We want to make contributing to PropFlow as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 Quick Start for Contributors

### 1. Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/propflow-platform.git
cd propflow-platform

# Install dependencies
npm run install:all

# Copy environment variables
cp .env.example .env

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Run in development mode
npm run dev
```

### 2. Development Environment

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **AI Services**: http://localhost:8000
- **Database**: PostgreSQL on localhost:5432
- **Redis**: localhost:6379

## 📋 Development Workflow

### We Use [Github Flow](https://guides.github.com/introduction/flow/index.html)

1. **Fork** the repository
2. **Create** a feature branch from `main`
3. **Make** your changes
4. **Add or update** tests as needed
5. **Ensure** all tests pass
6. **Create** a Pull Request

### Branch Naming Convention

```bash
# Feature branches
feature/add-property-analytics
feature/improve-mobile-ui

# Bug fixes
fix/payment-processing-error
fix/mobile-crash-on-startup

# Documentation
docs/update-api-documentation
docs/add-deployment-guide

# Refactoring
refactor/optimize-database-queries
refactor/improve-error-handling
```

## 🏗️ Project Structure

Understanding the project structure will help you contribute effectively:

```
propflow-platform/
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # Utilities and configurations
│   │   ├── hooks/            # Custom React hooks
│   │   └── types/            # TypeScript type definitions
│   └── public/               # Static assets
├── backend/                   # Microservices
│   ├── api-gateway/          # GraphQL API Gateway
│   ├── auth-service/         # Authentication & authorization
│   ├── property-service/     # Property management
│   ├── tenant-service/       # Tenant management
│   ├── payment-service/      # Payment processing
│   ├── maintenance-service/  # Maintenance requests
│   ├── booking-service/      # Appointment booking
│   ├── notification-service/ # Notifications
│   └── shared/               # Shared utilities
├── mobile/                    # React Native app
│   ├── src/
│   │   ├── screens/          # App screens
│   │   ├── components/       # Mobile components
│   │   ├── navigation/       # Navigation config
│   │   └── services/         # API services
├── ai-services/              # Python AI/ML services
│   ├── src/
│   │   ├── api/              # FastAPI routes
│   │   ├── chatbot/          # AI chatbot
│   │   ├── analytics/        # Analytics services
│   │   └── models/           # ML models
└── tests/                    # End-to-end tests
```

## 🔧 Coding Standards

### TypeScript/JavaScript

We use **ESLint** and **Prettier** for code formatting:

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

#### Code Style Guidelines

- Use **TypeScript** for type safety
- Use **functional components** with hooks
- Use **arrow functions** for consistency
- Use **meaningful variable names**
- Add **JSDoc comments** for complex functions
- Follow **React best practices**

### Python

For AI services, we follow **PEP 8** standards:

```bash
# Format Python code
cd ai-services
black src/
isort src/

# Run linting
flake8 src/
mypy src/
```

### Database

- Use **migrations** for all database changes
- Follow **naming conventions** for tables and columns
- Add **proper indexing** for performance
- Use **transactions** for data consistency

## 🧪 Testing Guidelines

### Frontend Testing

```bash
# Unit tests
npm run test:frontend

# Component tests
npm run test:components

# E2E tests
npm run test:e2e:frontend
```

**Test Requirements:**
- Write tests for all new components
- Maintain **80%+ code coverage**
- Use **React Testing Library** for component tests
- Use **Jest** for unit tests

### Backend Testing

```bash
# Unit tests
npm run test:backend

# Integration tests
npm run test:integration

# API tests
npm run test:api
```

**Test Requirements:**
- Write tests for all new endpoints
- Test both **success and error cases**
- Use **supertest** for API testing
- Mock external dependencies

### Mobile Testing

```bash
# Mobile tests
cd mobile
npm run test

# Detox E2E tests (iOS/Android)
npm run test:e2e:ios
npm run test:e2e:android
```

## 📝 Documentation

### Code Documentation

- Add **JSDoc** comments for functions and classes
- Update **README.md** for significant changes
- Add **inline comments** for complex logic
- Update **API documentation** for new endpoints

### API Documentation

We use **GraphQL** with auto-generated documentation:

```bash
# Generate API docs
npm run docs:api

# View API docs
http://localhost:4000/graphql
```

## 🚀 Deployment Testing

Before submitting a PR, test your changes:

### Local Testing

```bash
# Build and test locally
npm run build
npm run test:all

# Test with production build
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Testing

```bash
# Test Google Cloud Run deployment
./scripts/test-cloudrun.sh

# Test with staging environment
./scripts/deploy-staging.sh
```

## 🐛 Bug Reports

Great bug reports tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Bug Report Template

```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Safari, Firefox]
- Node.js version: [e.g. 18.17.0]
- App version: [e.g. 1.2.3]

**Additional Context**
Add any other context about the problem here.
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** first
2. **Describe the problem** you're trying to solve
3. **Suggest a solution** with implementation details
4. **Consider the impact** on existing users
5. **Provide use cases** and examples

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions.

**Implementation Details**
Technical details about how this could be implemented.

**Additional Context**
Add any other context or screenshots about the feature request.
```

## 🏷️ Pull Request Process

### 1. Before Creating a PR

- [ ] Code follows style guidelines
- [ ] Self-review of the code
- [ ] Comments added for complex logic
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass locally

### 2. PR Requirements

- **Clear title** describing the change
- **Detailed description** of what changed and why
- **Link to related issues**
- **Screenshots** for UI changes
- **Breaking changes** clearly marked

### 3. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Screenshots (if applicable)

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code
- [ ] I have made corresponding changes to documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] New and existing unit tests pass locally
```

## 🎯 Areas We Need Help With

### High Priority
- 🐛 **Bug fixes** in mobile app
- 📊 **Performance optimizations** 
- 🔒 **Security improvements**
- 📱 **Mobile UI/UX enhancements**
- 🧪 **Test coverage improvements**

### Medium Priority
- 📚 **Documentation improvements**
- 🌐 **Internationalization (i18n)**
- ♿ **Accessibility improvements**
- 🎨 **UI/UX enhancements**
- 🔧 **DevOps improvements**

### Nice to Have
- 🤖 **AI/ML enhancements**
- 🔌 **Third-party integrations**
- 📈 **Analytics improvements**
- 🎮 **Developer tools**

## 🏆 Recognition

We recognize contributions in several ways:

- **Contributors list** in README
- **Release notes** mention
- **Hall of fame** on our website
- **Swag** for significant contributions
- **Direct collaboration** opportunities

## 📞 Getting Help

- 💬 **Discord**: Join our [Discord server](https://discord.gg/propflow)
- 🐛 **Issues**: Create a [GitHub issue](https://github.com/yourusername/propflow-platform/issues)
- 📧 **Email**: Contact us at [dev@propflow.com](mailto:dev@propflow.com)
- 📖 **Docs**: Check our [documentation](https://docs.propflow.com)

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Harassment, discrimination, or hate speech
- Trolling, insulting/derogatory comments
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying standards and are expected to take appropriate corrective action in response to unacceptable behavior.

Report violations to [conduct@propflow.com](mailto:conduct@propflow.com).

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to PropFlow! 🙏**

Your contributions help make property management better for everyone."
# SIL E-Commerce Project



## 🚀 Features

- **Full-Stack Solution**: Completely integrated backend and frontend
- **OIDC Authentication**: Secure authentication with OpenID Connect
- **Product Management**: CRUD operations for products with categories
- **Order Processing**: Complete order flow with notifications
- **SMS Notifications**: Real-time customer notifications via Africa's Talking
- **Email Notifications**: Order confirmations to administrators
- **Modern UI**: Responsive React frontend with dark mode support
- **Comprehensive Testing**: Backend and frontend tests with high coverage
- **Kubernetes Ready**: Helm charts for deployment to Kubernetes
- **CI/CD Pipeline**: Automated testing and deployment

## 🏗️ Architecture

This project consists of two main components:

1. **Backend (Django REST API)**: Provides API endpoints for products, orders, and authentication
2. **Frontend (React/TypeScript)**: Modern UI for customers to browse products and place orders

### System Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│                 │     │                  │     │                │
│  React Frontend │◄────┤  Django Backend  │◄────┤  PostgreSQL DB │
│                 │     │                  │     │                │
└─────────────────┘     └──────────────────┘     └────────────────┘
                               │
                               │
                               ▼
                        ┌──────────────┐
                        │              │
                        │ Redis/Celery │
                        │              │
                        └──────────────┘
                               │
                               │
                               ▼
                  ┌───────────────────────┐
                  │                       │
                  │ External Integrations │
                  │ - Africa's Talking    │
                  │ - Email Service       │
                  │                       │
                  └───────────────────────┘
```

## 🛠️ Tech Stack

### Backend

- **Django & Django REST Framework**: Web framework and API
- **PostgreSQL**: Relational database
- **Redis & Celery**: Asynchronous task processing
- **JWT & OIDC**: Authentication
- **Africa's Talking SDK**: SMS integration
- **Pytest**: Testing framework
- **Docker & Kubernetes**: Containerization and orchestration

### Frontend

- **React**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS & shadcn/ui**: Styling and components
- **Zustand**: State management
- **Vitest & Cypress**: Testing
- **GitHub Actions**: CI/CD


##  Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+ or Bun
- PostgreSQL
- Redis
- Docker & Docker Compose (optional)
- Kubernetes & Helm (optional)

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/StanleyKioko/savannah-task
cd sil-project

# Start all services
docker-compose up -d

# Set up the backend
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python upload_products.py

# The backend API will be available at http://localhost:8000/api/
# The frontend will be available at http://localhost:5173/
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python -m pytest --cov=store
```

### Frontend Tests

```bash
cd frontend
npm run test
npm run test:e2e
```

## 🚢 Deployment

### Kubernetes Deployment

The project includes Helm charts for Kubernetes deployment:

```bash
# Deploy to Kubernetes
cd backend
helm install backend ./helm --values helm/values.yaml

# For local testing with Minikube
helm install backend ./helm --values helm/values-minikube.yaml
```
# SIL E-Commerce Project

A modern, full-stack e-commerce solution with a Django REST Framework backend and React/TypeScript frontend.

![Project Banner](https://via.placeholder.com/1200x300/3498db/ffffff?text=SIL+E-Commerce+Project)

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

## 📚 Documentation

### Backend Documentation

- [Project Documentation](./sil-backend-scaffold/docs/PROJECT_DOCUMENTATION.md)
- [API Documentation](./sil-backend-scaffold/docs/REST_API_DOCUMENTATION.md)
- [Architecture Overview](./sil-backend-scaffold/docs/ARCHITECTURE.md)
- [Kubernetes Deployment](./sil-backend-scaffold/docs/KUBERNETES_DEPLOYMENT.md)
- [API Testing Guide](./sil-backend-scaffold/docs/API_TESTING.md)
- [Keycloak Setup](./sil-backend-scaffold/docs/KEYCLOAK_SETUP.md)

### Frontend Documentation

- [Frontend README](./neo-cartel/README.md)

## 🚦 Getting Started

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
git clone https://github.com/yourusername/sil-project.git
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

### Manual Setup

See the individual README files in the backend and frontend directories for detailed setup instructions:

- [Backend Setup](./sil-backend-scaffold/README.md)
- [Frontend Setup](./neo-cartel/README.md)

## 🧪 Testing

### Backend Tests

```bash
cd sil-backend-scaffold
python -m pytest --cov=store
```

### Frontend Tests

```bash
cd neo-cartel
npm run test
npm run test:e2e
```

## 🚢 Deployment

### Kubernetes Deployment

The project includes Helm charts for Kubernetes deployment:

```bash
# Deploy to Kubernetes
cd sil-backend-scaffold
helm install sil-backend ./helm --values helm/values.yaml

# For local testing with Minikube
helm install sil-backend ./helm --values helm/values-minikube.yaml
```

See the [Kubernetes Deployment Guide](./sil-backend-scaffold/docs/KUBERNETES_DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [Django](https://www.djangoproject.com/)
- [React](https://reactjs.org/)
- [Africa's Talking](https://africastalking.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- All open source libraries used in this project
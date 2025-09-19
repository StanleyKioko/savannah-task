# SIL E-commerce Backend

A Django-based REST API backend for e-commerce applications with comprehensive order management, customer authentication, and notification systems.

## Overview

This project provides a robust backend API for e-commerce operations including product catalog management, order processing, customer authentication via OIDC, and automated notifications through SMS and email channels.

## Architecture

The application follows a microservices-ready architecture with:

- **Django REST Framework** for API endpoints
- **GraphQL** support alongside REST
- **Celery** for asynchronous task processing
- **Redis** for caching and message brokering
- **OIDC Authentication** with Keycloak integration
- **Containerized deployment** with Docker and Kubernetes support

## Key Features

### Core Functionality
- Hierarchical product categories using django-mptt
- Product management with image upload support
- Customer management with OIDC authentication
- Order processing with line item support
- Shopping cart and wishlist functionality

### Authentication & Security
- OIDC (OpenID Connect) integration with Keycloak
- JWT token validation with JWKS caching
- Role-based access control
- CORS configuration for frontend integration

### Notifications
- Asynchronous SMS notifications via Africa's Talking
- Email notifications for order confirmations
- Configurable notification preferences per order
- Comprehensive logging and status tracking

### Performance & Scalability
- Redis-based caching system
- Database query optimization
- Asynchronous task processing
- Docker containerization
- Kubernetes deployment ready

## Tech Stack

- **Backend Framework**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (development)
- **Task Queue**: Celery with Redis broker
- **Caching**: Redis
- **Authentication**: OIDC with Keycloak
- **API**: REST + GraphQL (Strawberry)
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes with Helm charts
- **Testing**: pytest with coverage reporting
- **CI/CD**: GitHub Actions support

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.8+ (for local development)
- Redis (for caching and Celery)
- PostgreSQL (optional, for production)

### Docker Setup (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/StanleyKioko/savannah-task
cd backend
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` file with your configuration:
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@db:5432/sil_db

# Redis Configuration  
REDIS_URL=redis://redis:6379/0

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Africa's Talking SMS Configuration
AT_USERNAME=your-username
AT_API_KEY=your-api-key

# Keycloak OIDC Configuration
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=your-realm
```

4. Start all services:
```bash
docker-compose up --build
```

The API will be available at `http://localhost:8000`

### Local Development Setup

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run database migrations:
```bash
python manage.py migrate
```

4. Create superuser:
```bash
python manage.py createsuperuser
```

5. Load sample data:
```bash
python manage.py loaddata sample_products.csv
```

6. Start development server:
```bash
python manage.py runserver
```

## API Documentation

### REST API Endpoints

#### Products
- `GET /api/products/` - List all products
- `GET /api/products/{id}/` - Get product details
- `POST /api/products/upload/` - Upload products via CSV

#### Categories  
- `GET /api/categories/` - List all categories
- `GET /api/categories/{id}/average-price/` - Get average price for category

#### Orders
- `POST /api/orders/` - Create new order
- `GET /api/orders/{id}/` - Get order details
- `GET /api/orders/{id}/notifications/` - Get notification status

#### Customer Management
- `GET /api/customers/profile/` - Get customer profile
- `PUT /api/customers/profile/` - Update customer profile
- `GET /api/cart/` - Get shopping cart
- `POST /api/cart/add/` - Add item to cart
- `GET /api/wishlist/` - Get wishlist items
- `POST /api/wishlist/add/` - Add item to wishlist

### GraphQL API

GraphQL endpoint available at `/api/graphql/`

Example queries:
```graphql
query GetProducts {
  products {
    id
    name
    price
    category {
      name
    }
  }
}

query GetCategories {
  categories {
    id
    name
    children {
      name
    }
  }
}
```

### Authentication

The API supports OIDC authentication with Keycloak. Include the JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer your-jwt-token" http://localhost:8000/api/products/
```

## Data Models

### Core Models

#### Category
- Hierarchical structure using django-mptt
- Fields: name, slug, parent
- Supports nested categories with unlimited depth

#### Product  
- Fields: sku, name, description, category, price, sale_price, image
- Foreign key relationship to Category
- Image upload support with proper validation

#### Customer
- OIDC integration for external identity providers
- Fields: external_id, first_name, last_name, email, phone
- Automatic profile creation from OIDC claims

#### Order
- Fields: customer, total_amount, status, created_at
- Support for line items with quantity and unit price
- Notification preferences (SMS/Email)

## Background Tasks

### Celery Configuration

Celery handles asynchronous tasks such as:
- Order notification sending
- Email delivery
- SMS notifications via Africa's Talking
- Batch processing operations

### Available Tasks

#### send_order_notifications
Processes order notifications after order creation:
- Validates order existence
- Sends SMS notifications (if enabled)
- Sends email confirmations
- Logs notification status

Example usage:
```python
from store.tasks import send_order_notifications
send_order_notifications.delay(order_id=123)
```

## Deployment

### Docker Production Deployment

1. Build production image:
```bash
docker build -t backend:latest .
```

2. Run with production settings:
```bash
docker run -d \
  -e DJANGO_SETTINGS_MODULE=sil_project.settings \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -p 8000:8000 \
  sil-backend:latest
```

### Kubernetes Deployment

Helm charts are provided for Kubernetes deployment:

1. Install Helm chart:
```bash
helm install backend ./helm/
```

2. Configure values:
```yaml
# values.yaml
image:
  repository: your-registry/sil-backend
  tag: "latest"

database:
  host: postgresql-service
  name: sil_db
  
redis:
  host: redis-service
```

3. Apply configuration:
```bash
helm upgrade sil-backend ./helm/ -f values.yaml
```

## Testing

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=store

# Run specific test file
pytest store/tests/test_models.py

# Run integration tests
pytest store/tests/test_integration.py -v
```

### Test Coverage

The project maintains high test coverage across:
- Model functionality and validation
- API endpoint behavior
- Authentication mechanisms
- Task execution and error handling
- Integration scenarios

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | sqlite:///db.sqlite3 | No |
| `REDIS_URL` | Redis connection string | redis://localhost:6379/0 | Yes |
| `SECRET_KEY` | Django secret key | - | Yes |
| `DEBUG` | Debug mode | False | No |
| `ALLOWED_HOSTS` | Allowed hostnames | localhost,127.0.0.1 | No |
| `EMAIL_HOST` | SMTP server host | localhost | No |
| `EMAIL_HOST_USER` | SMTP username | - | No |
| `EMAIL_HOST_PASSWORD` | SMTP password | - | No |
| `AT_USERNAME` | Africa's Talking username | - | No |
| `AT_API_KEY` | Africa's Talking API key | - | No |
| `KEYCLOAK_SERVER_URL` | Keycloak server URL | - | Yes |
| `KEYCLOAK_REALM` | Keycloak realm name | - | Yes |

### Cache Configuration

Redis-based caching is configured for:
- JWKS key caching (1 hour TTL)
- Database query caching (15 minutes TTL)
- API response caching (5 minutes TTL)

## Monitoring and Logging

### Logging Configuration

The application uses structured logging with multiple levels:
- INFO: General application flow
- WARNING: Potential issues
- ERROR: Error conditions
- DEBUG: Detailed diagnostic information

Logs are written to:
- Console output (development)
- File rotation (production)
- External logging services (configurable)

### Health Checks

Health check endpoints available:
- `GET /health/` - Basic application health
- `GET /health/db/` - Database connectivity
- `GET /health/redis/` - Redis connectivity
- `GET /health/celery/` - Celery worker status

## Development Guidelines

### Code Style
- Follow PEP 8 standards
- Use type hints where appropriate
- Maintain test coverage above 90%
- Document all public APIs

### Git Workflow
- Feature branches for new development
- Pull request reviews required
- Automated testing on all commits
- Semantic versioning for releases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Review existing documentation
- Check the test files for usage examples
cp .env.example .env
# Edit .env with your settings

# Start the services using the provided script
# On Linux/macOS:
chmod +x scripts/run_local.sh
./scripts/run_local.sh

# On Windows:
scripts\run_local.bat
```

The scripts will:
1. Start all required containers (Django, PostgreSQL, Redis)
2. Run database migrations
3. Set up Keycloak for OIDC authentication
4. Provide instructions for next steps

## <a name="local-development-setup"></a>Local Development Setup

For local development without Docker:

1. Extract the repo and `cd` into it.
2. Create a Python virtualenv (Python 3.11+ recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (copy from `.env.example`):
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```
7. Run development server:
   ```bash
   python manage.py runserver
   ```
8. Start Celery worker (in a separate terminal):
   ```bash
   celery -A sil_project worker -l info
   ```
9. Set up Keycloak for authentication:
   ```bash
   chmod +x scripts/setup_keycloak.sh
   ./scripts/setup_keycloak.sh
   ```

## <a name="api-endpoints"></a>API Endpoints

All API endpoints require authentication with a valid OIDC token:

```bash
# Example request with token
curl -X GET http://localhost:8000/api/products/ \
  -H "Authorization: Bearer <your_token>"
```

### Key Endpoints

#### Products
- `GET /api/products/` - List all products
- `POST /api/products/upload/` - Upload products via CSV
  - CSV format: `sku,name,price,category_path`
  - Example: `P001,Apple,10.50,All Products/Produce/Fruits`

#### Categories
- `GET /api/categories/<id>/average-price/` - Get average price for a category and all its descendants

#### Orders
- `POST /api/orders/` - Create a new order
  - This will trigger SMS and email notifications via Celery
- `GET /api/orders/<id>/` - Get details of a specific order

## <a name="graphql-api"></a>GraphQL API

In addition to the REST API, this project also provides a GraphQL API:

```bash
# Example GraphQL query
curl -X POST http://localhost:8000/api/graphql/ \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ allProducts { id name price category { name } } }"
  }'
```

The GraphQL API supports:
- Querying products, categories, and orders
- Creating new orders
- Filtering and nested querying

For detailed examples, see [GraphQL Usage Guide](docs/GRAPHQL_USAGE.md).

## <a name="api-documentation"></a>API Documentation

The API is documented using Swagger/OpenAPI:

- **Swagger UI**: [http://localhost:8000/swagger/](http://localhost:8000/swagger/)
- **OpenAPI Schema**: [http://localhost:8000/swagger.json](http://localhost:8000/swagger.json)

The documentation includes:
- All available endpoints
- Request and response schemas
- Authentication requirements
- Example requests

For more information, see [REST API Documentation](docs/REST_API_DOCUMENTATION.md).

## <a name="sample-workflow"></a>Sample Workflow

Here's a complete workflow from creating categories to receiving notifications:

### 1. Create a root category
```bash
curl -X POST http://localhost:8000/api/categories/ \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "All Products", "parent": null}'
```

### 2. Upload products with CSV
```bash
curl -X POST http://localhost:8000/api/products/upload/ \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample_products.csv"
```

Example CSV content (sample_products.csv):
```csv
sku,name,price,category_path
P001,Apple,10.50,All Products/Produce/Fruits
P002,Banana,5.75,All Products/Produce/Fruits
P003,Bread,3.25,All Products/Bakery
```

### 3. Create an order
```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": 1,
    "items": [
      {"product": 1, "qty": 2},
      {"product": 2, "qty": 3}
    ]
  }'
```

### 4. Automatic notifications
After creating the order:
- The customer will receive an SMS via Africa's Talking
- The admin will receive an email with order details
- These notifications are processed asynchronously via Celery

## <a name="oidc-authentication"></a>OIDC Authentication

This project uses OpenID Connect (OIDC) for authentication. For local testing:

1. Set up Keycloak using the provided script:
   ```bash
   chmod +x scripts/setup_keycloak.sh
   ./scripts/setup_keycloak.sh
   ```

2. Obtain a token:
   ```bash
   curl -X POST \
     http://localhost:8080/realms/sil/protocol/openid-connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=sil-backend" \
     -d "client_secret=sil-backend-secret" \
     -d "grant_type=password" \
     -d "username=testuser" \
     -d "password=password"
   ```

The authentication system:
- Validates JWT tokens with signature verification
- Caches JWKS for better performance (TTL: 10 minutes)
- Selects the correct key using the `kid` header
- Maps OIDC subjects to Customer records
- Updates customer profiles when token information changes

For detailed OIDC setup instructions, see [Keycloak Setup](docs/KEYCLOAK_SETUP.md).

## <a name="notification-system"></a>Notification System

The application includes a robust notification system powered by Celery and integrated with:

1. **Africa's Talking SMS API**: Sends SMS notifications to customers when orders are placed.
   - Requires valid Africa's Talking credentials in `.env`
   - Supports sandbox mode for development (`AFRICASTALKING_SANDBOX=True`)
   - Uses `STORE_PHONE_NUMBER` for sender ID (when available)
   - Gracefully handles errors and missing configuration

2. **Email Notifications**: Sends detailed order summaries to administrators.
   - Uses Django's email system
   - Configurable with standard email settings

Notifications are dispatched asynchronously via Celery tasks, ensuring the main application remains responsive. Tasks are idempotent and include retry logic for transient failures.

## <a name="environment-variables"></a>Environment Variables

See `.env.example` for all required environment variables. Key variables include:

| Category | Variables |
|----------|-----------|
| Django | `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` |
| Database | `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` |
| Celery | `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |
| OIDC | `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URL` |
| Africa's Talking | `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY`, `AFRICASTALKING_SANDBOX` |
| Email | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`, `ADMIN_EMAIL` |

## <a name="testing"></a>Testing

The project includes comprehensive tests for all components:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=store --cov=sil_project

# Generate coverage report
pytest --cov=store --cov=sil_project --cov-report=html
```

Test coverage includes:
- Authentication (token validation, JWKS caching, user creation)
- API endpoints (product upload, order creation)
- Notification system (SMS, email)
- Celery integration (task execution, retries)
- GraphQL API

## <a name="architecture"></a>Architecture

This project follows a clean, modular architecture:

- **Models**: Core data models in `store/models.py`
- **Views**: API endpoints in `store/views.py`
- **Serializers**: Data validation in `store/serializers.py`
- **Authentication**: OIDC auth in `store/auth.py`
- **Background Tasks**: Celery tasks in `store/tasks.py`

Key technologies:
- **Django & DRF**: Web framework and API
- **PostgreSQL**: Relational database
- **Redis**: Message broker for Celery and caching
- **Celery**: Asynchronous task processing
- **MPTT**: Hierarchical categories
- **Python-jose**: JWT handling
- **Graphene-Django**: GraphQL implementation
- **drf-yasg**: Swagger/OpenAPI documentation


## <a name="deployment"></a>Deployment

### Development
Use `docker-compose.yml` for local development:
```bash
docker-compose up -d
```

### Testing
CI/CD pipeline runs tests automatically on each commit. Run tests locally with:
```bash
pytest
```

### Production
For production deployment, use the provided Helm chart:
1. Customize `helm/values.yaml` for your environment
2. Deploy to Kubernetes:
   ```bash
   helm install sil-backend ./helm
   ```

See `helm/values.example.yaml` for an example configuration.

## <a name="cicd"></a>CI/CD

The project includes a GitHub Actions workflow for continuous integration:
- Runs on every push and pull request
- Executes all tests with coverage reporting
- Builds and tests the Docker image
- Lints code with flake8
- Generates coverage reports

## <a name="performance"></a>Performance Optimization

The application includes several performance optimizations:

1. **Redis Caching**:
   - View-level caching for expensive endpoints
   - Database query caching for frequently accessed data
   - Configurable TTL for different types of data

2. **Database Optimizations**:
   - Efficient query patterns using select_related and prefetch_related
   - Database connection pooling
   - Proper indexing on frequently queried fields

3. **API Optimizations**:
   - Pagination for large result sets
   - Rate limiting to prevent abuse
   - Optimized serializers that avoid N+1 query problems

4. **GraphQL Optimization**:
   - Dataloader pattern to batch database queries
   - Query complexity analysis to prevent expensive queries
   - Result caching for common queries

These optimizations ensure the application can handle high loads while maintaining responsive performance.

# Development Guide

This guide covers setting up the development environment, coding standards, and development workflows for the SIL E-commerce Backend project.

## Development Environment Setup

### Prerequisites

- Python 3.8+
- PostgreSQL 12+ (optional, SQLite used by default)
- Redis 6+
- Docker and Docker Compose
- Git

### Local Development Setup

#### 1. Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/yourusername/sil-backend-scaffold.git
cd sil-backend-scaffold

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Development .env configuration:**
```bash
DEBUG=True
SECRET_KEY=development-secret-key-change-in-production
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# CORS settings for frontend development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8087

# Email settings (console backend for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Celery settings (eager execution for development)
CELERY_TASK_ALWAYS_EAGER=True

# Logging level
LOG_LEVEL=DEBUG
```

#### 3. Database Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json
```

#### 4. Start Development Server

```bash
# Start Django development server
python manage.py runserver

# In a separate terminal, start Celery worker (if not using eager mode)
celery -A sil_project worker -l info

# In another terminal, start Celery beat scheduler (for scheduled tasks)
celery -A sil_project beat -l info
```

### Docker Development Setup

```bash
# Start all services with docker-compose
docker-compose -f docker-compose.dev.yml up --build

# Run migrations
docker-compose -f docker-compose.dev.yml exec web python manage.py migrate

# Create superuser
docker-compose -f docker-compose.dev.yml exec web python manage.py createsuperuser

# Access application logs
docker-compose -f docker-compose.dev.yml logs -f web
```

## Project Structure

```
sil-backend-scaffold/
├── sil_project/                # Django project configuration
│   ├── __init__.py
│   ├── settings.py            # Django settings
│   ├── urls.py                # Main URL configuration
│   ├── wsgi.py                # WSGI configuration
│   ├── asgi.py                # ASGI configuration
│   └── celery_app.py          # Celery configuration
├── store/                     # Main application
│   ├── __init__.py
│   ├── admin.py               # Django admin configuration
│   ├── apps.py                # App configuration
│   ├── models.py              # Database models
│   ├── views.py               # API views
│   ├── serializers.py         # DRF serializers
│   ├── urls.py                # App URL configuration
│   ├── tasks.py               # Celery tasks
│   ├── auth.py                # Authentication logic
│   ├── cache.py               # Caching utilities
│   ├── schema.py              # GraphQL schema
│   ├── services/              # Business logic services
│   │   ├── __init__.py
│   │   ├── order_service.py
│   │   └── notification_service.py
│   ├── repositories/          # Data access layer
│   │   ├── __init__.py
│   │   └── product_repository.py
│   ├── migrations/            # Database migrations
│   └── tests/                 # Test files
│       ├── __init__.py
│       ├── test_models.py
│       ├── test_views.py
│       ├── test_services.py
│       └── test_tasks.py
├── media/                     # User uploaded files
├── staticfiles/               # Static files (collected)
├── logs/                      # Application logs
├── fixtures/                  # Sample data fixtures
├── scripts/                   # Utility scripts
├── docs/                      # Documentation
├── requirements.txt           # Python dependencies
├── pytest.ini                # Pytest configuration
├── .env.example               # Environment variables template
├── docker-compose.yml         # Docker compose for production
├── docker-compose.dev.yml     # Docker compose for development
├── Dockerfile                 # Docker image definition
└── README.md                  # Project documentation
```

## Coding Standards

### Python Code Style

#### 1. PEP 8 Compliance

Follow PEP 8 guidelines with these specific configurations:

```python
# .flake8
[flake8]
max-line-length = 88
extend-ignore = E203, W503
exclude = 
    migrations,
    __pycache__,
    manage.py,
    settings.py,
    venv

# pyproject.toml (for black)
[tool.black]
line-length = 88
target-version = ['py38']
extend-exclude = '''
/(
    migrations
  | __pycache__
)/
'''
```

#### 2. Import Organization

```python
# Standard library imports
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

# Third-party imports
from django.db import models
from django.contrib.auth.models import User
from rest_framework import serializers

# Local application imports
from .models import Product, Category
from .services import OrderService
```

#### 3. Type Hints

Use type hints for function parameters and return values:

```python
from typing import Dict, List, Optional, Union
from django.db.models import QuerySet

def get_products_by_category(
    category_id: int, 
    limit: Optional[int] = None
) -> QuerySet[Product]:
    """Get products filtered by category."""
    queryset = Product.objects.filter(category_id=category_id)
    if limit:
        queryset = queryset[:limit]
    return queryset

def calculate_order_total(items: List[Dict[str, Union[int, str]]]) -> Decimal:
    """Calculate total amount for order items."""
    total = Decimal('0.00')
    for item in items:
        total += Decimal(str(item['unit_price'])) * item['quantity']
    return total
```

#### 4. Docstrings

Use Google-style docstrings:

```python
def create_order(customer: Customer, order_data: Dict) -> Order:
    """Create a new order for the given customer.
    
    Args:
        customer: The customer placing the order
        order_data: Dictionary containing order information
            - items: List of order items
            - shipping_address: Customer shipping address
            - notes: Optional order notes
    
    Returns:
        Order: The created order instance
    
    Raises:
        ValidationError: If order data is invalid
        InsufficientStockError: If product stock is insufficient
    """
```

### Django Best Practices

#### 1. Model Design

```python
class BaseModel(models.Model):
    """Abstract base model with common fields."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class Product(BaseModel):
    """Product model with proper field definitions."""
    sku = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique product identifier"
    )
    name = models.CharField(max_length=300)
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    class Meta:
        db_table = 'products'
        ordering = ['name']
        indexes = [
            models.Index(fields=['category', 'price']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self) -> str:
        return f"{self.name} ({self.sku})"
    
    def clean(self):
        """Custom model validation."""
        super().clean()
        if self.sale_price and self.sale_price >= self.price:
            raise ValidationError("Sale price must be less than regular price")
```

#### 2. View Design

```python
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

class ProductViewSet(ModelViewSet):
    """ViewSet for managing products."""
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['category', 'in_stock']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    
    def get_permissions(self):
        """Instantiate and return the list of permissions required for this view."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        """Upload product image."""
        product = self.get_object()
        serializer = ProductImageSerializer(data=request.data)
        
        if serializer.is_valid():
            product.image = serializer.validated_data['image']
            product.save()
            return Response({'status': 'image uploaded'})
        else:
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
```

#### 3. Serializer Design

```python
class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_on_sale = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'description', 'category', 'category_name',
            'price', 'sale_price', 'is_on_sale', 'image', 'in_stock',
            'stock_quantity', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_on_sale(self, obj: Product) -> bool:
        """Check if product is currently on sale."""
        return obj.sale_price is not None and obj.sale_price < obj.price
    
    def validate_sku(self, value: str) -> str:
        """Validate SKU format."""
        if not re.match(r'^[A-Z0-9\-_]+$', value):
            raise serializers.ValidationError(
                "SKU must contain only uppercase letters, numbers, hyphens, and underscores"
            )
        return value
```

### Database Migrations

#### 1. Migration Best Practices

```python
# Always create migrations for model changes
python manage.py makemigrations

# Review migration files before applying
python manage.py sqlmigrate store 0001

# Apply migrations
python manage.py migrate

# Create empty migration for data operations
python manage.py makemigrations --empty store
```

#### 2. Data Migration Example

```python
# store/migrations/0003_populate_categories.py
from django.db import migrations

def populate_categories(apps, schema_editor):
    """Populate initial category data."""
    Category = apps.get_model('store', 'Category')
    categories = [
        {'name': 'Electronics', 'slug': 'electronics'},
        {'name': 'Books', 'slug': 'books'},
        {'name': 'Clothing', 'slug': 'clothing'},
    ]
    
    for category_data in categories:
        Category.objects.get_or_create(**category_data)

def reverse_populate_categories(apps, schema_editor):
    """Reverse the category population."""
    Category = apps.get_model('store', 'Category')
    Category.objects.filter(
        slug__in=['electronics', 'books', 'clothing']
    ).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('store', '0002_category_slug'),
    ]
    
    operations = [
        migrations.RunPython(
            populate_categories,
            reverse_populate_categories
        ),
    ]
```

### Testing Guidelines

#### 1. Test Structure

```python
import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

# Use pytest for unit tests
@pytest.mark.django_db
class TestProductModel:
    """Test Product model functionality."""
    
    def test_product_str_representation(self):
        """Test string representation of Product."""
        category = Category.objects.create(name="Electronics")
        product = Product.objects.create(
            sku="TEST-001",
            name="Test Product",
            category=category,
            price=Decimal("99.99")
        )
        assert str(product) == "Test Product (TEST-001)"
    
    def test_product_clean_validation(self):
        """Test product clean method validation."""
        category = Category.objects.create(name="Electronics")
        product = Product(
            sku="TEST-001",
            name="Test Product",
            category=category,
            price=Decimal("99.99"),
            sale_price=Decimal("199.99")  # Invalid: sale_price > price
        )
        
        with pytest.raises(ValidationError):
            product.clean()

# Use APITestCase for API tests
class ProductAPITest(APITestCase):
    """Test Product API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass'
        )
        self.category = Category.objects.create(name="Electronics")
        self.product = Product.objects.create(
            sku="TEST-001",
            name="Test Product",
            category=self.category,
            price=Decimal("99.99")
        )
    
    def test_list_products_unauthenticated(self):
        """Test listing products without authentication."""
        url = '/api/products/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_product_authenticated(self):
        """Test creating product with authentication."""
        self.client.force_authenticate(user=self.user)
        url = '/api/products/'
        data = {
            'sku': 'TEST-002',
            'name': 'Another Test Product',
            'category': self.category.id,
            'price': '149.99'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['sku'], 'TEST-002')
```

#### 2. Test Configuration

```python
# pytest.ini
[tool:pytest]
DJANGO_SETTINGS_MODULE = sil_project.settings
python_files = tests.py test_*.py *_tests.py
addopts = 
    --verbose
    --strict-markers
    --strict-config
    --cov=store
    --cov-report=term-missing
    --cov-report=html
    --cov-fail-under=90
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

#### 3. Test Fixtures

```python
# conftest.py
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from store.models import Category, Product

@pytest.fixture
def api_client():
    """Return API client instance."""
    return APIClient()

@pytest.fixture
@pytest.mark.django_db
def user():
    """Create test user."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

@pytest.fixture
@pytest.mark.django_db
def authenticated_client(api_client, user):
    """Return authenticated API client."""
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
@pytest.mark.django_db
def sample_category():
    """Create sample category."""
    return Category.objects.create(
        name="Electronics",
        slug="electronics"
    )

@pytest.fixture
@pytest.mark.django_db
def sample_product(sample_category):
    """Create sample product."""
    return Product.objects.create(
        sku="TEST-001",
        name="Test Product",
        category=sample_category,
        price=Decimal("99.99")
    )
```

### Git Workflow

#### 1. Branch Naming Convention

```bash
# Feature branches
feature/product-image-upload
feature/order-notifications

# Bug fix branches
bugfix/cart-total-calculation
hotfix/critical-security-fix

# Release branches
release/v1.2.0
```

#### 2. Commit Message Format

```
type(scope): brief description

Detailed explanation of the changes made. Wrap at 72 characters.
Include motivation for the change and contrast with previous behavior.

Closes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Example:**
```
feat(orders): add order notification system

Implement asynchronous order notifications via Celery tasks.
Supports both SMS and email notifications with configurable
preferences per order.

- Add Celery tasks for SMS and email sending
- Integrate with Africa's Talking SMS service
- Add notification status tracking
- Include notification preferences in order model

Closes #45
```

#### 3. Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "feat: implement new feature"
   ```

3. **Push Branch**
   ```bash
   git push origin feature/new-feature
   ```

4. **Create Pull Request**
   - Use descriptive title and description
   - Reference related issues
   - Include testing instructions
   - Add appropriate labels

5. **Code Review Process**
   - At least one reviewer required
   - Address all review comments
   - Ensure CI/CD pipeline passes
   - Update documentation if needed

6. **Merge Strategy**
   - Use "Squash and merge" for feature branches
   - Use "Merge commit" for release branches
   - Delete feature branch after merge

### Development Tools

#### 1. Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
  
  - repo: https://github.com/psf/black
    rev: 23.1.0
    hooks:
      - id: black
        language_version: python3.8
  
  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
  
  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
```

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```

#### 2. Code Formatting

```bash
# Format code with black
black .

# Sort imports with isort
isort .

# Check code style with flake8
flake8 .

# Run all formatting tools
make format  # if Makefile is configured
```

#### 3. IDE Configuration

**VS Code settings.json:**
```json
{
    "python.formatting.provider": "black",
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "python.linting.pylintEnabled": false,
    "python.sortImports.args": ["--profile", "black"],
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": true
    }
}
```

### Debugging

#### 1. Django Debug Toolbar

```python
# settings.py (development)
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1']
```

#### 2. Logging Configuration

```python
# Development logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'store': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

#### 3. Using pdb for Debugging

```python
import pdb; pdb.set_trace()  # Set breakpoint

# Or use ipdb for better interface
import ipdb; ipdb.set_trace()
```

### Performance Monitoring

#### 1. Django Silk (Development)

```python
# settings.py
INSTALLED_APPS += ['silk']
MIDDLEWARE += ['silk.middleware.SilkyMiddleware']

# Access profiling at /silk/
```

#### 2. Query Analysis

```python
# Enable query logging
LOGGING['loggers']['django.db.backends']['level'] = 'DEBUG'

# Use django-debug-toolbar to analyze queries
# Use django-extensions for additional debugging tools
INSTALLED_APPS += ['django_extensions']
```

This development guide provides comprehensive instructions for setting up and maintaining the development environment while following best practices for code quality, testing, and collaboration.
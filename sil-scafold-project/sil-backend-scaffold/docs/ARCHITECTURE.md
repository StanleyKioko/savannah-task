# Architecture Overview

This document provides a comprehensive overview of the SIL E-commerce Backend architecture, design patterns, and technical decisions.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Load Balancer │    │   API Gateway   │
│   (React/Vue)   │◄──►│   (Nginx)       │◄──►│   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                              ┌─────────────────────────┼─────────────────────────┐
                              │                         │                         │
                              ▼                         ▼                         ▼
                    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
                    │   Django App    │    │   Django App    │    │   Django App    │
                    │   Instance 1    │    │   Instance 2    │    │   Instance N    │
                    └─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │                         │
                              └─────────────────────────┼─────────────────────────┘
                                                        │
                              ┌─────────────────────────┴─────────────────────────┐
                              │                                                   │
                              ▼                                                   ▼
                    ┌─────────────────┐                                ┌─────────────────┐
                    │   PostgreSQL    │                                │      Redis      │
                    │   (Primary DB)  │                                │  (Cache/Queue)  │
                    └─────────────────┘                                └─────────────────┘
                              │                                                   │
                    ┌─────────────────┐                                ┌─────────────────┐
                    │   PostgreSQL    │                                │   Celery Beat   │
                    │   (Read Replica)│                                │   (Scheduler)   │
                    └─────────────────┘                                └─────────────────┘
                                                                                  │
                                                                        ┌─────────────────┐
                                                                        │  Celery Workers │
                                                                        │  (Background)   │
                                                                        └─────────────────┘
```

### Component Overview

#### 1. Web Layer
- **Django Application**: Core business logic and API endpoints
- **Load Balancer**: Distributes traffic across multiple app instances
- **Static File Server**: Serves static assets and media files

#### 2. Application Layer
- **REST API**: Primary interface using Django REST Framework
- **GraphQL API**: Alternative query interface using Strawberry
- **Authentication**: OIDC integration with external identity providers
- **Authorization**: Role-based access control (RBAC)

#### 3. Background Processing
- **Celery Workers**: Handle asynchronous tasks
- **Celery Beat**: Scheduled task execution
- **Task Queue**: Redis-based message broker

#### 4. Data Layer
- **PostgreSQL**: Primary relational database
- **Redis**: Caching and session storage
- **File Storage**: Media file storage (local/cloud)

#### 5. External Services
- **OIDC Provider**: Keycloak for authentication
- **Email Service**: SMTP for notifications
- **SMS Service**: Africa's Talking for SMS notifications
- **Monitoring**: Application and infrastructure monitoring

## Design Patterns

### 1. Repository Pattern

**Purpose**: Encapsulate data access logic and provide a consistent interface.

```python
# store/repositories.py
from abc import ABC, abstractmethod
from typing import List, Optional
from django.db.models import QuerySet
from .models import Product, Category

class ProductRepository(ABC):
    @abstractmethod
    def get_by_id(self, product_id: int) -> Optional[Product]:
        pass
    
    @abstractmethod
    def get_by_category(self, category: Category) -> QuerySet[Product]:
        pass
    
    @abstractmethod
    def search(self, query: str) -> QuerySet[Product]:
        pass

class DjangoProductRepository(ProductRepository):
    def get_by_id(self, product_id: int) -> Optional[Product]:
        try:
            return Product.objects.select_related('category').get(id=product_id)
        except Product.DoesNotExist:
            return None
    
    def get_by_category(self, category: Category) -> QuerySet[Product]:
        return Product.objects.filter(category__in=category.get_descendants(include_self=True))
    
    def search(self, query: str) -> QuerySet[Product]:
        return Product.objects.filter(
            models.Q(name__icontains=query) | 
            models.Q(description__icontains=query)
        )
```

### 2. Service Layer Pattern

**Purpose**: Encapsulate business logic and coordinate between repositories.

```python
# store/services.py
from typing import Dict, List
from .repositories import ProductRepository
from .models import Order, Customer
from .tasks import send_order_notifications

class OrderService:
    def __init__(self, product_repository: ProductRepository):
        self.product_repository = product_repository
    
    def create_order(self, customer: Customer, order_data: Dict) -> Order:
        # Validate products exist and are available
        for item in order_data['items']:
            product = self.product_repository.get_by_id(item['product'])
            if not product or not product.in_stock:
                raise ValueError(f"Product {item['product']} not available")
        
        # Create order
        order = Order.objects.create(
            customer=customer,
            total_amount=self._calculate_total(order_data['items'])
        )
        
        # Create order items
        self._create_order_items(order, order_data['items'])
        
        # Schedule notifications
        send_order_notifications.delay(order.id)
        
        return order
    
    def _calculate_total(self, items: List[Dict]) -> Decimal:
        total = Decimal('0.00')
        for item in items:
            total += Decimal(str(item['unit_price'])) * item['qty']
        return total
```

### 3. Factory Pattern

**Purpose**: Create objects without specifying their concrete classes.

```python
# store/factories.py
from .services import OrderService, NotificationService
from .repositories import DjangoProductRepository

class ServiceFactory:
    @staticmethod
    def create_order_service() -> OrderService:
        product_repo = DjangoProductRepository()
        return OrderService(product_repo)
    
    @staticmethod
    def create_notification_service() -> NotificationService:
        return NotificationService()
```

### 4. Observer Pattern

**Purpose**: Define a subscription mechanism for event notifications.

```python
# store/events.py
from typing import List, Callable
from django.dispatch import Signal

# Custom signals
order_created = Signal()
order_status_changed = Signal()

class EventPublisher:
    def __init__(self):
        self.subscribers: List[Callable] = []
    
    def subscribe(self, callback: Callable):
        self.subscribers.append(callback)
    
    def notify(self, event_data):
        for callback in self.subscribers:
            callback(event_data)

# Usage in views
from django.dispatch import receiver

@receiver(order_created)
def handle_order_created(sender, order, **kwargs):
    # Trigger notifications
    send_order_notifications.delay(order.id)
    
    # Update analytics
    update_order_analytics.delay(order.id)
```

## Data Models

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Category     │     │     Product     │     │   OrderItem     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄──┐ │ id (PK)         │   ┌─│ id (PK)         │
│ name            │   │ │ sku             │   │ │ order_id (FK)   │
│ slug            │   │ │ name            │   │ │ product_id (FK) │
│ parent_id (FK)  │   └─│ category_id (FK)│   │ │ quantity        │
│ lft, rght, lvl  │     │ price           │   │ │ unit_price      │
└─────────────────┘     │ sale_price      │   │ └─────────────────┘
                        │ description     │   │
                        │ image           │   │
                        │ in_stock        │   │
                        │ stock_quantity  │   │
                        └─────────────────┘   │
                                              │
┌─────────────────┐     ┌─────────────────┐   │
│    Customer     │     │      Order      │   │
├─────────────────┤     ├─────────────────┤   │
│ id (PK)         │   ┌─│ id (PK)         │───┘
│ external_id     │   │ │ customer_id (FK)│
│ first_name      │   │ │ order_number    │
│ last_name       │   │ │ status          │
│ email           │   │ │ total_amount    │
│ phone           │   │ │ shipping_addr   │
│ created_at      │   │ │ notifications   │
└─────────────────┘   │ │ created_at      │
                      │ │ updated_at      │
                      │ └─────────────────┘
                      │
┌─────────────────┐   │
│   ShoppingCart  │   │
├─────────────────┤   │
│ id (PK)         │   │
│ customer_id (FK)│───┘
│ created_at      │
│ updated_at      │
└─────────────────┘
        │
        │ ┌─────────────────┐
        └─│   CartItem      │
          ├─────────────────┤
          │ id (PK)         │
          │ cart_id (FK)    │
          │ product_id (FK) │
          │ quantity        │
          │ added_at        │
          └─────────────────┘
```

### Model Design Principles

#### 1. Single Responsibility
Each model has a single, well-defined purpose:
- `Product`: Manages product information
- `Category`: Handles hierarchical categorization
- `Order`: Manages order lifecycle
- `Customer`: Handles customer data

#### 2. Normalization
- Third Normal Form (3NF) compliance
- Elimination of data redundancy
- Proper foreign key relationships

#### 3. Audit Trail
```python
class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
```

#### 4. Soft Deletion
```python
class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class SoftDeleteModel(BaseModel):
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    objects = SoftDeleteManager()
    all_objects = models.Manager()
    
    def delete(self):
        self.deleted_at = timezone.now()
        self.save()
```

## API Design

### RESTful Principles

#### 1. Resource-Based URLs
```
GET    /api/products/           # List products
POST   /api/products/           # Create product
GET    /api/products/{id}/      # Get product
PUT    /api/products/{id}/      # Update product
DELETE /api/products/{id}/      # Delete product
```

#### 2. HTTP Status Codes
- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

#### 3. Consistent Response Format
```json
{
  "data": {
    "id": 1,
    "name": "Product Name",
    "price": "99.99"
  },
  "meta": {
    "timestamp": "2024-01-01T10:00:00Z",
    "request_id": "req_123456"
  }
}
```

#### 4. Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field_name": ["Error message"]
    }
  },
  "meta": {
    "timestamp": "2024-01-01T10:00:00Z",
    "request_id": "req_123456"
  }
}
```

### GraphQL Schema Design

#### 1. Type Definitions
```graphql
type Product {
  id: ID!
  sku: String!
  name: String!
  description: String
  category: Category!
  price: Decimal!
  salePrice: Decimal
  image: String
  inStock: Boolean!
  stockQuantity: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Category {
  id: ID!
  name: String!
  slug: String!
  parent: Category
  children: [Category!]!
  products(limit: Int, offset: Int): [Product!]!
  productCount: Int!
}
```

#### 2. Query Optimization
```python
# Use DataLoader to prevent N+1 queries
from strawberry.dataloader import DataLoader

async def load_categories(keys: List[int]) -> List[Category]:
    categories = Category.objects.filter(id__in=keys)
    return [next(c for c in categories if c.id == key) for key in keys]

category_loader = DataLoader(load_fn=load_categories)

@strawberry.type
class Product:
    @strawberry.field
    async def category(self) -> Category:
        return await category_loader.load(self.category_id)
```

## Security Architecture

### Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Keycloak   │    │  Database   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. Login Request │                  │                  │
       ├─────────────────►│                  │                  │
       │                  │                  │                  │
       │                  │ 2. Redirect to   │                  │
       │                  │    Keycloak      │                  │
       │                  ├─────────────────►│                  │
       │                  │                  │                  │
       │ 3. User Authentication                │                  │
       ├──────────────────┼─────────────────►│                  │
       │                  │                  │                  │
       │                  │ 4. Auth Code     │                  │
       │◄─────────────────┼──────────────────┤                  │
       │                  │                  │                  │
       │ 5. Exchange Code │                  │                  │
       ├─────────────────►│                  │                  │
       │                  │                  │                  │
       │                  │ 6. Get Tokens    │                  │
       │                  ├─────────────────►│                  │
       │                  │                  │                  │
       │                  │ 7. JWT Tokens    │                  │
       │                  │◄─────────────────┤                  │
       │                  │                  │                  │
       │ 8. JWT Response  │                  │                  │
       │◄─────────────────┤                  │                  │
       │                  │                  │                  │
       │ 9. API Request   │                  │                  │
       │    with JWT      │                  │                  │
       ├─────────────────►│                  │                  │
       │                  │                  │                  │
       │                  │ 10. Validate JWT │                  │
       │                  ├─────────────────►│                  │
       │                  │                  │                  │
       │                  │ 11. JWT Valid    │                  │
       │                  │◄─────────────────┤                  │
       │                  │                  │                  │
       │                  │ 12. Database     │                  │
       │                  │     Query        │                  │
       │                  ├──────────────────┼─────────────────►│
       │                  │                  │                  │
       │                  │ 13. Query Result │                  │
       │                  │◄─────────────────┼──────────────────┤
       │                  │                  │                  │
       │ 14. API Response │                  │                  │
       │◄─────────────────┤                  │                  │
```

### Authorization Layers

#### 1. Authentication Middleware
```python
class OIDCAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        self.process_request(request)
        response = self.get_response(request)
        return response
    
    def process_request(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:]
            try:
                user = self.authenticate_token(token)
                request.user = user
            except InvalidTokenError:
                request.user = AnonymousUser()
```

#### 2. Permission Classes
```python
class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.customer == request.user.customer

class IsCustomerOnly(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'customer')
        )
```

#### 3. Role-Based Access Control
```python
class RoleBasedPermission(BasePermission):
    required_roles = []
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        user_roles = self.get_user_roles(request.user)
        return any(role in user_roles for role in self.required_roles)
    
    def get_user_roles(self, user):
        # Extract roles from JWT token
        token_payload = getattr(user, 'token_payload', {})
        return token_payload.get('realm_access', {}).get('roles', [])

class AdminOnlyPermission(RoleBasedPermission):
    required_roles = ['admin']

class CustomerPermission(RoleBasedPermission):
    required_roles = ['customer', 'admin']
```

## Caching Strategy

### Multi-Level Caching

#### 1. Application-Level Caching
```python
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from functools import wraps

def cached_view(timeout=300):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            cache_key = f"view:{request.path}:{hash(frozenset(request.GET.items()))}"
            result = cache.get(cache_key)
            if result is None:
                result = view_func(request, *args, **kwargs)
                cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator
```

#### 2. Database Query Caching
```python
def cached_db_query(cache_key, timeout=900):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = cache.get(cache_key)
            if result is None:
                result = func(*args, **kwargs)
                cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator

@cached_db_query('products:featured', timeout=1800)
def get_featured_products():
    return Product.objects.filter(featured=True).select_related('category')
```

#### 3. Cache Invalidation Strategy
```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=Product)
@receiver(post_delete, sender=Product)
def invalidate_product_cache(sender, instance, **kwargs):
    cache_keys = [
        f'product:{instance.id}',
        f'products:category:{instance.category_id}',
        'products:featured',
        'products:recent'
    ]
    cache.delete_many(cache_keys)
```

## Performance Optimization

### Database Optimization

#### 1. Query Optimization
```python
# Use select_related for ForeignKey relationships
products = Product.objects.select_related('category').all()

# Use prefetch_related for ManyToMany and reverse ForeignKey
categories = Category.objects.prefetch_related('products').all()

# Use only() to limit fields
products = Product.objects.only('id', 'name', 'price').all()

# Use defer() to exclude fields
products = Product.objects.defer('description').all()
```

#### 2. Database Indexing
```python
class Product(models.Model):
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=300, db_index=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['category', 'price']),
            models.Index(fields=['created_at']),
            models.Index(fields=['name', 'category']),
        ]
```

#### 3. Connection Pooling
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sil_db',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'MIN_CONNS': 2,
        },
    }
}
```

### Application Performance

#### 1. Async Views
```python
import asyncio
from django.http import JsonResponse
from asgiref.sync import sync_to_async

async def async_product_list(request):
    products = await sync_to_async(list)(
        Product.objects.select_related('category').all()
    )
    
    data = await asyncio.gather(*[
        sync_to_async(serialize_product)(product)
        for product in products
    ])
    
    return JsonResponse({'products': data})
```

#### 2. Response Compression
```python
# settings.py
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    # other middleware
]

# Custom compression for API responses
from django.middleware.gzip import GZipMiddleware

class APIGZipMiddleware(GZipMiddleware):
    def should_compress(self, response):
        if response.get('Content-Type', '').startswith('application/json'):
            return True
        return super().should_compress(response)
```

## Error Handling and Logging

### Error Handling Strategy

#### 1. Global Exception Handler
```python
from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'error': {
                'code': getattr(exc, 'default_code', 'unknown_error'),
                'message': str(exc),
                'details': response.data
            },
            'meta': {
                'timestamp': timezone.now().isoformat(),
                'request_id': context['request'].META.get('REQUEST_ID')
            }
        }
        
        # Log error details
        logger.error(f"API Error: {exc}", extra={
            'request_id': context['request'].META.get('REQUEST_ID'),
            'user': getattr(context['request'], 'user', None),
            'path': context['request'].path,
            'method': context['request'].method
        })
        
        response.data = custom_response_data
    
    return response
```

#### 2. Custom Exception Classes
```python
class SILBackendException(Exception):
    default_code = 'sil_backend_error'
    default_message = 'An error occurred'
    
    def __init__(self, message=None, code=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        super().__init__(self.message)

class ProductNotAvailableException(SILBackendException):
    default_code = 'product_not_available'
    default_message = 'Product is not available for purchase'

class InsufficientStockException(SILBackendException):
    default_code = 'insufficient_stock'
    default_message = 'Insufficient stock for requested quantity'
```

### Logging Configuration

#### 1. Structured Logging
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'json_log_formatter.JSONFormatter',
        },
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        'file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/error.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
        },
    },
    'loggers': {
        'sil_project': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'store': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

#### 2. Request Logging Middleware
```python
import uuid
import time
import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        request.META['REQUEST_ID'] = str(uuid.uuid4())
        start_time = time.time()
        
        # Log request
        logger.info("Request started", extra={
            'request_id': request.META['REQUEST_ID'],
            'method': request.method,
            'path': request.path,
            'user': getattr(request, 'user', None),
            'ip': self.get_client_ip(request)
        })
        
        response = self.get_response(request)
        
        # Log response
        duration = time.time() - start_time
        logger.info("Request completed", extra={
            'request_id': request.META['REQUEST_ID'],
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2)
        })
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
```

## Testing Strategy

### Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← Few, high-level
                    │   (Selenium)    │
                    └─────────────────┘
                  ┌─────────────────────┐
                  │ Integration Tests   │  ← Some, API level
                  │   (API Tests)       │
                  └─────────────────────┘
              ┌─────────────────────────────┐
              │      Unit Tests             │  ← Many, fast
              │  (Models, Services, Utils)  │
              └─────────────────────────────┘
```

#### 1. Unit Tests
```python
# tests/test_services.py
import pytest
from decimal import Decimal
from store.services import OrderService
from store.models import Customer, Product, Category

@pytest.mark.django_db
class TestOrderService:
    def setup_method(self):
        self.category = Category.objects.create(name="Electronics")
        self.product = Product.objects.create(
            sku="TEST-001",
            name="Test Product",
            category=self.category,
            price=Decimal("99.99"),
            in_stock=True,
            stock_quantity=10
        )
        self.customer = Customer.objects.create(
            external_id="test-customer",
            email="test@example.com"
        )
        self.order_service = OrderService()
    
    def test_create_order_success(self):
        order_data = {
            'items': [
                {'product': self.product.id, 'qty': 2, 'unit_price': '99.99'}
            ]
        }
        
        order = self.order_service.create_order(self.customer, order_data)
        
        assert order.customer == self.customer
        assert order.total_amount == Decimal("199.98")
        assert order.items.count() == 1
    
    def test_create_order_insufficient_stock(self):
        order_data = {
            'items': [
                {'product': self.product.id, 'qty': 20, 'unit_price': '99.99'}
            ]
        }
        
        with pytest.raises(InsufficientStockException):
            self.order_service.create_order(self.customer, order_data)
```

#### 2. Integration Tests
```python
# tests/test_api.py
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse

@pytest.mark.django_db
class TestProductAPI:
    def setup_method(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Electronics")
        self.product = Product.objects.create(
            sku="TEST-001",
            name="Test Product",
            category=self.category,
            price=Decimal("99.99")
        )
    
    def test_list_products(self):
        url = reverse('product-list')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['sku'] == 'TEST-001'
    
    def test_create_order_authenticated(self, authenticated_client):
        url = reverse('order-list')
        data = {
            'customer_name': 'John Doe',
            'customer_email': 'john@example.com',
            'items': [
                {'product': self.product.id, 'qty': 1, 'unit_price': '99.99'}
            ]
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['total_amount'] == '99.99'
```

This architecture documentation provides a comprehensive overview of the system design, patterns used, and technical decisions that ensure scalability, maintainability, and performance.
# API Reference

This document provides detailed information about all available API endpoints.

## Base URL

Development: `http://localhost:8000`
Production: `https://your-domain.com`

## Authentication

All authenticated endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## REST API Endpoints

### Products

#### List Products
```http
GET /api/products/
```

**Response:**
```json
[
  {
    "id": 1,
    "sku": "PROD-001",
    "name": "Product Name",
    "description": "Product description",
    "category": {
      "id": 1,
      "name": "Category Name"
    },
    "price": "99.99",
    "sale_price": "79.99",
    "image": "/media/products/image.jpg",
    "in_stock": true,
    "stock_quantity": 50
  }
]
```

#### Get Product Details
```http
GET /api/products/{id}/
```

#### Upload Products (CSV)
```http
POST /api/products/upload/
Content-Type: multipart/form-data
```

**Request Body:**
```
file: products.csv
```

**CSV Format:**
```csv
sku,name,description,category_id,price,sale_price
PROD-001,Product Name,Description,1,99.99,79.99
```

### Categories

#### List Categories
```http
GET /api/categories/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Electronics",
    "slug": "electronics",
    "parent": null,
    "children": [
      {
        "id": 2,
        "name": "Smartphones",
        "slug": "smartphones",
        "parent": 1
      }
    ]
  }
]
```

#### Get Category Average Price
```http
GET /api/categories/{id}/average-price/
```

**Response:**
```json
{
  "category_id": 1,
  "average_price": "299.99",
  "product_count": 15
}
```

### Orders

#### Create Order
```http
POST /api/orders/
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "shipping_address": "123 Main St, City, Country",
  "preferred_date": "2024-01-15",
  "preferred_time": "morning",
  "notifications": {
    "sms": true,
    "email": true
  },
  "items": [
    {
      "product": 1,
      "qty": 2,
      "unit_price": "99.99"
    }
  ]
}
```

**Response:**
```json
{
  "id": 123,
  "order_number": "ORD-2024-001",
  "status": "pending",
  "total_amount": "199.98",
  "created_at": "2024-01-01T10:00:00Z",
  "items": [
    {
      "product": {
        "id": 1,
        "name": "Product Name"
      },
      "quantity": 2,
      "unit_price": "99.99",
      "total": "199.98"
    }
  ]
}
```

#### Get Order Details
```http
GET /api/orders/{id}/
Authorization: Bearer <token>
```

#### Get Order Notification Status
```http
GET /api/orders/{id}/notifications/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "order_id": 123,
  "sms": {
    "status": "sent",
    "sent_at": "2024-01-01T10:05:00Z"
  },
  "email": {
    "status": "sent",
    "sent_at": "2024-01-01T10:05:00Z"
  }
}
```

### Customer Management

#### Get Customer Profile
```http
GET /api/customers/profile/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "external_id": "keycloak-user-id",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Update Customer Profile
```http
PUT /api/customers/profile/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

### Shopping Cart

#### Get Cart
```http
GET /api/cart/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "customer": 1,
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "Product Name",
        "price": "99.99"
      },
      "quantity": 2,
      "added_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total_items": 2,
  "total_amount": "199.98"
}
```

#### Add Item to Cart
```http
POST /api/cart/add/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/items/{id}/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "quantity": 3
}
```

#### Remove Cart Item
```http
DELETE /api/cart/items/{id}/
Authorization: Bearer <token>
```

### Wishlist

#### Get Wishlist
```http
GET /api/wishlist/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "Product Name",
        "price": "99.99",
        "image": "/media/products/image.jpg"
      },
      "added_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### Add Item to Wishlist
```http
POST /api/wishlist/add/
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "product_id": 1
}
```

#### Remove from Wishlist
```http
DELETE /api/wishlist/items/{id}/
Authorization: Bearer <token>
```

## GraphQL API

### Endpoint
```
POST /api/graphql/
Content-Type: application/json
```

### Schema Overview

#### Types

**Product**
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
}
```

**Category**
```graphql
type Category {
  id: ID!
  name: String!
  slug: String!
  parent: Category
  children: [Category!]!
  products: [Product!]!
}
```

**Order**
```graphql
type Order {
  id: ID!
  orderNumber: String!
  customer: Customer!
  status: String!
  totalAmount: Decimal!
  items: [OrderItem!]!
  createdAt: DateTime!
}
```

#### Queries

**Get Products**
```graphql
query GetProducts($limit: Int, $offset: Int) {
  products(limit: $limit, offset: $offset) {
    id
    name
    price
    category {
      name
    }
  }
}
```

**Get Categories**
```graphql
query GetCategories {
  categories {
    id
    name
    children {
      id
      name
    }
  }
}
```

**Get Product by ID**
```graphql
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    name
    description
    price
    salePrice
    category {
      name
    }
  }
}
```

#### Mutations

**Create Order**
```graphql
mutation CreateOrder($input: OrderInput!) {
  createOrder(input: $input) {
    id
    orderNumber
    totalAmount
    status
  }
}
```

## Error Handling

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field_name": ["Error message for this field"]
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_REQUIRED` - Valid token required
- `PERMISSION_DENIED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource does not exist
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour
- Upload endpoints: 10 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642680000
```

## Pagination

List endpoints support pagination using query parameters:

```http
GET /api/products/?limit=20&offset=40
```

**Parameters:**
- `limit` - Number of items per page (default: 20, max: 100)
- `offset` - Number of items to skip

**Response includes pagination metadata:**
```json
{
  "count": 150,
  "next": "http://api.example.com/products/?limit=20&offset=40",
  "previous": "http://api.example.com/products/?limit=20&offset=0",
  "results": [...]
}
```

## Filtering and Searching

### Product Filtering

```http
GET /api/products/?category=1&price_min=10&price_max=100&search=keyword
```

**Available filters:**
- `category` - Filter by category ID
- `price_min` - Minimum price
- `price_max` - Maximum price
- `search` - Search in name and description
- `in_stock` - Filter by stock availability

### Order Filtering

```http
GET /api/orders/?status=pending&date_from=2024-01-01&date_to=2024-01-31
```

**Available filters:**
- `status` - Order status
- `date_from` - Orders created after date
- `date_to` - Orders created before date

## Webhook Integration

### Order Status Webhooks

Configure webhook URLs to receive notifications when order status changes:

```json
{
  "event": "order.status_changed",
  "order_id": 123,
  "old_status": "pending",
  "new_status": "confirmed",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### Webhook Security

Webhooks include HMAC signature for verification:
```
X-Webhook-Signature: sha256=<signature>
```
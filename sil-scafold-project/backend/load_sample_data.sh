#!/bin/bash
# Load sample data using Django's shell

docker-compose exec web python manage.py shell -c "
from store.models import Category, Product
import random

# Create categories
electronics, _ = Category.objects.get_or_create(name='Electronics')
clothing, _ = Category.objects.get_or_create(name='Clothing')
books, _ = Category.objects.get_or_create(name='Books')
home, _ = Category.objects.get_or_create(name='Home & Kitchen')

# Create subcategories
phones, _ = Category.objects.get_or_create(name='Phones', parent=electronics)
laptops, _ = Category.objects.get_or_create(name='Laptops', parent=electronics)
men, _ = Category.objects.get_or_create(name='Men', parent=clothing)
women, _ = Category.objects.get_or_create(name='Women', parent=clothing)
fiction, _ = Category.objects.get_or_create(name='Fiction', parent=books)
nonfiction, _ = Category.objects.get_or_create(name='Non-Fiction', parent=books)

# Create products
products = [
    # Electronics
    {'sku': 'P001', 'name': 'Smartphone X', 'price': 699.99, 'category': phones},
    {'sku': 'P002', 'name': 'Laptop Pro', 'price': 1299.99, 'category': laptops},
    {'sku': 'P003', 'name': 'Wireless Earbuds', 'price': 129.99, 'category': electronics},
    {'sku': 'P004', 'name': 'Smart Watch', 'price': 249.99, 'category': electronics},
    
    # Clothing
    {'sku': 'C001', 'name': 'T-Shirt', 'price': 19.99, 'category': men},
    {'sku': 'C002', 'name': 'Jeans', 'price': 49.99, 'category': men},
    {'sku': 'C003', 'name': 'Dress', 'price': 59.99, 'category': women},
    {'sku': 'C004', 'name': 'Sweater', 'price': 39.99, 'category': women},
    
    # Books
    {'sku': 'B001', 'name': 'The Great Novel', 'price': 14.99, 'category': fiction},
    {'sku': 'B002', 'name': 'Science Book', 'price': 24.99, 'category': nonfiction},
    {'sku': 'B003', 'name': 'Mystery Thriller', 'price': 12.99, 'category': fiction},
    {'sku': 'B004', 'name': 'Biography', 'price': 19.99, 'category': nonfiction},
    
    # Home & Kitchen
    {'sku': 'H001', 'name': 'Coffee Maker', 'price': 89.99, 'category': home},
    {'sku': 'H002', 'name': 'Toaster', 'price': 29.99, 'category': home},
    {'sku': 'H003', 'name': 'Blender', 'price': 69.99, 'category': home},
    {'sku': 'H004', 'name': 'Microwave', 'price': 149.99, 'category': home},
]

# Add the products to the database
for product_data in products:
    Product.objects.update_or_create(
        sku=product_data['sku'],
        defaults={
            'name': product_data['name'],
            'price': product_data['price'],
            'category': product_data['category']
        }
    )

print(f'Added {len(products)} products to the database')
"
import pytest
from django.test import TestCase
from store.models import Category, Product
from decimal import Decimal

class CategoryProductTest(TestCase):
    def test_category_hierarchy_and_average(self):
        root = Category.objects.create(name='All Products')
        bakery = Category.objects.create(name='Bakery', parent=root)
        bread = Category.objects.create(name='Bread', parent=bakery)
        p1 = Product.objects.create(sku='B1', name='Bun', price=Decimal('10.00'), category=bread)
        p2 = Product.objects.create(sku='B2', name='Roll', price=Decimal('20.00'), category=bread)
        descendants = list(bakery.get_descendants(include_self=True))
        self.assertIn(bread, descendants)

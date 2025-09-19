from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from store.models import Category, Product, Customer
from decimal import Decimal
import io, csv

class APITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Customer.objects.create(external_id='test-sub', first_name='A', last_name='B', email='a@b.com', phone='+254700000000')
        self.client.force_authenticate(user=self.user)
    def test_upload_products_csv(self):
        url = reverse('product-upload')
        csv_content = "sku,name,price,category_path\nP1,Apple,12.50,All Products/Produce/Fruits\n"
        response = self.client.post(url, {'file': io.BytesIO(csv_content.encode())}, format='multipart')
        assert response.status_code == 200
        assert response.data['created'] == 1
    def test_average_price(self):
        root = Category.objects.create(name='All Products')
        cat = Category.objects.create(name='Fruits', parent=root)
        Product.objects.create(sku='FP1', name='Mango', price=Decimal('50.00'), category=cat)
        url = reverse('category-average', kwargs={'pk': root.pk})
        response = self.client.get(url)
        assert response.status_code == 200
        assert float(response.data['average_price']) == 50.0

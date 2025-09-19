import pytest
import json
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from store.models import Order, Customer, Category, Product, OrderItem

@pytest.mark.django_db
class TestOrderNotificationAPI:
    
    @pytest.fixture
    def api_client(self):
        """Create an API client for testing."""
        return APIClient()
    
    @pytest.fixture
    def auth_api_client(self):
        """Create an authenticated API client for testing."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        client = APIClient()
        client.force_authenticate(user=user)
        return client, user
    
    @pytest.fixture
    def sample_order(self, auth_api_client):
        """Create a sample order for testing."""
        _, user = auth_api_client
        
        customer = Customer.objects.create(
            external_id=str(user.id),
            first_name='Test',
            last_name='User',
            email='test@example.com',
            phone='+1234567890'
        )
        
        
        root_category = Category.objects.create(name='All Products')
        
        product = Product.objects.create(
            sku='TEST123',
            name='Test Product',
            price=100.00,
            category=root_category
        )
        
        
        product2 = Product.objects.create(
            sku='TEST456',
            name='Another Test Product',
            price=50.00,
            category=root_category
        )
        
        order = Order.objects.create(
            customer=customer,
            total=150.00,
            status='created'
        )
        
        OrderItem.objects.create(
            order=order,
            product=product,
            qty=1,
            unit_price=100.00
        )
        
        OrderItem.objects.create(
            order=order,
            product=product2,
            qty=1,
            unit_price=50.00
        )
        
        return order
    
    def test_order_notification_status_view_unauthorized(self, api_client, sample_order):
        """Test that unauthorized users cannot access the notification status endpoint."""
        url = reverse('order-notifications', args=[sample_order.id])
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_order_notification_status_view_authorized(self, auth_api_client, sample_order):
        """Test that authorized users can access the notification status endpoint."""
        client, _ = auth_api_client
        url = reverse('order-notifications', args=[sample_order.id])
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'sms' in data
        assert 'email' in data
        assert isinstance(data['sms'], bool)
        assert isinstance(data['email'], bool)
    
    def test_order_notification_status_view_not_found(self, auth_api_client):
        """Test 404 response for non-existent orders."""
        client, _ = auth_api_client
        url = reverse('order-notifications', args=[99999])  # Non-existent order ID
        response = client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_order_notification_status_view_wrong_user(self, auth_api_client, sample_order):
        """Test that users cannot access notification status for orders they don't own."""
        # Create a new user
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='otherpassword'
        )
        
        client = APIClient()
        client.force_authenticate(user=other_user)
        
        url = reverse('order-notifications', args=[sample_order.id])
        response = client.get(url)
        
        # Should be forbidden since this order belongs to a different user
        assert response.status_code == status.HTTP_403_FORBIDDEN
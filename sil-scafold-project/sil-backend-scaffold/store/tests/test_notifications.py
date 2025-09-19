import pytest
import time
from unittest.mock import patch, MagicMock, call
from django.test import TestCase
from django.utils import timezone
from store.tasks import send_sms_notification, send_email_notification, send_order_notifications
from store.models import Order, Customer, Product, OrderItem, Category

@pytest.mark.django_db
class TestNotifications:
    
    @pytest.fixture
    def sample_order(self):
        """Create a sample order for testing."""
        customer = Customer.objects.create(
            external_id='test-123',
            first_name='Test',
            last_name='User',
            email='test@example.com',
            phone='+1234567890'
        )
        
        # Create a root category
        root_category = Category.objects.create(name='All Products')
        
        product = Product.objects.create(
            sku='TEST123',
            name='Test Product',
            description='A test product',
            price=100.00,
            category=root_category
        )
        
        # Create a second product for testing multiple items
        product2 = Product.objects.create(
            sku='TEST456',
            name='Another Test Product',
            description='Another test product',
            price=50.00,
            category=root_category
        )
        
        order = Order.objects.create(
            customer=customer,
            total=150.00,
            status='created',
            created_at=timezone.now()
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
    
    @patch('africastalking.initialize')
    @patch('africastalking.SMS')
    def test_send_sms_notification_success(self, mock_sms, mock_initialize, sample_order):
        """Test successful SMS notification."""
        # Mock the SMS service
        mock_sms_instance = MagicMock()
        mock_sms_instance.send.return_value = {
            'SMSMessageData': {
                'Recipients': [
                    {
                        'number': '+1234567890',
                        'status': 'Success',
                        'messageId': 'test-message-id'
                    }
                ]
            }
        }
        mock_sms.return_value = mock_sms_instance
        
        # Set environment variables
        with patch.dict('os.environ', {
            'AFRICASTALKING_USERNAME': 'sandbox',
            'AFRICASTALKING_API_KEY': 'test-key',
            'AFRICASTALKING_SANDBOX': 'True',
            'STORE_PHONE_NUMBER': '+1234567890'
        }):
            # Call the function
            with patch('store.tasks.logger') as mock_logger:
                result = send_sms_notification(sample_order)
            
            # Verify the result
            assert result is True
            mock_initialize.assert_called_with('sandbox', 'test-key')
            mock_sms_instance.send.assert_called_once()
            mock_logger.info.assert_any_call(
                f"Using Africa's Talking sandbox mode for order {sample_order.id}"
            )
            mock_logger.info.assert_any_call(
                f"SMS notification sent for order {sample_order.id} to +1234567890"
            )
    
    @patch('africastalking.initialize')
    @patch('africastalking.SMS')
    def test_send_sms_notification_production_mode(self, mock_sms, mock_initialize, sample_order):
        """Test SMS notification in production mode."""
        # Mock the SMS service
        mock_sms_instance = MagicMock()
        mock_sms_instance.send.return_value = {
            'SMSMessageData': {
                'Recipients': [
                    {
                        'number': '+1234567890',
                        'status': 'Success',
                        'messageId': 'test-message-id'
                    }
                ]
            }
        }
        mock_sms.return_value = mock_sms_instance
        
        # Set environment variables for production mode
        with patch.dict('os.environ', {
            'AFRICASTALKING_USERNAME': 'mycompany',
            'AFRICASTALKING_API_KEY': 'prod-key',
            'AFRICASTALKING_SANDBOX': 'False',
            'STORE_PHONE_NUMBER': '+1234567890'
        }):
            # Call the function
            with patch('store.tasks.logger') as mock_logger:
                result = send_sms_notification(sample_order)
            
            # Verify production initialization
            assert result is True
            mock_initialize.assert_called_with('mycompany', 'prod-key')
            mock_logger.info.assert_any_call(
                f"Using Africa's Talking production mode for order {sample_order.id}"
            )
            
            # Verify sender_id was included in production mode
            _, kwargs = mock_sms_instance.send.call_args
            assert kwargs.get('sender_id') == '+1234567890'
    
    @patch('africastalking.initialize')
    @patch('africastalking.SMS')
    def test_send_sms_notification_failure(self, mock_sms, mock_initialize, sample_order):
        """Test SMS notification failure."""
        # Mock the SMS service to raise an exception
        mock_sms_instance = MagicMock()
        mock_sms_instance.send.side_effect = Exception("SMS service error")
        mock_sms.return_value = mock_sms_instance
        
        # Set environment variables
        with patch.dict('os.environ', {
            'AFRICASTALKING_USERNAME': 'sandbox',
            'AFRICASTALKING_API_KEY': 'test-key',
            'STORE_PHONE_NUMBER': '+1234567890'
        }):
            # Call the function
            with patch('store.tasks.logger') as mock_logger:
                result = send_sms_notification(sample_order)
            
            # Verify the result
            assert result is False
            mock_logger.exception.assert_called_with(
                f"Failed to send SMS for order {sample_order.id}: SMS service error"
            )
    
    @patch('africastalking.initialize')
    @patch('africastalking.SMS')
    def test_send_sms_notification_api_failure(self, mock_sms, mock_initialize, sample_order):
        """Test SMS notification API failure response."""
        # Mock the SMS service with a failed status
        mock_sms_instance = MagicMock()
        mock_sms_instance.send.return_value = {
            'SMSMessageData': {
                'Recipients': [
                    {
                        'number': '+1234567890',
                        'status': 'Failed',
                        'statusCode': 403,
                        'messageId': None
                    }
                ]
            }
        }
        mock_sms.return_value = mock_sms_instance
        
        # Set environment variables
        with patch.dict('os.environ', {
            'AFRICASTALKING_USERNAME': 'sandbox',
            'AFRICASTALKING_API_KEY': 'test-key'
        }):
            # Call the function
            with patch('store.tasks.logger') as mock_logger:
                result = send_sms_notification(sample_order)
            
            # Verify the result
            assert result is False
            mock_logger.warning.assert_called()
    
    @patch('django.core.mail.send_mail')
    def test_send_email_notification_success(self, mock_send_mail, sample_order):
        """Test successful email notification."""
        mock_send_mail.return_value = 1  # 1 message sent
        
        # Set environment variables
        with patch.dict('os.environ', {
            'ADMIN_EMAIL': 'admin@example.com',
            'DEFAULT_FROM_EMAIL': 'noreply@example.com'
        }):
            # Call the function
            with patch('store.tasks.logger') as mock_logger:
                result = send_email_notification(sample_order)
            
            # Verify the result
            assert result is True
            mock_send_mail.assert_called_once()
            mock_logger.info.assert_called_with(
                f"Email notification sent for order {sample_order.id} to admin@example.com"
            )
            
            # Verify the subject contains order ID and customer name
            subject = mock_send_mail.call_args[0][0]
            assert f"New Order #{sample_order.id}" in subject
            assert "Test User" in subject
    
    @patch('django.core.mail.send_mail')
    def test_send_email_notification_failure(self, mock_send_mail, sample_order):
        """Test email notification failure."""
        # Mock send_mail to raise an exception
        mock_send_mail.side_effect = Exception("Email service error")
        
        # Set environment variables
        with patch.dict('os.environ', {
            'ADMIN_EMAIL': 'admin@example.com',
            'DEFAULT_FROM_EMAIL': 'noreply@example.com'
        }):
            # Call the function
            with patch('store.tasks.logger') as mock_logger:
                result = send_email_notification(sample_order)
            
            # Verify the result
            assert result is False
            mock_logger.exception.assert_called_with(
                f"Failed to send email for order {sample_order.id}: Email service error"
            )
    
    @patch('store.tasks.send_sms_notification')
    @patch('store.tasks.send_email_notification')
    def test_send_order_notifications_success(self, mock_email, mock_sms, sample_order):
        """Test the combined notification function with all successes."""
        # Set up mocks
        mock_sms.return_value = True
        mock_email.return_value = True
        
        # Call the function
        with patch('store.tasks.logger') as mock_logger:
            result = send_order_notifications(sample_order.id)
        
        # Verify the result
        assert result == {'sms': True, 'email': True}
        mock_sms.assert_called_once_with(sample_order)
        mock_email.assert_called_once_with(sample_order)
        mock_logger.info.assert_any_call(f"Starting order notification task for order_id={sample_order.id}")
    
    @patch('store.tasks.send_sms_notification')
    @patch('store.tasks.send_email_notification')
    def test_send_order_notifications_partial_failure(self, mock_email, mock_sms, sample_order):
        """Test when one notification type fails."""
        # Set up mocks
        mock_sms.return_value = False
        mock_email.return_value = True
        
        # Call the function
        with patch('store.tasks.logger') as mock_logger:
            result = send_order_notifications(sample_order.id)
        
        # Verify the result
        assert result == {'sms': False, 'email': True}
        mock_logger.info.assert_any_call(f"Order notifications for order {sample_order.id}: SMS=False, Email=True")
    
    @patch('store.tasks.logger')
    def test_send_order_notifications_invalid_order(self, mock_logger):
        """Test with an invalid order ID."""
        # Call the function with an invalid order ID
        result = send_order_notifications(999999)  # Non-existent order ID
        
        # Verify the result
        assert result == {'sms': False, 'email': False, 'error': 'Order not found'}
        mock_logger.error.assert_called_with("Order with ID 999999 not found")
    
    @patch('store.tasks.logger')
    @patch('africastalking.initialize')
    def test_send_sms_missing_credentials(self, mock_initialize, mock_logger, sample_order):
        """Test SMS notification with missing credentials."""
        # Set up empty environment
        with patch.dict('os.environ', {}, clear=True):
            # Call the function
            result = send_sms_notification(sample_order)
            
            # Verify the result
            assert result is False
            mock_logger.warning.assert_called_with(
                "Africa's Talking credentials not configured. Skipping SMS notification."
            )
            mock_initialize.assert_not_called()
    
    def test_send_sms_customer_no_phone(self, sample_order):
        """Test SMS notification when customer has no phone."""
        # Remove customer phone
        sample_order.customer.phone = ''
        sample_order.customer.save()
        
        # Set environment variables
        with patch.dict('os.environ', {
            'AFRICASTALKING_USERNAME': 'sandbox',
            'AFRICASTALKING_API_KEY': 'test-key'
        }):
            # Call the function
            with patch('store.tasks.logger') as mock_logger:
                result = send_sms_notification(sample_order)
            
            # Verify the result
            assert result is False
            mock_logger.warning.assert_called_with(
                f"Customer for order {sample_order.id} has no phone number. Skipping SMS."
            )
    
    @patch('store.tasks.AT_AVAILABLE', False)
    def test_send_sms_sdk_not_available(self, sample_order):
        """Test SMS notification when Africa's Talking SDK is not available."""
        # Set environment variables
        with patch.dict('os.environ', {
            'AFRICASTALKING_USERNAME': 'sandbox',
            'AFRICASTALKING_API_KEY': 'test-key'
        }):
            # Call the function
            with patch('store.tasks.logger') as mock_logger:
                result = send_sms_notification(sample_order)
            
            # Verify the result
            assert result is False
            mock_logger.warning.assert_called_with(
                "Africa's Talking SDK not available. Skipping SMS notification."
            )
    
    @patch('store.tasks.get_order_items_text')
    def test_email_notification_content(self, mock_get_items, sample_order):
        """Test the content of email notifications."""
        # Mock the items text
        mock_get_items.return_value = "• Test Product: 1 x $100.00 = $100.00\n• Another Test Product: 1 x $50.00 = $50.00\n"
        
        # Set environment variables
        with patch.dict('os.environ', {
            'ADMIN_EMAIL': 'admin@example.com',
            'DEFAULT_FROM_EMAIL': 'noreply@example.com'
        }):
            # Mock send_mail to capture the content
            with patch('django.core.mail.send_mail') as mock_send_mail:
                send_email_notification(sample_order)
                
                # Verify email content
                subject = mock_send_mail.call_args[0][0]
                body = mock_send_mail.call_args[0][1]
                from_email = mock_send_mail.call_args[0][2]
                recipients = mock_send_mail.call_args[0][3]
                
                # Check subject formatting
                assert f"New Order #{sample_order.id}" in subject
                assert "Test User" in subject
                
                # Check body content
                assert "Customer Information:" in body
                assert "Test User" in body
                assert "test@example.com" in body
                assert "+1234567890" in body
                assert f"${sample_order.total:.2f}" in body
                assert sample_order.status in body
                assert "Items:" in body
                assert "Test Product" in body
                assert "Another Test Product" in body
                assert "This is an automated notification" in body
                
                # Check email addressing
                assert from_email == 'noreply@example.com'
                assert recipients == ['admin@example.com']
    
    def test_get_order_items_text_with_items(self, sample_order):
        """Test formatting order items text with multiple items."""
        from store.tasks import get_order_items_text
        
        # Get the formatted text
        text = get_order_items_text(sample_order)
        
        # Verify formatting
        assert "• Test Product:" in text
        assert "• Another Test Product:" in text
        assert "$100.00" in text
        assert "$50.00" in text
    
    def test_get_order_items_text_no_items(self):
        """Test formatting order items text with no items."""
        from store.tasks import get_order_items_text
        
        # Create order with no items
        customer = Customer.objects.create(
            external_id='test-no-items',
            first_name='No',
            last_name='Items',
            email='no@items.com'
        )
        
        order = Order.objects.create(
            customer=customer,
            total=0.00,
            status='created'
        )
        
        # Get the formatted text
        text = get_order_items_text(order)
        
        # Verify message for no items
        assert "No items found in this order" in text
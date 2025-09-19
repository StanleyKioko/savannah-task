import pytest
import time
from unittest.mock import patch, MagicMock, ANY
from django.test import TestCase
from celery.result import AsyncResult
from celery.exceptions import Retry
from celery.contrib.testing.worker import start_worker

from store.models import Order, Customer, Product, OrderItem, Category
from store.tasks import send_order_notifications
from sil_project.celery_app import app as celery_app

@pytest.mark.django_db
class TestCeleryIntegration:
    
    @pytest.fixture
    def sample_order(self):
        customer = Customer.objects.create(
            external_id='test-123',
            first_name='Test',
            last_name='User',
            email='test@example.com',
            phone='+1234567890'
        )
        
        
        category = Category.objects.create(
            name='Test Category',
            parent=None
        )
        
        product = Product.objects.create(
            sku='TEST001',
            name='Test Product',
            description='A test product',
            price=100.00,
            category=category
        )
        order = Order.objects.create(
            customer=customer,
            total=100.00,
            status='created'
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            qty=1,
            unit_price=100.00
        )
        return order
    
    @pytest.fixture
    def mock_celery(self):
        with patch('store.tasks.send_order_notifications.delay') as mock_delay:
            mock_task = MagicMock()
            mock_task.id = 'test-task-id'
            mock_delay.return_value = mock_task
            yield mock_delay
    
    @patch('store.tasks.send_sms_notification')
    @patch('store.tasks.send_email_notification')
    def test_task_execution(self, mock_email, mock_sms, sample_order):
        mock_sms.return_value = True
        mock_email.return_value = True
        
        result = send_order_notifications(sample_order.id)
        
        assert result == {'sms': True, 'email': True}
        mock_sms.assert_called_once_with(sample_order)
        mock_email.assert_called_once_with(sample_order)
    
    def test_task_delay(self, sample_order, mock_celery):
        task = send_order_notifications.delay(sample_order.id)
        
        mock_celery.assert_called_once_with(sample_order.id)
        assert task.id == 'test-task-id'
    
    @patch('celery.app.task.Task.apply_async')
    def test_celery_config(self, mock_apply_async):
        assert celery_app.conf.broker_url is not None
        
        assert 'store.tasks.send_order_notifications' in celery_app.tasks
        
        mock_task_id = 'mocked-task-id'
        mock_apply_async.return_value = AsyncResult(mock_task_id)
        
        task = send_order_notifications.apply_async(
            args=[1],
            countdown=10
        )
        
        assert mock_apply_async.called
        assert task.id == mock_task_id
        
        args, kwargs = mock_apply_async.call_args
        assert kwargs['countdown'] == 10
    
    @patch('store.tasks.send_sms_notification')
    @patch('store.tasks.send_email_notification')
    def test_task_error_handling(self, mock_email, mock_sms, sample_order):
        mock_sms.return_value = False
        mock_email.return_value = True
        
        result = send_order_notifications(sample_order.id)
        
        assert result == {'sms': False, 'email': True}
        mock_sms.assert_called_once_with(sample_order)
        mock_email.assert_called_once_with(sample_order)
    
    @patch('store.tasks.logger')
    def test_task_with_nonexistent_order(self, mock_logger):
        non_existent_id = 999999
        
        result = send_order_notifications(non_existent_id)
        
        assert result == {'sms': False, 'email': False, 'error': 'Order not found'}
        mock_logger.error.assert_called_with(f"Order with ID {non_existent_id} not found")
    
    @patch('store.tasks.send_sms_notification')
    @patch('store.tasks.send_email_notification')
    @patch('store.tasks.logger')
    def test_task_retry_mechanism(self, mock_logger, mock_email, mock_sms):
        mock_sms.side_effect = Exception("Test exception")
        mock_email.return_value = True
        
        task_info = send_order_notifications.app.tasks['store.tasks.send_order_notifications']
        assert task_info.autoretry_for == (Exception,)
        assert task_info.retry_kwargs['max_retries'] == 3
        assert task_info.retry_kwargs['countdown'] == 60
        assert task_info.ignore_result is False
        assert task_info.acks_late is True
        
        with pytest.raises(Exception):
            send_order_notifications(1)
        
        mock_logger.exception.assert_called_once()
    
    @patch('store.tasks.Order.objects.get')
    def test_task_idempotency(self, mock_get, sample_order):
        mock_get.return_value = sample_order
        
        with patch('store.tasks.send_sms_notification', return_value=True) as mock_sms:
            with patch('store.tasks.send_email_notification', return_value=True) as mock_email:
                result1 = send_order_notifications(sample_order.id)
                result2 = send_order_notifications(sample_order.id)
                result3 = send_order_notifications(sample_order.id)
                
                assert result1 == result2 == result3 == {'sms': True, 'email': True}
                
                assert mock_sms.call_count == 3
                assert mock_email.call_count == 3
                
                for call in mock_sms.call_args_list:
                    assert call[0][0] == sample_order
                
                for call in mock_email.call_args_list:
                    assert call[0][0] == sample_order
    
    @patch('store.tasks.send_order_notifications.retry')
    @patch('store.tasks.send_sms_notification')
    def test_explicit_retry_on_transient_error(self, mock_sms, mock_retry, sample_order):
        mock_retry.side_effect = Retry()
        
        mock_sms.side_effect = Exception("Temporary network error")
        
        with patch('store.tasks.Order.objects.get', return_value=sample_order):
            with pytest.raises(Retry):  
                send_order_notifications(sample_order.id)
            
            mock_retry.assert_called_once()
    
    def test_task_registration(self):
        registered_tasks = celery_app.tasks
        
        assert 'store.tasks.send_order_notifications' in registered_tasks
        
        task = registered_tasks['store.tasks.send_order_notifications']
        assert task.name == 'store.tasks.send_order_notifications'
        assert hasattr(task, 'autoretry_for')
        assert hasattr(task, 'retry_kwargs')
    
    @patch('store.tasks.send_sms_notification')
    def test_race_condition_safety(self, mock_sms, sample_order):
        mock_sms.return_value = True
        
        with patch('store.tasks.send_email_notification', return_value=True) as mock_email:
            result = send_order_notifications(sample_order.id)
            assert result == {'sms': True, 'email': True}
            
            with patch('store.tasks.Order.objects.get', side_effect=Order.DoesNotExist):
                result = send_order_notifications(sample_order.id)
                assert result == {'sms': False, 'email': False, 'error': 'Order not found'}
                
                assert mock_sms.call_count == 1  
                assert mock_email.call_count == 1  
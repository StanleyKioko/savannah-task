import os
import logging
from decimal import Decimal
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from .models import Order

logger = logging.getLogger(__name__)

try:
    import africastalking
    AT_AVAILABLE = True
except ImportError:
    logger.warning("Africa's Talking SDK not available. SMS functionality will be disabled.")
    AT_AVAILABLE = False

@shared_task(bind=True)
def test_celery_task(self, message):
    logger.info(f"Test task received message: {message}")
    return f"Successfully processed: {message}"

@shared_task(
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3, 'countdown': 60},
    ignore_result=False,
    acks_late=True
)
def send_order_notifications(order_id):
    try:
        logger.info(f"Starting order notification task for order_id={order_id}")
        
        order = Order.objects.get(pk=order_id)
        
        results = {
            'sms': False,
            'email': False
        }
        
        if order.notifications_sms:
            results['sms'] = send_sms_notification(order)
        else:
            logger.info(f"SMS notifications disabled for order {order_id}")
            results['sms'] = None
            
        results['email'] = send_email_notification(order)
            
        logger.info(f"Order notifications for order {order_id}: SMS={results['sms']}, Email={results['email']}")
        return results
        
    except Order.DoesNotExist:
        logger.error(f"Order with ID {order_id} not found")
        return {'sms': False, 'email': False, 'error': 'Order not found'}
        
    except Exception as e:
        logger.error(f"Order notification task failed for order_id={order_id}: {str(e)}")
        raise

def send_sms_notification(order):
    if not AT_AVAILABLE:
        logger.warning("Africa's Talking SDK not available. Skipping SMS notification.")
        return False

    username = os.getenv('AFRICASTALKING_USERNAME')
    api_key = os.getenv('AFRICASTALKING_API_KEY')
    store_phone = os.getenv('STORE_PHONE_NUMBER')
    
    if not username or not api_key:
        logger.warning("Africa's Talking credentials not configured. Skipping SMS notification.")
        return False
    
    if not order.customer.phone:
        logger.warning(f"Customer for order {order.id} has no phone number. Skipping SMS.")
        return False
    
    try:
        
        use_sandbox = True
        sandbox_env = os.getenv('AFRICASTALKING_SANDBOX', 'True')
        if sandbox_env.lower() in ('false', '0', 'f', 'no', 'n'):
            use_sandbox = False
        
        if use_sandbox or username.lower() == 'sandbox':
            africastalking.initialize('sandbox', api_key)
            logger.info(f"Using Africa's Talking sandbox mode for order {order.id}")
        else:
            africastalking.initialize(username, api_key)
            logger.info(f"Using Africa's Talking production mode for order {order.id}")
        
        sms = africastalking.SMS
        
        items = order.items.all().select_related('product')
        items_count = items.count()
        
        order_date = order.created_at.strftime('%Y-%m-%d')
        
        message = f"""Thank you for your order #{order.id}!

Date: {order_date}
Items: {items_count} 
Total: ${order.total:.2f}
Status: {order.status.capitalize()}

Your order is being processed. We'll notify you when it ships.
Track your order at: estore.com/orders/{order.id}

Need help? Call: {store_phone or 'Customer Service'}
"""
        
        sender_id = None
        if store_phone and not use_sandbox:
            sender_id = store_phone
        
        response = sms.send(
            message=message, 
            recipients=[order.customer.phone],
            sender_id=sender_id
        )
        
        logger.debug(f"Africa's Talking response for order {order.id}: {response}")
        
        if response and 'SMSMessageData' in response and 'Recipients' in response['SMSMessageData']:
            recipients = response['SMSMessageData']['Recipients']
            if recipients and recipients[0].get('status') == 'Success':
                logger.info(f"SMS notification sent for order {order.id} to {order.customer.phone}")
                return True
            else:
                status = recipients[0].get('status', 'Unknown') if recipients else 'No recipients'
                logger.warning(f"SMS sending failed for order {order.id}: {status}")
                return False
        else:
            logger.warning(f"Invalid response from Africa's Talking for order {order.id}: {response}")
            return False
            
    except Exception as e:
        logger.exception(f"Failed to send SMS for order {order.id}: {str(e)}")
        return False

def send_email_notification(order):
    admin_email = os.getenv('ADMIN_EMAIL')
    from_email = os.getenv('DEFAULT_FROM_EMAIL')
    
    if not admin_email or not from_email:
        logger.warning("Email configuration missing. Skipping email notifications.")
        return False
    
    results = {'admin': False, 'customer': False}
    
    try:
        results['admin'] = send_admin_email(order, admin_email, from_email)
        
        if order.notifications_email and order.customer.email:
            results['customer'] = send_customer_email(order, from_email)
        else:
            if not order.notifications_email:
                logger.info(f"Customer email notifications disabled for order {order.id}")
            if not order.customer.email:
                logger.warning(f"Customer for order {order.id} has no email address")
        
        return any(results.values())
        
    except Exception as e:
        logger.exception(f"Failed to send email notifications for order {order.id}: {str(e)}")
        return False

def send_admin_email(order, admin_email, from_email):
    try:
        subject = f"New Order #{order.id} - {order.customer.first_name} {order.customer.last_name} - ${order.total:.2f}"
        
        order_date = order.created_at.strftime('%Y-%m-%d %H:%M:%S')
        
        items = order.items.all().select_related('product')
        item_count = items.count()
        total_quantity = sum(item.qty for item in items)
        
        body = f"""
NEW ORDER #{order.id} | {order_date}
======================================

💰 ORDER VALUE: ${order.total:.2f}
📦 ITEMS: {item_count} (Total Quantity: {total_quantity})
🔄 STATUS: {order.status.upper()}

CUSTOMER INFORMATION
-------------------
👤 Name: {order.customer.first_name} {order.customer.last_name}
📧 Email: {order.customer.email}
📱 Phone: {order.customer.phone or 'Not provided'}
📍 Address: {order.customer.address or 'Not provided'}

NOTIFICATION PREFERENCES
-----------------------
📧 Email: {'Yes' if order.notifications_email else 'No'}
📱 SMS: {'Yes' if order.notifications_sms else 'No'}

ORDER DETAILS
------------
Order Time: {order_date}
Total Amount: ${order.total:.2f}
Payment Status: Paid
Shipping Method: Standard Delivery

ORDERED ITEMS
------------
{get_order_items_text(order)}

ACTION REQUIRED
-------------
- Please verify this order in the admin panel
- Prepare the items for shipping
- Update the order status when processed

Admin URL: http://localhost:8000/admin/store/order/{order.id}/

This is an automated notification.
        """
        
        send_mail(
            subject,
            body,
            from_email,
            [admin_email],
            fail_silently=False
        )
        
        logger.info(f"Admin email notification sent for order {order.id} to {admin_email}")
        return True
    except Exception as e:
        logger.exception(f"Failed to send admin email for order {order.id}: {str(e)}")
        return False

def send_customer_email(order, from_email):
    try:
        subject = f"Order Confirmation #{order.id} - Thank you for your purchase!"
        
        order_date = order.created_at.strftime('%B %d, %Y at %I:%M %p')
        
        body = f"""
Dear {order.customer.first_name},

Thank you for your order! We've received your order and are preparing it for shipment.

ORDER SUMMARY
=============
Order Number: #{order.id}
Order Date: {order_date}
Total Amount: ${order.total:.2f}

YOUR ITEMS
----------
{get_customer_order_items_text(order)}

SHIPPING INFORMATION
-------------------
We'll send you tracking information once your order ships.
Expected delivery: 3-5 business days

NEED HELP?
----------
If you have any questions about your order, please contact us:
- Email: support@estore.com
- Phone: (555) 123-4567

Thank you for shopping with us!

Best regards,
The EStore Team

---
This is an automated message. Please do not reply to this email.
        """
        
        send_mail(
            subject,
            body,
            from_email,
            [order.customer.email],
            fail_silently=False
        )
        
        logger.info(f"Customer email confirmation sent for order {order.id} to {order.customer.email}")
        return True
    except Exception as e:
        logger.exception(f"Failed to send customer email for order {order.id}: {str(e)}")
        return False

def get_order_items_text(order):
    items_text = ""
    
    items = order.items.all().select_related('product')
    
    if not items:
        return "No items found in this order.\n"
    
    items_text += "ID | PRODUCT                    | QTY | PRICE     | SUBTOTAL\n"
    items_text += "---+--------------------------+-----+----------+----------\n"
    
    prod_width = 25
    
    for item in items:
        product_name = item.product.name
        if len(product_name) > prod_width - 3:
            product_name = product_name[:prod_width-3] + "..."
        else:
            product_name = product_name.ljust(prod_width)
        
        subtotal = item.qty * item.unit_price
        
        items_text += f"{item.product.id:<3} | {product_name} | {item.qty:^3} | ${item.unit_price:>8.2f} | ${subtotal:>8.2f}\n"
    
    items_text += "---+--------------------------+-----+----------+----------\n"
    items_text += f"TOTAL: ${order.total:.2f}\n\n"
        
    return items_text

def get_customer_order_items_text(order):
    items_text = ""
    
    items = order.items.all().select_related('product')
    
    if not items:
        return "No items found in this order.\n"
    
    for item in items:
        subtotal = item.qty * item.unit_price
        
        items_text += f"• {item.product.name}\n"
        items_text += f"  Quantity: {item.qty} × ${item.unit_price:.2f} = ${subtotal:.2f}\n\n"
    
    items_text += f"Order Total: ${order.total:.2f}\n"
        
    return items_text

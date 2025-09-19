import os
import sys
import django
from django.conf import settings

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sil_project.settings')
django.setup()

from store.models import Order, OrderItem, Customer, Product
from store.tasks import send_order_notifications
from decimal import Decimal

def create_test_customer():
    try:
        customer = Customer.objects.filter(email__contains='example.com').first()
        if customer:
            print(f"Using existing customer: {customer.first_name} {customer.last_name} ({customer.email})")
            return customer
            
        customer = Customer.objects.create(
            external_id='test-customer-123',
            first_name='Test',
            last_name='Customer',
            email='test@example.com',
            phone='+254700000000',
            address='123 Test Street, Test City'
        )
        print(f"Created new test customer: {customer.first_name} {customer.last_name}")
        return customer
    except Exception as e:
        print(f"Error creating test customer: {str(e)}")
        return None

def create_test_order(customer):
    try:
        order = Order.objects.create(
            customer=customer,
            status='created',
            total=Decimal('0.00')
        )
        
        products = Product.objects.all()[:3]
        
        if not products:
            print("No products found in database. Please add some products first.")
            order.delete()
            return None
            
        total = Decimal('0.00')
        for i, product in enumerate(products):
            qty = i + 1
            unit_price = product.price
            OrderItem.objects.create(
                order=order,
                product=product,
                qty=qty,
                unit_price=unit_price
            )
            total += unit_price * qty
            
        order.total = total
        order.save()
        
        print(f"Created test order #{order.id} with {len(products)} products, total: ${total:.2f}")
        return order
    except Exception as e:
        print(f"Error creating test order: {str(e)}")
        return None

def test_notifications():
    print("\n=== TESTING ORDER NOTIFICATIONS ===\n")
    
    customer = create_test_customer()
    if not customer:
        print("Failed to create or find a test customer. Aborting test.")
        return
        
    order = create_test_order(customer)
    if not order:
        print("Failed to create a test order. Aborting test.")
        return
    
    print("\nSending notifications for order...\n")
    
    try:
        results = send_order_notifications(order.id)
        print(f"Notification results: {results}")
        
        if results.get('sms'):
            print("\n✅ SMS notification sent successfully")
        else:
            print("\n❌ SMS notification failed")
            print("Check Africa's Talking configuration and ensure the SDK is installed.")
            print("SMS delivery might not work in sandbox mode to real phone numbers.")
        
        if results.get('email'):
            print("\n✅ Email notification sent successfully")
            print(f"Check the inbox of {os.getenv('ADMIN_EMAIL')} for the notification email.")
        else:
            print("\n❌ Email notification failed")
            print("Check your email configuration in .env file.")
    except Exception as e:
        print(f"\n❌ Error sending notifications: {str(e)}")
    
    print("\n=== TEST COMPLETED ===\n")

if __name__ == "__main__":
    test_notifications()
from rest_framework import serializers
from .models import Category, Product, Customer, Order, OrderItem, Wishlist

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id','name','parent')

class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = ('id','sku','name','description','price','sale_price','category','image','image_url','in_stock','stock_quantity')

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ('id','external_id','first_name','last_name','email','phone','address')

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('product','qty','unit_price')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    notifications = serializers.DictField(required=False, default=dict)
    
    customer_name = serializers.CharField(write_only=True, required=False)
    customer_email = serializers.EmailField(write_only=True, required=True)
    customer_phone = serializers.CharField(write_only=True, required=False)
    shipping_address = serializers.CharField(write_only=True, required=False)
    preferred_date = serializers.DateField(write_only=True, required=False)
    preferred_time = serializers.TimeField(write_only=True, required=False)
    
    class Meta:
        model = Order
        fields = ('id','customer','items','total','status','created_at','notifications_sms','notifications_email','notifications',
                 'customer_name','customer_email','customer_phone','shipping_address','preferred_date','preferred_time')
        read_only_fields = ('total','status','created_at')
    
    def create(self, validated_data):
        items = validated_data.pop('items')
        notifications = validated_data.pop('notifications', {})
        
        customer_name = validated_data.pop('customer_name', None)
        customer_email = validated_data.pop('customer_email', None)
        customer_phone = validated_data.pop('customer_phone', None)
        shipping_address = validated_data.pop('shipping_address', None)
        preferred_date = validated_data.pop('preferred_date', None)
        preferred_time = validated_data.pop('preferred_time', None)
        
        if not validated_data.get('customer') and customer_email:
            if customer_name:
                name_parts = customer_name.strip().split(' ', 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ''
            else:
                first_name = 'Customer'
                last_name = ''
            
            customer, created = Customer.objects.get_or_create(
                email=customer_email,
                defaults={
                    'external_id': f'guest_{customer_email}',
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': customer_phone or '',
                    'address': shipping_address or '',
                }
            )
            
            if not created:
                customer.phone = customer_phone or customer.phone
                customer.address = shipping_address or customer.address
                customer.save()
                
            validated_data['customer'] = customer
        
        notifications_sms = notifications.get('sms', True)
        notifications_email = notifications.get('email', True)
        
        validated_data['notifications_sms'] = notifications_sms
        validated_data['notifications_email'] = notifications_email
        validated_data['preferred_date'] = preferred_date
        validated_data['preferred_time'] = preferred_time
        
        order = Order.objects.create(**validated_data)
        total = 0
        for it in items:
            product = it['product']
            qty = it['qty']
            unit_price = it.get('unit_price', product.price)
            OrderItem.objects.create(order=order, product=product, qty=qty, unit_price=unit_price)
            total += unit_price * qty
        order.total = total
        order.save()
        return order

class OrderNotificationSerializer(serializers.Serializer):
    sms = serializers.BooleanField(default=False)
    email = serializers.BooleanField(default=True)

class OrderNotificationSerializer(serializers.Serializer):
    sms = serializers.BooleanField(default=False)
    email = serializers.BooleanField(default=False)

class WishlistSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ('id', 'customer', 'products', 'created_at', 'updated_at')
        read_only_fields = ('customer', 'created_at', 'updated_at')

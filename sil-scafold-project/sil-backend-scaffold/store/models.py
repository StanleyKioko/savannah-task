from django.db import models
from mptt.models import MPTTModel, TreeForeignKey
from decimal import Decimal

class Category(MPTTModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, blank=True)
    parent = TreeForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')

    class MPTTMeta:
        order_insertion_by = ['name']

    def __str__(self):
        return self.name

class Product(models.Model):
    sku = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True, null=True)
    category = TreeForeignKey(Category, related_name='products', on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    in_stock = models.BooleanField(default=True)
    stock_quantity = models.PositiveIntegerField(default=100)

    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None

class Customer(models.Model):
    external_id = models.CharField(max_length=200, unique=True)  # map to OIDC subject
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Order(models.Model):
    STATUS_CHOICES = [('created','created'),('processing','processing'),('completed','completed')]
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='created')
    
    # Delivery preferences
    preferred_date = models.DateField(null=True, blank=True, help_text='Customer preferred delivery date')
    preferred_time = models.TimeField(null=True, blank=True, help_text='Customer preferred delivery time')
    
    # Notification preferences
    notifications_sms = models.BooleanField(default=True, help_text='Customer wants SMS notifications')
    notifications_email = models.BooleanField(default=True, help_text='Customer wants email notifications')
    
    def __str__(self):
        return f"Order #{self.id} - {self.customer.first_name} {self.customer.last_name}"

class Wishlist(models.Model):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='wishlist')
    products = models.ManyToManyField(Product, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Wishlist for {self.customer.first_name} {self.customer.last_name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

from django.contrib import admin
from mptt.admin import MPTTModelAdmin
from .models import Category, Product, Customer, Order, OrderItem

admin.site.register(Category, MPTTModelAdmin)
admin.site.register(Product)
admin.site.register(Customer)
admin.site.register(Order)
admin.site.register(OrderItem)

import graphene
from graphene_django.types import DjangoObjectType
from .models import Category, Product, Order, OrderItem, Customer

class CategoryType(DjangoObjectType):
    class Meta:
        model = Category
        fields = "__all__"

class ProductType(DjangoObjectType):
    class Meta:
        model = Product
        fields = "__all__"

class CustomerType(DjangoObjectType):
    class Meta:
        model = Customer
        fields = "__all__"

class OrderItemType(DjangoObjectType):
    class Meta:
        model = OrderItem
        fields = "__all__"

class OrderType(DjangoObjectType):
    class Meta:
        model = Order
        fields = "__all__"

class Query(graphene.ObjectType):
    all_categories = graphene.List(CategoryType)
    category_by_id = graphene.Field(CategoryType, id=graphene.Int(required=True))
    category_average_price = graphene.Float(id=graphene.Int(required=True))

    all_products = graphene.List(ProductType)
    product_by_id = graphene.Field(ProductType, id=graphene.Int(required=True))
    
    all_orders = graphene.List(OrderType)
    order_by_id = graphene.Field(OrderType, id=graphene.Int(required=True))

    def resolve_all_categories(self, info):
        return Category.objects.all()

    def resolve_category_by_id(self, info, id):
        return Category.objects.get(pk=id)

    def resolve_category_average_price(self, info, id):
        category = Category.objects.get(pk=id)
        descendants = category.get_descendants(include_self=True)
        products = Product.objects.filter(category__in=descendants)
        
        if not products.exists():
            return 0
        
        total_price = sum(product.price for product in products)
        return total_price / products.count()

    def resolve_all_products(self, info):
        return Product.objects.all()

    def resolve_product_by_id(self, info, id):
        return Product.objects.get(pk=id)

    def resolve_all_orders(self, info):
        user = info.context.user
        if not user.is_authenticated:
            return Order.objects.none()
        
        if user.is_staff:
            return Order.objects.all()
        
        return Order.objects.filter(customer__user=user)

    def resolve_order_by_id(self, info, id):
        user = info.context.user
        if not user.is_authenticated:
            return None
        
        if user.is_staff:
            return Order.objects.get(pk=id)
        
        try:
            return Order.objects.get(pk=id, customer__user=user)
        except Order.DoesNotExist:
            return None

class OrderItemInput(graphene.InputObjectType):
    product_id = graphene.Int(required=True)
    quantity = graphene.Int(required=True)

class CreateOrder(graphene.Mutation):
    class Arguments:
        items = graphene.List(OrderItemInput, required=True)
        customer_name = graphene.String(required=True)
        customer_email = graphene.String(required=True)
        shipping_address = graphene.String(required=True)
        customer_phone = graphene.String(required=True)

    order = graphene.Field(OrderType)

    def mutate(self, info, items, customer_name, customer_email, shipping_address, customer_phone):
        user = info.context.user
        
        customer, created = Customer.objects.get_or_create(
            email=customer_email,
            defaults={
                'name': customer_name,
                'phone': customer_phone,
                'address': shipping_address,
                'user': user if user.is_authenticated else None
            }
        )
        
        order = Order.objects.create(
            customer=customer,
            shipping_address=shipping_address,
            status='pending'
        )
        
        for item_data in items:
            product = Product.objects.get(pk=item_data.product_id)
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item_data.quantity,
                price=product.price
            )
        
        return CreateOrder(order=order)

class Mutation(graphene.ObjectType):
    create_order = CreateOrder.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)
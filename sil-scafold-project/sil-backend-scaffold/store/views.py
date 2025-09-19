from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Category, Product, Customer, Order, Wishlist
from .serializers import ProductSerializer, OrderSerializer, WishlistSerializer
import csv, io
from django.db import transaction
from django.db.models import Avg, Count, Prefetch
from .tasks import send_order_notifications
from .cache import cached_view, cached_db_query
import logging

logger = logging.getLogger(__name__)

class ProductListView(APIView):
    """
    List all products
    """
    permission_classes = []  # Allow anonymous access for testing
    
    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

class CategoryListView(APIView):
    """
    List all categories
    """
    permission_classes = []  # Allow anonymous access for testing
    
    def get(self, request):
        categories = Category.objects.all()
        data = [{
            'id': cat.id,
            'name': cat.name,
            'slug': cat.slug,
            'parent': cat.parent_id,
            'product_count': cat.products.count(),
        } for cat in categories]
        return Response(data)

class ProductUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        '''
        Accepts CSV upload with rows: sku,name,price,category_path
        category_path example: "All Products/Produce/Fruits"
        '''
        file = request.FILES.get('file')
        if not file:
            return Response({'detail':'file required'}, status=status.HTTP_400_BAD_REQUEST)
        
        decoded = file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))
        created = 0
        errors = []
        
        for i, row in enumerate(reader, start=1):
            try:
                sku = row['sku']
                name = row['name']
                price = row['price']
                path = row.get('category_path', '')
                
                # Ensure category path exists
                parent = None
                for part in [p.strip() for p in path.split('/') if p.strip()]:
                    cat, _ = Category.objects.get_or_create(name=part, parent=parent)
                    parent = cat
                cat = parent
                
                if not cat:
                    # Create default root category if none specified
                    cat, _ = Category.objects.get_or_create(name='All Products')
                
                Product.objects.update_or_create(
                    sku=sku, 
                    defaults={
                        'name': name,
                        'price': price,
                        'category': cat
                    }
                )
                created += 1
            except Exception as e:
                logger.exception(f"Error processing product upload row {i}: {str(e)}")
                errors.append({'row': i, 'error': str(e)})
        
        return Response({
            'created': created,
            'errors': errors
        })

@cached_db_query(timeout=60*5)  # Cache for 5 minutes
def get_category_average_price(category_id):
    """
    Calculate average price for a category and its descendants.
    This function is cached to improve performance.
    """
    try:
        cat = Category.objects.get(pk=category_id)
        # Get all descendants including self
        cats = list(cat.get_descendants(include_self=True))
        
        # Calculate average price
        avg = Product.objects.filter(category__in=cats).aggregate(
            avg_price=Avg('price'),
            count=Count('id')
        )
        
        return {
            'category': cat.name,
            'average_price': avg['avg_price'] if avg['avg_price'] is not None else 0,
            'product_count': avg['count']
        }
    except Category.DoesNotExist:
        return None

class CategoryAveragePriceView(APIView):
    permission_classes = []  # Allow anonymous access for testing
    
    @cached_view(timeout=60*5)  # Cache for 5 minutes
    def get(self, request, pk):
        result = get_category_average_price(pk)
        if result is None:
            return Response({'detail': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(result)

class OrderCreateView(APIView):
    permission_classes = []  # Allow anonymous orders
    
    def post(self, request):
        print(f"Order data received: {request.data}")  # Debug logging
        serializer = OrderSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}")  # Debug logging
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            order = serializer.save()
        
        # Try to queue notifications via Celery
        notification_status = {'queued': False, 'sync': False}
        try:
            send_order_notifications.delay(order.id)
            notification_status['queued'] = True
            logger.info(f"Order {order.id} created and notifications queued")
        except Exception as e:
            logger.warning(f"Failed to queue notifications for order {order.id}: {str(e)}")
            logger.info(f"Attempting to send notifications synchronously for order {order.id}")
            
            # Fallback: try to send notifications synchronously
            try:
                from .tasks import send_order_notifications as send_notifications_sync
                results = send_notifications_sync(order.id)
                notification_status['sync'] = True
                logger.info(f"Order {order.id} notifications sent synchronously: {results}")
            except Exception as sync_error:
                logger.error(f"Failed to send notifications synchronously for order {order.id}: {str(sync_error)}")
        
        return Response({
            'id': order.id, 
            'notifications': notification_status
        }, status=status.HTTP_201_CREATED)

class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            # Use select_related to optimize DB queries
            order = Order.objects.select_related('customer').prefetch_related(
                Prefetch('items', queryset=Order.items.through.objects.select_related('product'))
            ).get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Ensure the user can only access their own orders
        if request.user.id != order.customer.id and not request.user.is_staff:
            return Response({'detail': 'Not authorized to view this order'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)

class OrderNotificationStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Ensure the user can only access their own orders
        if request.user.id != order.customer.id and not request.user.is_staff:
            return Response({'detail': 'Not authorized to view this order'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        from .serializers import OrderNotificationSerializer
        
        notification_status = {
            'sms': False,
            'email': True
        }
        
        try:
            import os
            log_file = os.path.join('logs', 'notification.log')
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    content = f.read()
                    # Check if there are SMS success entries for this order
                    if f"SMS notification sent for order {order.id}" in content:
                        notification_status['sms'] = True
                    # Check if there are email failures
                    if f"Failed to send email notification for order {order.id}" in content:
                        notification_status['email'] = False
        except Exception as e:
            logger.warning(f"Error checking notification log for order {order.id}: {str(e)}")
        
        serializer = OrderNotificationSerializer(notification_status)
        return Response(serializer.data)

class ProductImageUploadView(APIView):
    permission_classes = []  # Allow anonymous access for testing
    
    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Debug information
        print("FILES:", request.FILES)
        print("POST:", request.POST)
        print("Content-Type:", request.META.get('CONTENT_TYPE'))
        
        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'No image file provided', 'files': str(request.FILES)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete old image if it exists
        if product.image:
            product.image.delete()
        
        product.image = image
        product.save()
        
        return Response(ProductSerializer(product).data)


class WishlistView(APIView):
    permission_classes = []  # Allow anonymous access like cart

    def get(self, request):
        """Get or create wishlist for guest user"""
        # For demo purposes, we'll use session-based wishlists
        # In production, you'd tie this to authenticated users
        
        wishlist_data = request.session.get('wishlist', [])
        products = Product.objects.filter(id__in=wishlist_data)
        
        # Return in format expected by frontend
        return Response({
            'id': 'session_wishlist',
            'user': 'guest',
            'products': ProductSerializer(products, many=True).data,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z',
        })

    def post(self, request):
        """Add product to wishlist"""
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response({'error': 'product_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get current wishlist from session
        wishlist_data = request.session.get('wishlist', [])
        
        if product_id not in wishlist_data:
            wishlist_data.append(product_id)
            request.session['wishlist'] = wishlist_data
            request.session.modified = True
        
        # Return updated wishlist
        products = Product.objects.filter(id__in=wishlist_data)
        return Response({
            'id': 'session_wishlist',
            'user': 'guest',
            'products': ProductSerializer(products, many=True).data,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z',
        })


class WishlistRemoveView(APIView):
    permission_classes = []  # Allow anonymous access

    def delete(self, request, product_id):
        """Remove product from wishlist"""
        try:
            product_id = int(product_id)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid product_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get current wishlist from session
        wishlist_data = request.session.get('wishlist', [])
        
        if product_id in wishlist_data:
            wishlist_data.remove(product_id)
            request.session['wishlist'] = wishlist_data
            request.session.modified = True
        
        # Return updated wishlist
        products = Product.objects.filter(id__in=wishlist_data)
        return Response({
            'id': 'session_wishlist',
            'user': 'guest',
            'products': ProductSerializer(products, many=True).data,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z',
        })


class WishlistClearView(APIView):
    permission_classes = []  # Allow anonymous access

    def delete(self, request):
        """Clear entire wishlist"""
        request.session['wishlist'] = []
        request.session.modified = True
        
        return Response({
            'id': 'session_wishlist',
            'user': 'guest',
            'products': [],
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z',
        })

from django.urls import path
from . import views
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from . import jwt_auth
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', jwt_auth.LoginView.as_view(), name='auth-login'),
    path('auth/register/', jwt_auth.RegisterView.as_view(), name='auth-register'),
    path('auth/logout/', jwt_auth.LogoutView.as_view(), name='auth-logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/user/', jwt_auth.UserView.as_view(), name='auth-user'),
    
    # REST API endpoints
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/upload/', views.ProductUploadView.as_view(), name='product-upload'),
    path('products/<int:pk>/image/', views.ProductImageUploadView.as_view(), name='product-image-upload'),
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('categories/<int:pk>/average-price/', views.CategoryAveragePriceView.as_view(), name='category-average'),
    path('orders/', views.OrderCreateView.as_view(), name='order-create'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/notifications/', views.OrderNotificationStatusView.as_view(), name='order-notifications'),
    
    # Wishlist endpoints
    path('wishlist/', views.WishlistView.as_view(), name='wishlist'),
    path('wishlist/remove/<int:product_id>/', views.WishlistRemoveView.as_view(), name='wishlist-remove'),
    path('wishlist/clear/', views.WishlistClearView.as_view(), name='wishlist-clear'),
    
    # GraphQL endpoint
    path('graphql/', csrf_exempt(GraphQLView.as_view(graphiql=True)), name='graphql'),
]

from django.urls import path, include, re_path
from django.contrib import admin
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

def health_check(request):
    """
    Simple health check endpoint for Docker healthcheck and monitoring
    """
    return JsonResponse({
        'status': 'healthy',
        'message': 'SIL Backend API is running'
    })

# Schema view for Swagger documentation
schema_view = get_schema_view(
    openapi.Info(
        title="SIL Store API",
        default_version='v1',
        description="API for the SIL Store application",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('store.urls')),
    path('health/', health_check, name='health_check'),
    
    # Swagger documentation
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

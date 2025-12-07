from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView 

from events.views import EventViewSet, RegistrationViewSet, ReviewViewSet
from social.views import FriendshipViewSet, MessageViewSet
from events.views import CertificateViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'registrations', RegistrationViewSet)
router.register(r'friends', FriendshipViewSet) 
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'reviews', ReviewViewSet)
router.register(r'certificates', CertificateViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),

    # Api
    path('api/', include(router.urls)),

    # Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
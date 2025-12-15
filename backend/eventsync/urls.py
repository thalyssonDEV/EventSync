from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import UserUpdateView
from events.views import EventViewSet, EnrollmentViewSet, ReviewViewSet, CertificateViewSet
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'certificates', CertificateViewSet, basename='certificate')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
    path('auth/user/', UserUpdateView.as_view(), name='user_details'),
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
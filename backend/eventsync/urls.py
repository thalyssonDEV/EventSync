from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from events.views import EventViewSet, RegistrationViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'registrations', RegistrationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth Padrão (Login, Logout, Password Reset, Registration)
    # POST /auth/login/
    # POST /auth/registration/
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),

    # Endpoints do Projeto (Eventos, Inscrições)
    path('api/', include(router.urls)),
]
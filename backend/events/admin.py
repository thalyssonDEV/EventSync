from django.contrib import admin
from .models import Event, Registration, CheckIn, Review, Certificate

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'start_date', 'status', 'event_type', 'price')
    list_filter = ('status', 'event_type', 'requires_approval')
    search_fields = ('title', 'description', 'organizer__email')
    date_hierarchy = 'start_date'

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'status', 'created_at', 'checkins_count')
    list_filter = ('status', 'event')
    search_fields = ('user__email', 'event__title', 'id') # Dá pra buscar pelo ID do QR Code

@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ('registration', 'timestamp')
    list_filter = ('timestamp',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'rating', 'created_at')
    list_filter = ('rating',)

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'data_emissao')
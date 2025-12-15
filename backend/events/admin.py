from django.contrib import admin
from .models import Event, Enrollment, Review, Certificate

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    # Removi 'event_type' e coloquei 'status', que existe e é importante
    list_display = ('title', 'organizer', 'start_date', 'status')
    search_fields = ('title', 'description')
    list_filter = ('status',)

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    # Adicionei 'checked_in' para facilitar visualização
    list_display = ('user', 'event', 'status', 'created_at', 'checked_in')
    list_filter = ('status', 'event', 'checked_in')
    search_fields = ('user__email', 'event__title', 'id')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'rating', 'created_at')
    list_filter = ('rating',)

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'validation_code', 'issue_date')
    search_fields = ('user__email', 'validation_code')
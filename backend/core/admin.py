# backend/core/admin.py (CORRIGIDO)

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Adicionais', {'fields': ('role', 'city', 'xp', 'league', 'organizer_rating', 'photo')}), # <-- CAMPO CORRETO AGORA!
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'role', 'league')
    
admin.site.register(User, CustomUserAdmin)
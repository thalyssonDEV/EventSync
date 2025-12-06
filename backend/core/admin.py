from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    # Campos que aparecem na lista (tabela)
    list_display = ('email', 'username', 'role', 'xp', 'league', 'organizer_rating', 'is_staff')
    
    # Filtros laterais
    list_filter = ('role', 'league', 'is_staff', 'is_superuser')
    
    # Campos que podem ser pesquisados
    search_fields = ('email', 'username', 'first_name')
    
    # Organização do formulário de edição
    fieldsets = UserAdmin.fieldsets + (
        ('EventSync Info', {'fields': ('role', 'city', 'photo_url', 'is_participation_visible')}),
        ('Gamification', {'fields': ('xp', 'league', 'organizer_rating')}),
    )

admin.site.register(User, CustomUserAdmin)
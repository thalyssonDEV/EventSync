from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import Avg, Count
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        PARTICIPANT = 'PARTICIPANT', _('Participante')
        ORGANIZER = 'ORGANIZER', _('Organizador')

    # Login via Email
    email = models.EmailField(_('email address'), unique=True)
    
    # Campos do Projeto
    city = models.CharField(max_length=100, blank=True, null=True)
    photo_url = models.URLField(max_length=500, blank=True, null=True)
    is_participation_visible = models.BooleanField(default=True)
    organizer_rating = models.FloatField(default=0.0)
    
    # Sistema de Ranking (Gamification)
    xp = models.PositiveIntegerField(default=0)
    league = models.CharField(max_length=50, default="🌱 Novato")
    
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PARTICIPANT)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    # Lógica de Gamification
    def calculate_and_save_score(self):
        if self.role != self.Role.ORGANIZER:
            return

        # Pega stats de eventos FINALIZADOS
        stats = self.events_created.filter(status='FINISHED').aggregate(
            avg_rating=Avg('reviews__rating'),
            total_checkins=Count('registrations__checkins')
        )
        
        avg_rating = stats['avg_rating'] or 0
        total_checkins = stats['total_checkins'] or 0

        # Fórmula: (Nota * 100) + (Checkins * 5)
        new_xp = int((avg_rating * 100) + (total_checkins * 5))
        
        # Define Liga
        new_league = "🌱 Novato"
        if new_xp >= 2000: new_league = "👑 Lenda Viva"
        elif new_xp >= 800: new_league = "🌟 Celebridade"
        elif new_xp >= 200: new_league = "🔥 Agitador"

        if self.xp != new_xp or self.league != new_league:
            self.xp = new_xp
            self.league = new_league
            self.organizer_rating = round(avg_rating, 2)
            self.save(update_fields=['xp', 'league', 'organizer_rating'])


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.title}"
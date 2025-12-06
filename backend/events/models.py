from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import uuid

User = settings.AUTH_USER_MODEL

class Event(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Rascunho')
        PUBLISHED = 'PUBLISHED', _('Publicado')
        FINISHED = 'FINISHED', _('Finalizado') # Gatilho de XP
        CANCELED = 'CANCELED', _('Cancelado')

    # ADICIONADO AGORA: Tipo do evento (Gratuito/Pago)
    class EventType(models.TextChoices):
        FREE = 'FREE', _('Gratuito')
        PAID = 'PAID', _('Pago')

    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events_created')
    title = models.CharField(max_length=200)
    description = models.TextField()
    location_address = models.CharField(max_length=255)
    location_url = models.URLField(blank=True, null=True)
    
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # ADICIONADO O CAMPO QUE FALTAVA
    event_type = models.CharField(max_length=10, choices=EventType.choices, default=EventType.FREE)
    
    requires_approval = models.BooleanField(default=False)
    
    max_enrollments = models.PositiveIntegerField(null=True, blank=True)
    allowed_checkins = models.PositiveIntegerField(default=1)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    banner_url = models.URLField(blank=True, null=True)
    workload_hours = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    # Sobrescreve save para detectar finalização
    def save(self, *args, **kwargs):
        if self.pk:
            old = Event.objects.get(pk=self.pk)
            # Se mudou para FINALIZED
            if old.status != self.Status.FINISHED and self.status == self.Status.FINISHED:
                super().save(*args, **kwargs)
                self.organizer.calculate_and_save_score() # Calcula XP
                return
        super().save(*args, **kwargs)

class Registration(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pendente')
        APPROVED = 'APPROVED', _('Aprovada')
        REJECTED = 'REJECTED', _('Recusada')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    checkins_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('event', 'user')

class CheckIn(models.Model):
    registration = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='checkins')
    timestamp = models.DateTimeField(auto_now_add=True)

class Review(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalcula XP ao receber review
        self.event.organizer.calculate_and_save_score()


class Certificate(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    url_pdf = models.URLField()
    data_emissao = models.DateTimeField(auto_now_add=True)
    codigo_validacao = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"Certificado {self.user} - {self.event}"
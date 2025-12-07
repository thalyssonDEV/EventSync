from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import uuid

User = settings.AUTH_USER_MODEL

class Event(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Rascunho')
        PUBLISHED = 'PUBLISHED', _('Publicado')
        FINISHED = 'FINISHED', _('Finalizado') 
        CANCELED = 'CANCELED', _('Cancelado')

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
    event_type = models.CharField(max_length=10, choices=EventType.choices, default=EventType.FREE)
    requires_approval = models.BooleanField(default=False)
    
    max_enrollments = models.PositiveIntegerField(null=True, blank=True)
    allowed_checkins = models.PositiveIntegerField(default=1)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    banner_url = models.URLField(blank=True, null=True)
    workload_hours = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    is_inscriptions_open = models.BooleanField(default=False)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.pk:
            old = Event.objects.get(pk=self.pk)
            if old.status != self.Status.FINISHED and self.status == self.Status.FINISHED:
                super().save(*args, **kwargs)
                self.organizer.calculate_and_save_score()
                return
        super().save(*args, **kwargs)

class Registration(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pendente (Aprovação)')
        AWAITING_PAYMENT = 'AWAITING_PAYMENT', _('Aguardando Pagamento')
        APPROVED = 'APPROVED', _('Aprovada')
        REJECTED = 'REJECTED', _('Recusada')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    checkins_count = models.PositiveIntegerField(default=0)
    
    # Campo opcional para comprovante (Desafio PIX)
    payment_proof = models.URLField(null=True, blank=True)

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
        self.event.organizer.calculate_and_save_score()

class Certificate(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    url_pdf = models.URLField()
    data_emissao = models.DateTimeField(auto_now_add=True)
    codigo_validacao = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"Certificado {self.user} - {self.event}"
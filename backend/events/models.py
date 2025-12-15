from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = settings.AUTH_USER_MODEL

class Event(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Rascunho'
        PUBLISHED = 'PUBLISHED', 'Publicado' # Inscrições Abertas
        IN_PROGRESS = 'IN_PROGRESS', 'Em Andamento' # Check-ins liberados
        FINISHED = 'FINISHED', 'Finalizado' # Libera Avaliações e Certificados
        CANCELED = 'CANCELED', 'Cancelado'

    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events_created')
    title = models.CharField(max_length=200)
    description = models.TextField()
    location_address = models.CharField(max_length=255)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    
    # Configurações
    max_enrollments = models.PositiveIntegerField(null=True, blank=True)
    requires_approval = models.BooleanField(default=False) # Se True, inscrição nasce PENDENTE
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    banner = models.ImageField(upload_to='event_banners/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Enrollment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendente' # Aguardando aprovação do org
        APPROVED = 'APPROVED', 'Aprovada' # Confirmado, gera QR Code
        REJECTED = 'REJECTED', 'Recusada'
        CANCELED = 'CANCELED', 'Cancelada pelo usuário'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='enrollments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPROVED)
    
    # Controle de Presença
    checked_in = models.BooleanField(default=False)
    checkin_time = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'user')

class Review(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'user') # Usuário só avalia 1 vez por evento

class Certificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='certificates')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    issue_date = models.DateTimeField(auto_now_add=True)
    validation_code = models.CharField(max_length=50, unique=True) # Hash para validar

    def __str__(self):
        return f"Certificado {self.user} - {self.event}"
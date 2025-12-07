import uuid
from rest_framework import viewsets, permissions, decorators
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.files.storage import default_storage
from .models import Review
from .serializers import ReviewSerializer, UserSerializer
import serializers

from .models import Event, Registration, CheckIn, Certificate
from .serializers import EventSerializer, RegistrationSerializer
from .utils import generate_certificate_pdf


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-created_at')
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @decorators.action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        """Inscrição inteligente: trata Gratuito, Pago e Aprovação"""
        event = self.get_object()
        user = request.user

        if not event.is_inscriptions_open:
            return Response({"error": "As inscrições para este evento estão fechadas."}, status=400)

        if event.max_enrollments:
            current_count = Registration.objects.filter(event=event).count()
            if current_count >= event.max_enrollments:
                return Response({"error": "Vagas esgotadas."}, status=400)
        
        if Registration.objects.filter(event=event, user=user).exists():
            return Response({"error": "Já inscrito"}, status=400)
        
        initial_status = 'PENDING'
        
        if event.event_type == 'PAID':
            initial_status = 'AWAITING_PAYMENT'
        elif not event.requires_approval:
            initial_status = 'APPROVED'
            
        reg = Registration.objects.create(event=event, user=user, status=initial_status)
        
        response_data = RegistrationSerializer(reg).data
        if initial_status == 'AWAITING_PAYMENT':
            # Simulação de PIX
            response_data['payment_instruction'] = f"Chave PIX: {event.organizer.email} | Valor: R$ {event.price}"
            
        return Response(response_data)

    @decorators.action(detail=True, methods=['post'])
    def finish(self, request, pk=None):
        event = self.get_object()
        if request.user != event.organizer:
            return Response({"error": "Apenas o dono pode finalizar"}, status=403)
        
        event.status = Event.Status.FINISHED
        event.save() 
        return Response({"status": "Evento Finalizado! Certificados liberados."})

    @decorators.action(detail=True, methods=['post'])
    def checkin(self, request, pk=None):
        """Check-in via QR Code [cite: 2754]"""
        reg_id = request.data.get('registration_id')
        registration = get_object_or_404(Registration, id=reg_id, event_id=pk)
        
        if registration.status != 'APPROVED':
            return Response({"error": "Inscrição não confirmada"}, status=400)
            
        if registration.checkins_count >= registration.event.allowed_checkins:
            return Response({"error": "Limite de check-ins atingido"}, status=400)
            
        CheckIn.objects.create(registration=registration)
        registration.checkins_count += 1
        registration.save()
        
        return Response({
            "status": "Check-in Sucesso",
            "participant": registration.user.first_name,
            "total_checkins": registration.checkins_count
        })

    @decorators.action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Lista participantes públicos para a funcionalidade Social"""
        event = self.get_object()
        # Filtra apenas inscrições APROVADAS/CHECKIN de usuários que permitiram visibilidade
        public_registrations = Registration.objects.filter(
            event=event, 
            status__in=['APPROVED', 'CHECKIN'],
            user__is_participation_visible=True
        )
        
        # Queremos retornar dados dos usuários, não da inscrição em si
        users = [reg.user for reg in public_registrations]
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @decorators.action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Gera CSV para o organizador"""
        event = self.get_object()
        
        if request.user != event.organizer:
            return Response({"error": "Apenas o organizador pode exportar"}, status=403)
            
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="participantes_{event.id}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Nome', 'Email', 'Status', 'Data Inscrição', 'Check-ins'])

        registrations = Registration.objects.filter(event=event)
        for reg in registrations:
            writer.writerow([
                reg.user.get_full_name(),
                reg.user.email,
                reg.get_status_display(),
                reg.created_at.strftime("%d/%m/%Y %H:%M"),
                reg.checkins_count
            ])
    
    @decorators.action(detail=True, methods=['post'])
    def toggle_inscriptions(self, request, pk=None):
        """Abre ou fecha inscrições manualmente """
        event = self.get_object()
        if request.user != event.organizer:
            return Response({"error": "Não autorizado"}, status=403)
            
        event.is_inscriptions_open = not event.is_inscriptions_open
        event.save()
        
        status_msg = "Abertas" if event.is_inscriptions_open else "Fechadas"
        return Response({"status": f"Inscrições {status_msg}"})

        return response

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ORGANIZER':
            return Registration.objects.filter(event__organizer=user)
        return Registration.objects.filter(user=user)

    @decorators.action(detail=True, methods=['post'])
    def confirm_payment(self, request, pk=None):
        """Organizador confirma pagamento [cite: 2776]"""
        reg = self.get_object()
        if request.user != reg.event.organizer:
            return Response({"error": "Não autorizado"}, status=403)
            
        if reg.status != 'AWAITING_PAYMENT':
            return Response({"error": "Status inválido para confirmação"}, status=400)
            
        if reg.event.requires_approval:
            reg.status = 'PENDING'
        else:
            reg.status = 'APPROVED'
            
        reg.save()
        return Response({"status": "Pagamento confirmado", "new_status": reg.status})

    @decorators.action(detail=True, methods=['post'])
    def download_certificate(self, request, pk=None):
        """Gera e retorna URL do PDF [cite: 2853]"""
        reg = self.get_object()
        
        if reg.user != request.user: return Response({"error": "Inválido"}, status=403)
        if reg.event.status != 'FINISHED': return Response({"error": "Evento não finalizado"}, status=400)
        if reg.checkins_count < 1: return Response({"error": "Sem presença"}, status=400)
        
        cert, created = Certificate.objects.get_or_create(
            event=reg.event, user=reg.user,
            defaults={'codigo_validacao': str(uuid.uuid4())}
        )
        
        if not cert.url_pdf:
            pdf_file = generate_certificate_pdf(cert)
            path = default_storage.save(f"certificates/{cert.codigo_validacao}.pdf", pdf_file)
            cert.url_pdf = request.build_absolute_uri(settings.MEDIA_URL + path)
            cert.save()
            
        return Response({"url": cert.url_pdf, "codigo": cert.codigo_validacao})


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Regra do PDF: Só pode avaliar se participou (Check-in >= 1) e evento acabou
        event = serializer.validated_data['event']
        user = self.request.user
        
        if event.status != 'FINISHED':
            raise serializers.ValidationError("O evento precisa estar finalizado para receber avaliações.")
            
        has_checkin = Registration.objects.filter(
            event=event, user=user, checkins_count__gt=0
        ).exists()
        
        if not has_checkin:
            raise serializers.ValidationError("Você precisa ter feito check-in para avaliar.")
            
        serializer.save(user=user)


class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Certificate.objects.all()
    permission_classes = [permissions.AllowAny]

    @decorators.action(detail=False, methods=['get'], url_path='validate/(?P<code>[^/.]+)')
    def validate(self, request, code=None):
        """Validação pública de certificado pelo código"""
        cert = get_object_or_404(Certificate, codigo_validacao=code)
        
        return Response({
            "valid": True,
            "event": cert.event.title,
            "participant": f"{cert.user.first_name} {cert.user.last_name}",
            "emitted_at": cert.data_emissao,
            "workload": cert.event.workload_hours
        })
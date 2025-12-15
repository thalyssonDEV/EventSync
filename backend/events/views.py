from rest_framework import viewsets, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Avg, Q 
import uuid
from .models import Event, Enrollment, Review, Certificate
from .serializers import EventSerializer, EnrollmentSerializer, ReviewSerializer, CertificateSerializer
from django.http import HttpResponse, FileResponse
import csv
from django.shortcuts import get_object_or_404
from .utils import generate_certificate_pdf

# Função auxiliar para os Ranks
def update_league(user):
    """Atualiza a liga do usuário baseado no XP acumulado."""
    xp = user.xp or 0
    if xp < 200: user.league = 'Novato'
    elif xp < 500: user.league = 'Bronze'
    elif xp < 1000: user.league = 'Prata'
    elif xp < 2000: user.league = 'Ouro'
    elif xp < 3500: user.league = 'Platina'
    elif xp < 6000: user.league = 'Diamante'
    elif xp < 10000: user.league = 'Mestre dos Eventos'
    else: user.league = 'CEO dos Eventos'

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        # Se a ação for 'list' (o Feed da Home), aplicamos o filtro.
        if self.action == 'list':
            return Event.objects.exclude(status__in=['FINISHED', 'CANCELED']).order_by('start_date')

        return Event.objects.all().order_by('start_date')

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user, status='DRAFT')

    # --- AÇÕES DO ORGANIZADOR ---
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_created_events(self, request):
        # Histórico do Organizador (vê tudo: cancelados, finalizados, rascunhos)
        user = request.user
        events = Event.objects.filter(organizer=user).order_by('-start_date')
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def export_enrollments(self, request, pk=None):
        """Exporta todas as inscrições aprovadas/confirmadas como CSV."""
        event = self.get_object() # Obtém o objeto Evento
        
        # O nome do arquivo será EventSync_Inscritos_NomeDoEvento.csv
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="EventSync_Inscritos_{event.title.replace(" ", "_")}.csv"'

        writer = csv.writer(response)
        
        # 1. Escrever o cabeçalho do CSV
        writer.writerow(['Nome Completo', 'Email', 'Status da Inscricao', 'Check-in Realizado?', 'Data/Hora Check-in'])

        # 2. Filtrar as Inscrições para exportar (pode filtrar apenas 'APPROVED' se quiser)
        enrollments = Enrollment.objects.filter(event=event).select_related('user')
        
        # 3. Escrever os dados de cada linha
        for enrollment in enrollments:
            
            checkin_status = 'Sim' if enrollment.checked_in else 'Não'
            checkin_time = enrollment.checkin_time.strftime("%d/%m/%Y %H:%M") if enrollment.checkin_time else '-'

            writer.writerow([
                enrollment.user.first_name + ' ' + enrollment.user.last_name,
                enrollment.user.email,
                enrollment.get_status_display(), # Usa o nome amigável do status
                checkin_status,
                checkin_time
            ])

        return response

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def publish(self, request, pk=None):
        event = self.get_object()
        if event.organizer != request.user: return Response(status=403)
        event.status = 'PUBLISHED'
        event.save()
        return Response({'status': 'Evento publicado!'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel_event(self, request, pk=None):
        event = self.get_object()
        if event.organizer != request.user: return Response(status=403)
        
        # Só pode cancelar se NÃO começou e NÃO acabou
        if event.status in ['IN_PROGRESS', 'FINISHED']:
            return Response({'error': 'Evento em andamento ou finalizado não pode ser cancelado.'}, status=400)

        event.status = 'CANCELED'
        event.save()
        return Response({'status': 'Evento cancelado com sucesso.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start_event(self, request, pk=None):
        event = self.get_object()
        if event.organizer != request.user: return Response(status=403)
        event.status = 'IN_PROGRESS'
        event.save()
        return Response({'status': 'Evento iniciado!'})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def finish_event(self, request, pk=None):
        event = self.get_object()
        if event.organizer != request.user: return Response(status=403)
        
        if event.status == 'FINISHED': return Response({'error': 'Já finalizado.'}, status=400)

        event.status = 'FINISHED'
        event.save()
        
        # Gamificação Organizador
        organizer = event.organizer
        organizer.xp = (organizer.xp or 0) + 50 
        update_league(organizer)
        organizer.save()

        return Response({'status': 'Evento finalizado! +50 XP.'})

class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Enrollment.objects.filter(Q(user=user) | Q(event__organizer=user)).distinct()
        event_id = self.request.query_params.get('event_id')
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        return queryset

    def perform_create(self, serializer):
        event = serializer.validated_data['event']
        if event.status != 'PUBLISHED': raise serializers.ValidationError("Inscrições fechadas.")
        initial_status = 'PENDING' if event.requires_approval else 'APPROVED'
        serializer.save(user=self.request.user, status=initial_status)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        enrollment = self.get_object()
        if enrollment.event.organizer != request.user: return Response(status=403)
        enrollment.status = 'APPROVED'
        enrollment.save()
        return Response({'status': 'Aprovado'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        enrollment = self.get_object()
        if enrollment.event.organizer != request.user: return Response(status=403)
        enrollment.status = 'REJECTED'
        enrollment.save()
        return Response({'status': 'Rejeitado'})

    @action(detail=True, methods=['post'])
    def checkin(self, request, pk=None):
        enrollment = self.get_object()
        if enrollment.event.organizer != request.user: return Response(status=403)
        
        if enrollment.event.status != 'IN_PROGRESS':
            return Response({'error': 'O evento precisa estar EM ANDAMENTO para realizar check-in.'}, status=400)

        if enrollment.status != 'APPROVED': return Response({'error': 'Inscrição não aprovada.'}, status=400)
        if enrollment.checked_in: return Response({'error': 'Check-in já realizado.'}, status=400)

        enrollment.checked_in = True
        enrollment.checkin_time = timezone.now()
        enrollment.save()
        return Response({'status': 'Check-in realizado!'})

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Review.objects.all()

    def perform_create(self, serializer):
        event = serializer.validated_data['event']
        user = self.request.user

        if event.status != 'FINISHED': raise serializers.ValidationError("Evento não finalizado.")
        
        has_checkin = Enrollment.objects.filter(user=user, event=event, checked_in=True).exists()
        if not has_checkin: raise serializers.ValidationError("Você precisa ter feito Check-in.")

        if Review.objects.filter(user=user, event=event).exists():
            raise serializers.ValidationError("Já avaliado.")

        review = serializer.save(user=user)

        organizer = event.organizer
        avg_rating = Review.objects.filter(event__organizer=organizer).aggregate(Avg('rating'))['rating__avg']
        organizer.organizer_rating = round(avg_rating, 1) if avg_rating else 0

        xp_gain = 0
        if review.rating == 5: xp_gain = 30
        elif review.rating == 4: xp_gain = 15
        elif review.rating == 3: xp_gain = 5
        
        organizer.xp = (organizer.xp or 0) + xp_gain
        update_league(organizer)
        organizer.save()

class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='generate_and_download')
    def generate_and_download(self, request):
        """
        Gera o PDF do certificado para o usuário logado e força o download.
        Requer autenticação e recebe o ID do evento via query parameter (?event_id=X).
        Garante que o código de validação existe antes de gerar o PDF.
        """
        
        event_id_str = request.query_params.get('event_id')
        user = request.user 
        
        # 1. VALIDAÇÃO E CONVERSÃO DO ID
        if not event_id_str:
            return Response({"detail": "ID do evento não fornecido."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            event_id = int(event_id_str) 
        except ValueError:
            return Response({"detail": "ID do evento inválido."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. BUSCA DO EVENTO E VERIFICAÇÃO DE PARTICIPAÇÃO
        event = get_object_or_404(Event, id=event_id)
        
        # Opcional, mas altamente recomendado: Verifica se o usuário tem direito (inscrito e aprovado)
        if not Enrollment.objects.filter(user=user, event=event, status='APPROVED').exists():
            return Response({"detail": "Você não está inscrito ou não tem permissão para este certificado."}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        # 3. BUSCA OU CRIAÇÃO DO OBJETO CERTIFICATE
        # Busca o certificado existente ou cria um novo, sem preencher validation_code.
        certificate, created = Certificate.objects.get_or_create(user=user, event=event)

        # 4. GARANTIA DO CÓDIGO DE VALIDAÇÃO (CORREÇÃO)
        # Se o objeto é novo OU se o código de validação está vazio, nós o geramos e salvamos.
        if created or not certificate.validation_code:
            
            # Tenta gerar um código UUID de 8 caracteres e verifica a unicidade
            new_code = str(uuid.uuid4()).replace('-', '').upper()[:8] 
            
            # Loop para garantir unicidade (embora a probabilidade seja baixíssima, é seguro)
            while Certificate.objects.filter(validation_code=new_code).exists():
                new_code = str(uuid.uuid4()).replace('-', '').upper()[:8]
            
            # Atribui e salva as informações
            certificate.validation_code = new_code
            certificate.issue_date = timezone.now() 
            certificate.save() # Persiste o novo código no banco de dados

        # 5. GERAÇÃO DO PDF (função ReportLab)
        pdf_content_file = generate_certificate_pdf(certificate)
        
        # 6. RETORNA O PDF COMO RESPOSTA DE DOWNLOAD
        response = FileResponse(pdf_content_file, content_type='application/pdf')
        
        # Define o nome do arquivo para o navegador
        response['Content-Disposition'] = f'attachment; filename="{pdf_content_file.name}"'
        
        # Necessário para o Front-end Axios/Blob obter o nome do arquivo
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'

        return response
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='validate_code/(?P<code>[^/.]+)')
    def validate_code(self, request, code):
        """
        Endpoint público usado pelo QR Code para verificar a validade de um certificado.
        Recebe o código de validação via URL (ex: /api/certificates/validate_code/1B394CAF).
        """
        try:
            # 1. Busca o certificado pelo código de validação
            certificate = Certificate.objects.get(validation_code=code)
            
            # 2. Retorna sucesso e os dados (para Front-end mostrar detalhes)
            serializer = self.get_serializer(certificate) # Usando o CertificateSerializer existente
            
            return Response({
                "valid": True,
                "message": "Certificado válido!",
                "certificate_details": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Certificate.DoesNotExist:
            # 3. Retorna erro 404 se não encontrado
            return Response({
                "valid": False,
                "message": "O código não foi encontrado ou expirou."
            }, status=status.HTTP_404_NOT_FOUND)
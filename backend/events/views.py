from rest_framework import viewsets, permissions, decorators
from rest_framework.response import Response
from .models import Event, Registration
from .serializers import EventSerializer, RegistrationSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-created_at')
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    @decorators.action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        """Inscrever-se no evento"""
        event = self.get_object()
        user = request.user
        
        if Registration.objects.filter(event=event, user=user).exists():
            return Response({"error": "Já inscrito"}, status=400)
            
        initial_status = 'PENDING' if event.requires_approval else 'APPROVED'
        reg = Registration.objects.create(event=event, user=user, status=initial_status)
        return RegistrationSerializer(reg).data

    @decorators.action(detail=True, methods=['post'])
    def finish(self, request, pk=None):
        """Organizador finaliza evento -> Gera XP"""
        event = self.get_object()
        if request.user != event.organizer:
            return Response({"error": "Apenas o dono pode finalizar"}, status=403)
        
        event.status = Event.Status.FINISHED
        event.save() 
        return Response({"status": "Evento Finalizado e XP Calculado!"})

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ORGANIZER':
            # Se for organizador, vê quem se inscreveu nos MEUS eventos
            return Registration.objects.filter(event__organizer=user)
        # Se for participante, vê MINHAS inscrições
        return Registration.objects.filter(user=user)
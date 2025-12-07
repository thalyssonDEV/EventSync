from rest_framework import viewsets, permissions, decorators, serializers
from rest_framework.response import Response
from django.db.models import Q
from .models import FriendshipRequest, Message
from .serializers import FriendshipRequestSerializer, MessageSerializer
from events.models import Registration

class FriendshipViewSet(viewsets.ModelViewSet):
    queryset = FriendshipRequest.objects.all()
    serializer_class = FriendshipRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FriendshipRequest.objects.filter(
            Q(from_user=self.request.user) | Q(to_user=self.request.user)
        )

    def perform_create(self, serializer):
        # [cite_start]REGRA PDF: Ambos devem estar inscritos e aprovados no evento [cite: 2813]
        event = serializer.validated_data['event']
        to_user = serializer.validated_data['to_user']
        from_user = self.request.user

        if not Registration.objects.filter(event=event, user=from_user, status__in=['APPROVED', 'CHECKIN']).exists():
            raise serializers.ValidationError("Você não está confirmado neste evento.")
        
        if not Registration.objects.filter(event=event, user=to_user, status__in=['APPROVED', 'CHECKIN']).exists():
            raise serializers.ValidationError("O destinatário não está confirmado neste evento.")

        serializer.save(from_user=from_user)

    @decorators.action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        friendship = self.get_object()
        if friendship.to_user != request.user:
            return Response({"error": "Não autorizado"}, status=403)
        
        friendship.status = FriendshipRequest.Status.ACCEPTED
        friendship.save()
        return Response({"status": "Amizade aceita"})

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(
            Q(sender=self.request.user) | Q(recipient=self.request.user)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        recipient = serializer.validated_data['recipient']
        sender = self.request.user
        
        # REGRA: Só pode enviar msg se forem amigos
        is_friend = FriendshipRequest.objects.filter(
            status='ACCEPTED'
        ).filter(
            Q(from_user=sender, to_user=recipient) | 
            Q(from_user=recipient, to_user=sender)
        ).exists()

        if not is_friend:
            raise serializers.ValidationError("Apenas amigos podem trocar mensagens.")

        serializer.save(sender=sender)
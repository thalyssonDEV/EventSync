from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .models import Event, Enrollment, Review, Certificate
from django.utils import timezone

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.ReadOnlyField(source='organizer.first_name')
    is_enrolled = serializers.SerializerMethodField()
    enrollment_status = serializers.SerializerMethodField()
    has_checkin = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()

    current_enrollments_count = serializers.SerializerMethodField()

    def validate_start_date(self, value):
        """
        Checa se a data/hora de início não está no passado.
        """
        now = timezone.now()
        
        # Compara a data/hora fornecida com a data/hora atual
        if value < now:
            raise serializers.ValidationError("A data e hora de início do evento não podem ser no passado.")
            
        return value

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['organizer', 'status', 'created_at']
    
    def get_current_enrollments_count(self, obj):
        """Retorna o número de inscrições que consomem capacidade."""
        # Esta lógica deve ser idêntica à validação no EnrollmentSerializer
        return Enrollment.objects.filter(
            event=obj, 
            status__in=['APPROVED', 'PENDING', 'AWAITING_PAYMENT']
        ).count()

    def get_is_enrolled(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return Enrollment.objects.filter(user=user, event=obj).exists()
        return False

    def get_enrollment_status(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            enrollment = Enrollment.objects.filter(user=user, event=obj).first()
            return enrollment.status if enrollment else None
        return None

    def get_has_checkin(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return Enrollment.objects.filter(user=user, event=obj, checked_in=True).exists()
        return False
        
    def get_can_review(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated: return False
        
        # Regra: Acabou + Tem Check-in + NÃO avaliou ainda
        has_checkin = Enrollment.objects.filter(user=user, event=obj, checked_in=True).exists()
        already_reviewed = Review.objects.filter(user=user, event=obj).exists()
        
        return (obj.status == 'FINISHED') and has_checkin and not already_reviewed

class EnrollmentSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source='event.title')
    event_date = serializers.ReadOnlyField(source='event.start_date')
    event_location = serializers.ReadOnlyField(source='event.location_address')
    event_end_date = serializers.ReadOnlyField(source='event.end_date')
    
    user_name = serializers.ReadOnlyField(source='user.first_name')
    user_email = serializers.ReadOnlyField(source='user.email')
    user_photo = serializers.SerializerMethodField()

    event_status = serializers.ReadOnlyField(source='event.status')
    
    # NOVO CAMPO
    has_review = serializers.SerializerMethodField()

    def validate(self, data):
        event = data['event'] # Obtém o objeto Evento
        
        # 1. Checa se o usuário já está inscrito 
        if Enrollment.objects.filter(event=event, user=self.context['request'].user).exists():
            raise ValidationError("Você já se inscreveu neste evento.")

        # 2. Checa o Limite de Vagas
        max_limit = event.max_enrollments
        
        if max_limit is not None and max_limit > 0:
            # Conta apenas inscrições que não foram CANCELADAS ou RECUSADAS
            current_count = Enrollment.objects.filter(
                event=event, 
                status__in=['APPROVED', 'PENDING', 'AWAITING_PAYMENT'] # Assumindo esses status contam para a capacidade
            ).count()
            
            if current_count >= max_limit:
                # Retorna o erro 400 Bad Request com mensagem detalhada
                raise ValidationError("As vagas para este evento esgotaram. Tente se inscrever mais tarde.")
        
        return data

    class Meta:
        model = Enrollment
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_photo',
            'event', 'event_title', 'event_date', 'event_end_date', 'event_location', 
            'status', 'created_at', 'checked_in', 'checkin_time', 'event_status',
            'has_review'
        ]
        read_only_fields = ['user', 'status', 'checked_in', 'checkin_time']
    
    def create(self, validated_data):
        # GARANTIA: Injeta o usuário logado (request.user)
        user = self.context['request'].user 
        
        # Se você usa um GenericViewSet/ModelViewSet, o contexto precisa estar lá
        validated_data['user'] = user 
        
        return super().create(validated_data)

    def get_user_photo(self, obj):
        if obj.user.photo:
            try: return obj.user.photo.url
            except: return None
        return None
        
    # Lógica para saber se já avaliou
    def get_has_review(self, obj):
        return Review.objects.filter(user=obj.user, event=obj.event).exists()

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.first_name')
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'event', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']

class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='user.first_name')
    event_title = serializers.ReadOnlyField(source='event.title')
    event_date = serializers.ReadOnlyField(source='event.start_date')
    organizer_name = serializers.ReadOnlyField(source='event.organizer.first_name')

    class Meta:
        model = Certificate
        fields = ['id', 'user', 'event', 'validation_code', 'student_name', 'event_title', 'event_date', 'organizer_name']
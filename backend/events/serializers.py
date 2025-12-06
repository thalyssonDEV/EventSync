from rest_framework import serializers
from .models import Event, Registration, CheckIn, Review
from core.models import User

# Serializer simplificado do User para não expor senha
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'xp', 'league', 'photo_url', 'role']

class EventSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Registration.objects.filter(event=obj, user=request.user).exists()
        return False

class RegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.ReadOnlyField(source='event.title')
    user_email = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = Registration
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Review
        fields = '__all__'
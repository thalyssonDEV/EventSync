from rest_framework import serializers
from .models import FriendshipRequest, Message
from core.models import User

class UserSocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'photo_url', 'city']

class FriendshipRequestSerializer(serializers.ModelSerializer):
    from_user = UserSocialSerializer(read_only=True)
    event_title = serializers.ReadOnlyField(source='event.title')
    
    class Meta:
        model = FriendshipRequest
        fields = '__all__'
        read_only_fields = ['from_user', 'status']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSocialSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender', 'created_at', 'read']
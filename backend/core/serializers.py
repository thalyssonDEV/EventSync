from rest_framework import serializers
from dj_rest_auth.serializers import UserDetailsSerializer
from .models import User

class UserUpdateSerializer(UserDetailsSerializer):
    # Campos que o Frontend pode ler (agora com XP, Liga e Nota)
    xp = serializers.IntegerField(read_only=True)
    league = serializers.CharField(read_only=True)
    organizer_rating = serializers.FloatField(read_only=True)

    class Meta(UserDetailsSerializer.Meta):
        model = User
        fields = (
            'pk', 'username', 'email', 'first_name', 'last_name', 
            'city', 'photo', 'role', 
            'xp', 'league', 'organizer_rating' # <--- ADICIONEI ELES AQUI
        )
        read_only_fields = ('email', 'xp', 'league', 'organizer_rating')
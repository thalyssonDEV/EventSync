from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import User
from .serializers import UserUpdateSerializer 

class UserUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer # <--- Use ele aqui
    permission_classes = [permissions.IsAuthenticated]
    
    # Permite upload de arquivos (MultiPart) E json normal
    parser_classes = (MultiPartParser, FormParser, JSONParser) 

    def get_object(self):
        return self.request.user
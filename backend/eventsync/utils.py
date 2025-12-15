from rest_framework.views import exception_handler
from django.db import IntegrityError
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Chama o handler padrão do DRF primeiro
    response = exception_handler(exc, context)

    # Se o DRF não lidou com o erro (retornou None) e é um erro de integridade
    if response is None and isinstance(exc, IntegrityError):
        error_msg = str(exc).lower()
        if 'unique constraint' in error_msg:
            if 'email' in error_msg:
                return Response(
                    {'email': ['Este endereço de email já está cadastrado.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if 'username' in error_msg:
                return Response(
                    {'username': ['Este nome de usuário já existe.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        # Erro genérico de integridade
        return Response(
            {'detail': 'Erro de integridade de dados. Verifique duplicidades.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    return response
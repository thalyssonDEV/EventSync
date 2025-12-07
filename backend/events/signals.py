from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Registration

@receiver(post_save, sender=Registration)
def notify_status_change(sender, instance, created, **kwargs):
    user = instance.user
    event = instance.event
    status = instance.status
    
    subject = None
    message = None
    
    if created and status == 'PENDING':
        subject = f"Inscrição Recebida: {event.title}"
        message = f"Olá {user.first_name}, inscrição recebida. Aguarde aprovação."
        
    elif created and status == 'AWAITING_PAYMENT':
        subject = f"Pagamento Pendente: {event.title}"
        message = f"Olá {user.first_name}, aguardamos seu pagamento de R$ {event.price}."

    elif not created:
        if status == 'APPROVED':
            subject = f"Inscrição Confirmada! {event.title}"
            message = "Tudo certo! Seu QR Code de acesso está disponível."
        elif status == 'REJECTED':
            subject = f"Inscrição Recusada: {event.title}"
            message = "Infelizmente sua inscrição não foi aceita."
            
    if subject:
        print(f"--- [EMAIL] Enviando para {user.email}: {subject} ---")
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
        except:
            pass
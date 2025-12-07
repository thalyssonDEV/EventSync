from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from django.core.files.base import ContentFile
from django.utils import timezone
import qrcode
from reportlab.lib.utils import ImageReader

def generate_certificate_pdf(certificate):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Moldura
    p.setStrokeColorRGB(0.2, 0.2, 0.8)
    p.setLineWidth(5)
    p.rect(30, 30, width-60, height-60)
    
    # Textos
    p.setFont("Helvetica-Bold", 30)
    p.drawCentredString(width/2, height - 150, "CERTIFICADO DE PARTICIPAÇÃO")
    
    p.setFont("Helvetica", 18)
    p.drawCentredString(width/2, height - 250, "Certificamos que")
    
    p.setFont("Helvetica-Bold", 22)
    p.drawCentredString(width/2, height - 290, f"{certificate.user.first_name} {certificate.user.last_name}")
    
    p.setFont("Helvetica", 18)
    p.drawCentredString(width/2, height - 330, "Participou com êxito do evento:")
    
    p.setFont("Helvetica-Bold", 20)
    p.drawCentredString(width/2, height - 370, certificate.event.title)
    
    p.setFont("Helvetica", 12)
    p.drawString(100, 200, f"Carga Horária: {certificate.event.workload_hours} horas")
    p.drawString(100, 180, f"Data de Emissão: {timezone.now().strftime('%d/%m/%Y')}")
    p.drawString(100, 160, f"Código de Validação: {certificate.codigo_validacao}")

    validation_url = f"http://localhost:5173/validate/{certificate.codigo_validacao}"

    qr = qrcode.make(validation_url)
    qr_img = ImageReader(qr._img)

    p.drawImage(qr_img, width - 150, 100, width=100, height=100)
    p.drawString(width - 140, 90, "Validar Certificado")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return ContentFile(buffer.getvalue(), f'cert_{certificate.codigo_validacao}.pdf')
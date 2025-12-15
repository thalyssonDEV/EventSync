from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from django.core.files.base import ContentFile
from django.utils import timezone
import qrcode
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
import locale

try:
    locale.setlocale(locale.LC_TIME, 'pt_BR.UTF-8')
except locale.Error:
    try:
        locale.setlocale(locale.LC_TIME, 'Portuguese_Brazil')
    except locale.Error:
        # Fallback 
        print("Aviso: Locale pt-BR não encontrado. Usando locale padrão.")

def generate_certificate_pdf(certificate):
    buffer = BytesIO()
    
    # Define o tamanho da página em modo paisagem (Landscape)
    p = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)
    
    # Cores
    COLOR_PRIMARIA = HexColor('#1D3557') 
    COLOR_DESTAQUE = HexColor('#CDAD80') # Um dourado sóbrio
    
    # --- MOLDURA E FUNDO ---
    
    # 1. Borda Sólida (Azul Escuro)
    p.setStrokeColor(COLOR_PRIMARIA)
    p.setLineWidth(10)
    p.rect(20, 20, width - 40, height - 40)
    
    # 2. Faixa Superior 
    p.setFillColor(COLOR_PRIMARIA)
    p.rect(20, height - 60, width - 40, 40, fill=1)
    
    # 3. Textos da Faixa Superior
    p.setFont("Helvetica-Bold", 18)
    p.setFillColor(HexColor('#FFFFFF'))
    p.drawCentredString(width/2, height - 45, "Certificado de Comprovação de Participação")
    
    # --- CONTEÚDO PRINCIPAL ---

    # Título Principal
    p.setFillColor(COLOR_PRIMARIA)
    p.setFont("Helvetica-Bold", 36)
    p.drawCentredString(width/2, height - 150, "Certificamos Que")

    # Nome do Participante 
    p.setFillColor(COLOR_DESTAQUE)
    p.setFont("Helvetica-Bold", 40)
    p.drawCentredString(width/2, height - 210, f"{certificate.user.first_name} {certificate.user.last_name}")

    # Descrição da Participação
    p.setFillColor(COLOR_PRIMARIA)
    p.setFont("Helvetica", 22)
    p.drawCentredString(width/2, height - 260, "Participou com êxito do evento:")
    
    # Título do Evento
    p.setFont("Helvetica-Bold", 26)
    p.drawCentredString(width/2, height - 300, certificate.event.title)

    # Informações Detalhadas
    p.setFont("Helvetica", 14)
    p.setFillColor(HexColor('#333333'))

    # --- LÓGICA DE FORMATAÇÃO DE DATA E HORA INTELIGENTE ---
    start_dt = certificate.event.start_date
    end_dt = certificate.event.end_date

    hora_inicio = start_dt.strftime('%H:%M')
    hora_fim = end_dt.strftime('%H:%M') if end_dt else None

    data_inicio_formatada = start_dt.strftime('%d de %B de %Y')
    
    if end_dt and start_dt.date() == end_dt.date():
        # Evento de UM DIA
        periodo_str = f"Realização: {data_inicio_formatada} | Horário: {hora_inicio}"
        if hora_fim:
            periodo_str += f" às {hora_fim}"
            
    elif end_dt and start_dt.date() < end_dt.date():
        # Evento de VÁRIOS DIAS
        data_fim_formatada = end_dt.strftime('%d de %B de %Y')
        periodo_str = f"Período: De {data_inicio_formatada} a {data_fim_formatada}"
        
    else:
        # Padrão / Evento com apenas data de início
        periodo_str = f"Data: {data_inicio_formatada} às {hora_inicio}"
        
    p.drawCentredString(width/2, height - 350, periodo_str) # Posição 1 (Período/Data/Hora)
    # --- FIM DA LÓGICA DE DATA E HORA ---


    # Local
    p.drawCentredString(width/2, height - 370, 
        f"Local: {certificate.event.location_address}") # Posição 2

    # Organização
    p.drawCentredString(width/2, height - 390, 
        f"Organização: {certificate.event.organizer.first_name}") # Posição 3

    # --- QR CODE E VALIDAÇÃO (Canto Superior Direito da área inferior) ---
    
    validation_url = f"http://localhost:5173/validate/{certificate.validation_code}"

    qr_code_obj = qrcode.make(validation_url)
    
    img_buffer = BytesIO()
    qr_code_obj.save(img_buffer, format='PNG') 
    
    img_buffer.seek(0)
    qr_img_reportlab = ImageReader(img_buffer)
    
    qr_size = 100
    qr_x = width - 220
    qr_y = 170
    
    p.drawImage(qr_img_reportlab, qr_x, qr_y, width=qr_size, height=qr_size)

    # Texto do Código de Validação
    p.setFont("Helvetica-Bold", 12)
    p.setFillColor(COLOR_PRIMARIA)
    p.drawString(qr_x - 10, qr_y - 20, "CÓDIGO DE VALIDAÇÃO:")
    
    p.setFont("Helvetica", 16)
    p.drawString(qr_x - 10, qr_y - 40, f"{certificate.validation_code}")

    # --- ASSINATURAS (Canto Inferior Esquerdo) ---
    
    sig_x = 120
    sig_y = 70 # Posição baixa
    
    p.setFillColor(COLOR_PRIMARIA)
    p.setLineWidth(1)
    
    # 1. Assinatura do Participante / Instrutor
    p.line(sig_x - 50, sig_y, sig_x + 200, sig_y)
    p.setFont("Helvetica", 12)
    p.drawCentredString(sig_x + 75, sig_y - 15, "Organizador(a) / Instrutor Líder")
    p.setFont("Helvetica-Bold", 14)
    p.drawCentredString(sig_x + 75, sig_y + 5, f"{certificate.event.organizer.first_name} {certificate.event.organizer.last_name}")
    
    # 2. Assinatura do Diretor/Validador
    sig_x_dir = width - 250
    p.line(sig_x_dir - 50, sig_y, sig_x_dir + 200, sig_y)
    p.setFont("Helvetica", 12)
    p.drawCentredString(sig_x_dir + 75, sig_y - 15, "Diretor(a) de Emissão (EventSync)")
    p.setFont("Helvetica-Bold", 14)
    p.drawCentredString(sig_x_dir + 75, sig_y + 5, "Equipe EventSync") 
    
    # Data de Emissão (Centralizada embaixo)
    p.setFont("Helvetica-Oblique", 10)
    p.drawCentredString(width/2, 40, f"Certificado emitido digitalmente em {timezone.now().strftime('%d de %B de %Y')}")

    p.showPage()
    p.save()
    
    buffer.seek(0)
    return ContentFile(buffer.getvalue(), f'cert_{certificate.validation_code}.pdf')
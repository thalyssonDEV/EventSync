import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Calendar, User, ArrowLeft, Ticket, Star, Download, 
  ShieldCheck, Settings, X, AlertTriangle 
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Estados para evento
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  
  // Estados para Avaliação
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Estados para Certificado
  const [ certificateData ] = useState<any>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  const getUrl = (path: string) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `http://localhost:8000${path}`;
  };

  const fetchEvent = () => {
    api.get(`/api/events/${id}/`)
      .then(res => setEvent(res.data))
      .catch(() => showToast('Evento não encontrado', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvent(); }, [id]);

  const handleEnroll = async () => {
    if (!user) return navigate('/login');
    setEnrolling(true);
    
    // Captura o ID do evento para envio
    const eventId = event?.id; 

    try {
        await api.post('/api/enrollments/', { event: eventId });
      
        showToast(event.requires_approval ? 'Solicitação enviada! Aguarde aprovação.' : 'Inscrição confirmada!', 'success');
        fetchEvent();
      
    } catch (err: any) {
        let msg = 'Erro desconhecido ao se inscrever.';
      
        const serverError = err.response?.data;
      
      if (serverError) {
          if (Array.isArray(serverError) && serverError.length > 0) {
              // Erro genérico
              msg = serverError[0]; 
          } else if (typeof serverError === 'object') {
              // Erro de campo específico
              const firstKey = Object.keys(serverError)[0];
              const errorContent = serverError[firstKey];
              if (Array.isArray(errorContent) && errorContent.length > 0) {
                  msg = `${firstKey}: ${errorContent[0]}`;
              } else {
                  msg = `Erro de validação no campo ${firstKey}.`;
              }
          }
      }
      
        showToast(msg, 'error');
      
    } finally {
        setEnrolling(false);
    }
    };

  const submitReview = async (e: any) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      await api.post('/api/reviews/', { event: event.id, rating, comment });
      showToast('Avaliação enviada com sucesso! +XP', 'success');
      fetchEvent(); // Recarrega para atualizar permissões
    } catch (err) {
      showToast('Erro ao enviar avaliação.', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCertificate = async () => { 
    if (!user) return navigate('/login');
    
    showToast('Gerando certificado...', 'success');

    try {
        const res = await api.get( 
            `http://localhost:8000/api/certificates/generate_and_download/?event_id=${event.id}`, 
            {
                responseType: 'blob',
            }
        );
        
        const content = res.headers['content-disposition'];
        const filenameMatch = content && content.match(/filename="(.+)"/);
        const filename = filenameMatch ? filenameMatch[1] : 'certificado.pdf';

        const fileURL = window.URL.createObjectURL(new Blob([res.data]));
        const fileLink = document.createElement('a');
        fileLink.href = fileURL;
        fileLink.setAttribute('download', filename);
        document.body.appendChild(fileLink);
        fileLink.click();
        fileLink.remove();
        
        window.URL.revokeObjectURL(fileURL);
        showToast('Certificado baixado com sucesso!', 'success');

    } catch (err: any) {
        let msg = 'Erro ao gerar certificado.';
        if (err.response?.status === 401) {
             msg = 'Sessão expirada. Faça login novamente.';
        } else if (err.response?.data?.detail) {
             msg = err.response.data.detail; 
        }
        showToast(msg, 'error');
    }
};

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!event) return null;

  const isOrganizer = user && event.organizer === user.pk;

    const maxEnrollments = event.max_enrollments;
    
    // Contagem atual de inscritos que consomem a vaga
    const currentCount = event.current_enrollments_count || 0; 

    // Cálculo das vagas restantes
    const vacanciesRemaining = maxEnrollments === null || maxEnrollments === 0 
        ? Infinity 
        : maxEnrollments - currentCount; 
        
    const isSoldOut = vacanciesRemaining <= 0;
  

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen md:min-h-0 md:rounded-xl shadow-sm overflow-hidden relative pb-10">
      {/* Botão Voltar */}
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 bg-white/80 p-2 rounded-full shadow hover:bg-white transition">
        <ArrowLeft size={20} />
      </button>

      {/* BANNER DO EVENTO */}
      <div className="h-64 md:h-80 bg-gray-200 relative">
        {event.banner ? (
          <img src={getUrl(event.banner)!} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
            <Calendar size={64} />
          </div>
        )}
        <div className={`absolute bottom-4 right-4 text-white px-3 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-sm shadow-sm
            ${event.status === 'FINISHED' ? 'bg-gray-800/80' : 
              event.status === 'CANCELED' ? 'bg-red-600/80' : 
              event.status === 'IN_PROGRESS' ? 'bg-blue-600/80' : 'bg-black/70'}
        `}>
          {event.status === 'DRAFT' ? 'Rascunho' : 
           event.status === 'PUBLISHED' ? 'Inscrições Abertas' : 
           event.status === 'IN_PROGRESS' ? 'Acontecendo Agora' : 
           event.status === 'CANCELED' ? 'Cancelado' : 'Finalizado'}
        </div>
      </div>

      <div className="p-6 md:p-8">
        
        {/* --- ÁREA DE ALERTAS E AVISOS --- */}

        {/* AVISO DE FALTA: Só aparece se acabou, foi aprovado e NÃO tem check-in */}
        {event.status === 'FINISHED' && event.is_enrolled && event.enrollment_status === 'APPROVED' && !event.has_checkin && (
            <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3 text-red-700 animate-fadeIn">
                <div className="p-2 bg-red-100 rounded-full shrink-0">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="font-bold">Check-in não registrado</h3>
                    <p className="text-sm">
                        Você não confirmou presença neste evento. A emissão de certificados e avaliação não estão disponíveis.
                    </p>
                </div>
            </div>
        )}

        {/* AVISO DE PENDÊNCIA */}
        {event.is_enrolled && event.enrollment_status === 'PENDING' && (
             <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center gap-3 text-yellow-800">
                <ShieldCheck size={24} />
                <div>
                    <h3 className="font-bold">Aguardando Aprovação</h3>
                    <p className="text-sm">Sua inscrição foi recebida e está sendo analisada pelo organizador.</p>
                </div>
            </div>
        )}

        {/* CABEÇALHO DO TÍTULO E BOTÕES */}
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full text-xs uppercase">
                <Ticket size={14} /> GRATUITO
              </span>
              {event.requires_approval && (
                <span className="flex items-center gap-1 text-orange-600 font-semibold bg-orange-50 px-3 py-1 rounded-full text-xs uppercase">
                  <ShieldCheck size={14} /> Requer Aprovação
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-auto">
            {isOrganizer ? (
              <Link to={`/manage/${event.id}`} className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-gray-900 transition flex items-center justify-center gap-2">
                <Settings size={18} /> Gerenciar Evento
              </Link>
            ) : (
              <>
                {event.is_enrolled ? (
                  <button onClick={() => navigate('/my-tickets')} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-green-700 transition flex items-center gap-2 justify-center">
                    <Ticket size={20} /> 
                    {event.enrollment_status === 'PENDING' ? 'Ver Status' : 'Ver Ingressos'}
                  </button>
                ) : (
                  <button 
                    onClick={handleEnroll} 
                    disabled={enrolling || event.status !== 'PUBLISHED' || isSoldOut} 
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSoldOut 
                        ? 'Vagas Esgotadas' 
                        : event.status !== 'PUBLISHED' ? 'Inscrições Fechadas' : enrolling ? 'Processando...' : 'Garantir Inscrição'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 border-b border-gray-100 pb-8">
          <div className="flex items-start gap-3">
            <Calendar className="text-gray-400 mt-1" />
            <div>
              <h3 className="font-bold text-gray-800">Data e Horário</h3>
              <p className="text-gray-600">
                {new Date(event.start_date).toLocaleDateString('pt-BR')} às {new Date(event.start_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="text-gray-400 mt-1" />
            <div>
              <h3 className="font-bold text-gray-800">Localização</h3>
              <p className="text-gray-600">{event.location_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="text-gray-400 mt-1" />
            <div>
              <h3 className="font-bold text-gray-800">Organizado por</h3>
              <p className="text-gray-600">{event.organizer_name}</p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sobre o evento</h2>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{event.description || "Sem descrição."}</p>
        </div>

        {/* --- ÁREA DE PÓS-EVENTO (Avaliação e Certificado) --- */}

        {/* AVALIAÇÃO: Só aparece se can_review for TRUE (Acabou + Check-in + Não avaliou) */}
        {event.can_review && (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl mb-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <Star className="fill-yellow-600 text-yellow-600" /> Avalie sua experiência
            </h3>
            <p className="text-sm text-yellow-700 mb-4">Sua avaliação ajuda o organizador a subir de nível!</p>
            
            <form onSubmit={submitReview} className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className={`text-2xl transition hover:scale-110 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</button>
                ))}
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Deixe um comentário..." className="w-full p-3 rounded border border-yellow-200 focus:ring-2 focus:ring-yellow-400 outline-none text-sm" rows={3}/>
              <button disabled={reviewSubmitting} type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded font-bold hover:bg-yellow-700 text-sm disabled:opacity-50">
                  {reviewSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </form>
          </div>
        )}

        {/* CERTIFICADO: Só aparece se Acabou + Teve Check-in (Independente se avaliou ou não) */}
        {event.status === 'FINISHED' && event.has_checkin && (
          <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 animate-fadeIn">
            <div>
              <h3 className="font-bold text-indigo-900 flex items-center gap-2"><ShieldCheck /> Certificado Disponível</h3>
              <p className="text-sm text-indigo-700">Você participou deste evento com sucesso.</p>
            </div>
            <button onClick={handleCertificate} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 w-full sm:w-auto justify-center">
              <Download size={18} /> Baixar Certificado (PDF)
            </button>
          </div>
        )}
      </div>

      {/* --- MODAL DO CERTIFICADO (DESIGN MELHORADO) --- */}
      {showCertModal && certificateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCertModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border-4 border-indigo-100 animate-zoomIn" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 p-6 text-center text-white relative">
               <ShieldCheck size={48} className="mx-auto mb-2 opacity-90" />
               <h2 className="text-2xl font-bold tracking-wider">CERTIFICADO</h2>
               <button onClick={() => setShowCertModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-8 text-center space-y-4">
              <p className="text-gray-500">Certificamos que</p>
              <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-indigo-100 pb-2 inline-block">{certificateData.student_name}</h3>
              <p className="text-gray-500">participou com sucesso do evento</p>
              <h4 className="text-xl font-bold text-indigo-600">{certificateData.event_title}</h4>
              <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col items-center">
                <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Código de Validação</span>
                <span className="font-mono text-xl font-bold text-gray-700 tracking-widest select-all">{certificateData.validation_code}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 text-center">
              <button onClick={() => window.print()} className="text-indigo-600 font-bold hover:underline flex items-center justify-center gap-2"><Download size={16} /> Imprimir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  QrCode, CheckCircle2, UserCheck, UserX, AlertOctagon, 
  Calendar, MapPin, X, AlertTriangle, User, Search, FileText 
} from 'lucide-react'; 
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export function ManageEvent() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'control' | 'inscriptions' | 'checkin'>('control');
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Helper para URL da imagem
  const getUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  const fetchData = async () => {
    try {
      const [eventRes, enrollRes] = await Promise.all([
        api.get(`/api/events/${id}/`),
        api.get(`/api/enrollments/?event_id=${id}`)
      ]);
      setEvent(eventRes.data);
      setEnrollments(enrollRes.data);
    } catch (err) {
      showToast('Erro ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAction = async (action: string) => {
    if (action === 'cancel_event') {
        setShowCancelConfirm(true);
        return;
    }
    try {
      await api.post(`/api/events/${id}/${action}/`);
      showToast('Status atualizado!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao atualizar.', 'error');
    }
  };

  const confirmCancellation = async () => {
    setShowCancelConfirm(false);
    try {
        await api.post(`/api/events/${id}/cancel_event/`);
        showToast('Evento Cancelado!', 'success');
        fetchData();
    } catch (err: any) {
        showToast(err.response?.data?.error || 'Erro ao cancelar.', 'error');
    }
  };

  const handleEnrollment = async (enrollId: string, action: string) => {
    try {
      await api.post(`/api/enrollments/${enrollId}/${action}/`);
      showToast(`Inscrição ${action === 'approve' ? 'aprovada' : 'rejeitada'}!`, 'success');
      fetchData();
    } catch (err) {
      showToast('Erro.', 'error');
    }
  };

  const handleQrCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput) return;
    try {
      await api.post(`/api/enrollments/${qrCodeInput}/checkin/`);
      showToast('Check-in confirmado!', 'success');
      setQrCodeInput('');
      fetchData();
    } catch (err: any) {
        showToast(err.response?.data?.error || 'Erro no check-in.', 'error');
    }
  };
  
  const handleExportCsv = () => {
    const exportUrl = `${api.defaults.baseURL}/api/events/${id}/export_enrollments/`;
    
    // Abrir em uma nova aba para iniciar o download
    window.open(exportUrl, '_blank'); 
    showToast('Download de lista iniciado!', 'success');
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;
  if (!event) return <div className="p-10 text-center">Evento não encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20 relative">
      
      {showCancelConfirm && (
        <div className="fixed top-24 right-4 z-50 animate-fadeInLeft">
            <div className="bg-white rounded-lg shadow-2xl border-l-4 border-red-500 p-6 max-w-sm w-full relative">
                <button onClick={() => setShowCancelConfirm(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-full shrink-0"><AlertTriangle className="text-red-600" size={24} /></div>
                    <div>
                        <h4 className="text-gray-900 font-bold text-lg">Tem certeza?</h4>
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">O evento será cancelado permanentemente.</p>
                        <div className="flex gap-3 mt-4 justify-end">
                            <button onClick={() => setShowCancelConfirm(false)} className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Manter</button>
                            <button onClick={confirmCancellation} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md">Sim, cancelar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
             <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(event.start_date).toLocaleDateString()}</span>
             <span className="flex items-center gap-1"><MapPin size={14}/> {event.location_address}</span>
        </div>
        <div className="mt-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase 
            ${event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 
              event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 
              event.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
              event.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            Status: {event.status === 'DRAFT' ? 'Rascunho' : event.status === 'PUBLISHED' ? 'Publicado' : event.status === 'CANCELED' ? 'Cancelado' : event.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Finalizado'}
          </span>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => setActiveTab('control')} className={`pb-3 px-4 font-medium text-sm transition ${activeTab === 'control' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Controle</button>
        <button onClick={() => setActiveTab('inscriptions')} className={`pb-3 px-4 font-medium text-sm transition ${activeTab === 'inscriptions' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Inscrições</button>
        <button onClick={() => setActiveTab('checkin')} className={`pb-3 px-4 font-medium text-sm transition ${activeTab === 'checkin' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Check-in</button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
        
        {/* ABA CONTROLE */}
        {activeTab === 'control' && (
          <div className="space-y-6">
            {event.status === 'CANCELED' ? (
                <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl border border-red-100">
                    <AlertOctagon size={48} className="mx-auto mb-2"/>
                    <h3 className="text-xl font-bold">Cancelado.</h3>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">1. Publicação</h3>
                            <button onClick={() => handleAction('publish')} disabled={event.status !== 'DRAFT'} 
                                className={`w-full py-3 rounded text-white font-bold transition shadow-md ${event.status === 'DRAFT' ? 'bg-[#7c9aea] hover:bg-[#6b89d9]' : 'bg-gray-300 cursor-not-allowed'}`}>
                                Publicar
                            </button>
                        </div>
                        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">2. Execução</h3>
                            <button onClick={() => handleAction('start_event')} disabled={event.status !== 'PUBLISHED'} 
                                className={`w-full py-3 rounded text-white font-bold transition shadow-md ${event.status === 'PUBLISHED' ? 'bg-[#a798f0] hover:bg-[#9687e0]' : 'bg-gray-300 cursor-not-allowed'}`}>
                                Iniciar
                            </button>
                        </div>
                        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">3. Finalização</h3>
                            <button onClick={() => handleAction('finish_event')} disabled={event.status !== 'IN_PROGRESS'} 
                                className={`w-full py-3 rounded text-white font-bold transition shadow-md ${event.status === 'IN_PROGRESS' ? 'bg-[#82ca9d] hover:bg-[#71b98c]' : 'bg-gray-300 cursor-not-allowed'}`}>
                                Finalizar
                            </button>
                        </div>
                    </div>

                    {(event.status === 'DRAFT' || event.status === 'PUBLISHED') && (
                        <div className="mt-10 border-t border-red-100 pt-8">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div><h3 className="font-bold text-red-800 flex items-center gap-2 text-lg"><AlertOctagon size={20}/> Zona de Perigo</h3><p className="text-sm text-red-600 mt-1">Cancelar o evento é irreversível.</p></div>
                                <button onClick={() => handleAction('cancel_event')} className="bg-white border-2 border-red-200 text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white transition shadow-sm">Cancelar Evento</button>
                            </div>
                        </div>
                    )}
                </>
            )}
          </div>
        )}

        {/* ABA INSCRIÇÕES */}
        {activeTab === 'inscriptions' && (
          <div>
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Pendentes</h3>
                <button 
                    onClick={handleExportCsv}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition flex items-center gap-2 text-sm shadow-sm"
                    title="Exportar dados de todos os inscritos (aprovados, pendentes, etc.)"
                >
                    <FileText size={18}/> Exportar CSV
                </button>
            </div>
            
            <div className="space-y-3 mb-8">
                {enrollments.filter(e => e.status === 'PENDING').length === 0 && <p className="text-gray-400">Nenhuma pendência.</p>}
                {enrollments.filter(e => e.status === 'PENDING').map(enrollment => (
                  <div key={enrollment.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded border gap-4">
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-12 h-12 rounded-full bg-gray-200 border border-gray-300 overflow-hidden shrink-0 flex items-center justify-center">
                            {enrollment.user_photo ? (
                                <img src={getUrl(enrollment.user_photo)!} alt="User" className="w-full h-full object-cover" />
                            ) : (<User size={24} className="text-gray-400" />)}
                        </div>
                        <div>
                            <p className="font-bold">{enrollment.user_name}</p>
                            <p className="text-sm text-gray-500">{enrollment.user_email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => handleEnrollment(enrollment.id, 'reject')} className="flex-1 sm:flex-none p-2 text-red-600 border rounded hover:bg-red-50"><UserX size={18} /></button>
                      <button onClick={() => handleEnrollment(enrollment.id, 'approve')} className="flex-1 sm:flex-none p-2 bg-green-500 text-white rounded hover:bg-green-600"><UserCheck size={18} /></button>
                    </div>
                  </div>
                ))}
            </div>
            
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-600"/> Confirmados ({enrollments.filter(e => e.status === 'APPROVED').length})
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
                {enrollments.filter(e => e.status === 'APPROVED').map(enrollment => (
                    <div key={enrollment.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 overflow-hidden border border-indigo-100">
                            {enrollment.user_photo ? (
                                <img src={getUrl(enrollment.user_photo)!} alt="User" className="w-full h-full object-cover" />
                            ) : (<User size={20} />)}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{enrollment.user_name}</p>
                            <p className="text-xs text-gray-500">{enrollment.user_email}</p>
                        </div>
                        <span className="ml-auto text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">Inscrito</span>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* ABA CHECK-IN */}
        {activeTab === 'checkin' && (
          <div className="space-y-8">
            
            {/* TERMINAL COM DESIGN CLEAN */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Efeito de fundo sutil */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

                <div className="bg-indigo-50 p-4 rounded-full mb-4 ring-4 ring-indigo-50/50">
                    <QrCode size={48} className="text-indigo-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Terminal de Check-in</h2>
                <p className="text-gray-500 mb-6 text-sm max-w-md">
                    {event.status === 'IN_PROGRESS' 
                        ? 'O sistema está ativo. Utilize um leitor de QR Code ou digite o código manualmente abaixo.' 
                        : 'Aguardando início do evento na aba de Controle.'}
                </p>
                
                <form onSubmit={handleQrCheckin} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            value={qrCodeInput} 
                            onChange={(e) => setQrCodeInput(e.target.value)} 
                            placeholder="Código do ingresso..." 
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition bg-gray-50 focus:bg-white"
                            autoFocus 
                            disabled={event.status !== 'IN_PROGRESS'}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={event.status !== 'IN_PROGRESS'}
                        className={`px-6 py-3 rounded-lg font-bold text-white transition shadow-md flex items-center justify-center gap-2
                            ${event.status === 'IN_PROGRESS' ? 'bg-[#a798f0] hover:bg-[#9687e0]' : 'bg-gray-300 cursor-not-allowed'}
                        `}
                    >
                        <CheckCircle2 size={20} /> Confirmar
                    </button>
                </form>
            </div>
            
            {/* TABELA DE PRESENTES */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-green-600" /> 
                    Presentes ({enrollments.filter(e => e.checked_in).length})
                </h3>
                <div className="bg-white border rounded overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr><th className="p-4 font-semibold text-gray-600">Participante</th><th className="p-4 text-right font-semibold text-gray-600">Horário</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {enrollments.filter(e => e.checked_in).length === 0 && (
                                <tr><td colSpan={2} className="p-6 text-center text-gray-400">Nenhum check-in registrado.</td></tr>
                            )}
                            {enrollments.filter(e => e.checked_in).map(enrollment => (
                                <tr key={enrollment.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border border-gray-200">
                                            {enrollment.user_photo ? (
                                                <img src={getUrl(enrollment.user_photo)!} className="w-full h-full object-cover" />
                                            ) : (<User size={16} className="text-gray-500"/>)}
                                        </div>
                                        <span className="font-medium text-gray-900">{enrollment.user_name}</span>
                                    </td>
                                    <td className="p-4 font-mono text-gray-500 text-right">
                                        {enrollment.checkin_time ? new Date(enrollment.checkin_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
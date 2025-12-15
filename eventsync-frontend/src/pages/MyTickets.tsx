import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { Calendar, MapPin, Clock, QrCode, Download, AlertTriangle, Edit } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export function MyTickets() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [myTickets, setMyTickets] = useState<any[]>([]); 
  const [myCreatedEvents, setMyCreatedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<'participant' | 'organizer'>('participant'); 
  const [subTab, setSubTab] = useState<'upcoming' | 'pending' | 'history'>('upcoming'); 
  const [selectedQr, setSelectedQr] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [mainTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mainTab === 'participant') {
        const res = await api.get('/api/enrollments/');
        setMyTickets(res.data.filter((e: any) => e.user === user?.pk));
      } else {
        const res = await api.get('/api/events/my_created_events/');
        setMyCreatedEvents(res.data);
      }
    } catch (err) {
      showToast('Erro ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  const ticketsUpcoming = myTickets.filter(e => 
    e.status === 'APPROVED' && 
    e.event_status !== 'FINISHED' && 
    e.event_status !== 'CANCELED'
  );

  const ticketsPending = myTickets.filter(e => e.status === 'PENDING' && e.event_status !== 'CANCELED');

  // Histórico
  const ticketsHistory = myTickets.filter(e => 
    e.event_status === 'FINISHED' || 
    e.event_status === 'CANCELED' ||
    e.status === 'REJECTED' ||
    (e.status === 'APPROVED' && new Date(e.event_end_date || e.event_date) < now && e.event_status !== 'IN_PROGRESS')
  );

  const getStatusBadge = (enrollment: any) => {
    if (enrollment.event_status === 'CANCELED') return <span className="text-gray-600 bg-gray-200 px-2 py-1 rounded text-xs font-bold">CANCELADO</span>;
    if (enrollment.status === 'REJECTED') return <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold">RECUSADO</span>;
    if (!enrollment.checked_in) return <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs font-bold">FALTOU</span>;
    return <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">COMPARECEU</span>;
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Meus Eventos</h1>
        
        {user?.role === 'ORGANIZER' && (
            <div className="bg-gray-100 p-1 rounded-lg flex">
                <button onClick={() => setMainTab('participant')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${mainTab === 'participant' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Ingressos</button>
                <button onClick={() => setMainTab('organizer')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${mainTab === 'organizer' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Painel Organizador</button>
            </div>
        )}
      </div>

      {loading ? <div className="p-10 text-center text-gray-500">Carregando...</div> : (
        <>
            {/* ABA PARTICIPANTE */}
            {mainTab === 'participant' && (
                <div className="space-y-6">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        <button onClick={() => setSubTab('upcoming')} className={`pb-3 px-4 font-medium text-sm whitespace-nowrap ${subTab === 'upcoming' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Próximos ({ticketsUpcoming.length})</button>
                        <button onClick={() => setSubTab('pending')} className={`pb-3 px-4 font-medium text-sm whitespace-nowrap ${subTab === 'pending' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Pendentes ({ticketsPending.length})</button>
                        <button onClick={() => setSubTab('history')} className={`pb-3 px-4 font-medium text-sm whitespace-nowrap ${subTab === 'history' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Histórico ({ticketsHistory.length})</button>
                    </div>

                    <div className="space-y-4">
                        {subTab === 'upcoming' && ticketsUpcoming.map(item => (
                             <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm hover:shadow-md transition">
                                <div className="flex-1">
                                <Link to={`/event/${item.event}`} className="text-lg font-bold text-gray-900 hover:text-indigo-600 hover:underline">{item.event_title}</Link>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(item.event_date).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><MapPin size={14}/> {item.event_location}</span>
                                    {item.event_status === 'IN_PROGRESS' && <span className="text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded animate-pulse">ACONTECENDO AGORA</span>}
                                </div>
                                </div>
                                <button onClick={() => setSelectedQr(item.id)} className="bg-gray-900 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-black transition shadow">
                                    <QrCode size={18} /> Ver QR Code
                                </button>
                            </div>
                        ))}
                        
                        {subTab === 'pending' && ticketsPending.map(item => (
                             <div key={item.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900">{item.event_title}</h3>
                                    <p className="text-sm text-yellow-700 mt-1">Solicitado em {new Date(item.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className="flex items-center gap-1 text-yellow-600 font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm"><Clock size={14} /> Aguardando</span>
                            </div>
                        ))}

                        {subTab === 'history' && ticketsHistory.map(item => (
                            <div key={item.id} className={`border rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 ${!item.checked_in && item.status !== 'REJECTED' ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Link to={`/event/${item.event}`} className="font-bold text-gray-900 hover:text-indigo-600 hover:underline">{item.event_title}</Link>
                                        {getStatusBadge(item)}
                                    </div>
                                    <p className="text-sm text-gray-500">Realizado em {new Date(item.event_date).toLocaleDateString()}</p>
                                    {!item.checked_in && item.status === 'APPROVED' && item.event_status !== 'CANCELED' && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12}/> Check-in não realizado</p>}
                                </div>
                                {item.checked_in && (
                                    <div className="flex gap-2">
                                        <Link to={`/event/${item.event}`} className="text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition">Avaliar</Link>
                                        <Link to={`/event/${item.event}`} className="text-sm font-medium text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition"><Download size={16}/></Link>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {subTab === 'upcoming' && ticketsUpcoming.length === 0 && <p className="text-center text-gray-400 py-10">Nenhum evento próximo.</p>}
                        {subTab === 'history' && ticketsHistory.length === 0 && <p className="text-center text-gray-400 py-10">Histórico vazio.</p>}
                    </div>
                </div>
            )}

            {/* ABA ORGANIZADOR */}
            {mainTab === 'organizer' && (
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Edit size={20} className="text-indigo-600"/> Eventos Ativos</h2>
                    <div className="grid gap-4">
                        {myCreatedEvents.filter(e => e.status !== 'FINISHED' && e.status !== 'CANCELED').map(event => (
                            <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center hover:shadow-lg transition">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                            event.status === 'DRAFT' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            event.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                            {event.status === 'DRAFT' ? 'Rascunho' : event.status === 'PUBLISHED' ? 'Aberto' : 'Em Andamento'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 space-y-1">
                                        <p className="flex items-center gap-2"><Calendar size={14}/> {new Date(event.start_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-4 md:mt-0">
                                    <Link to={`/manage/${event.id}`} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-md">
                                        <Edit size={16} /> Gerenciar
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
      )}

      {/* --- MODAL QR CODE --- */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedQr(null)}>
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-fadeIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Check-in do Evento</h3>
            <p className="text-gray-500 text-sm mb-6">Apresente este código ao organizador.</p>
            
            <div className="bg-white p-2 border-2 border-gray-100 rounded-xl inline-block shadow-inner mb-6">
               <QRCode value={selectedQr} size={200} />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Código Manual</p>
                <p className="font-mono text-lg font-bold text-gray-700 select-all break-all">{selectedQr}</p>
            </div>

            <button onClick={() => setSelectedQr(null)} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
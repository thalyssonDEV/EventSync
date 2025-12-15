import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, ArrowRight, Trophy } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function Feed() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper de URL
  const getUrl = (path: string | undefined | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  useEffect(() => {
    api.get('/api/events/')
      .then(res => setEvents(res.data))
      .catch(err => console.error("Erro ao carregar eventos:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto pt-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* --- MINI PERFIL --- */}
        {user && (
          <div className="hidden md:block md:col-span-4 lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="h-16 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              
              <div className="px-4 pb-4 text-center relative">
                <div className="w-16 h-16 mx-auto -mt-8 rounded-full border-4 border-white shadow-sm bg-gray-200 overflow-hidden flex items-center justify-center">
                  {getUrl(user.photo) ? (
                    <img src={getUrl(user.photo)!} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-gray-400" />
                  )}
                </div>

                <h3 className="mt-2 font-bold text-gray-800 truncate">
                  {user.first_name || user.username}
                </h3>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  {user.role === 'ORGANIZER' ? 'Organizador' : 'Participante'}
                </p>

                {/* SÓ MOSTRA XP SE FOR ORGANIZADOR */}
                {user.role === 'ORGANIZER' && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600 bg-gray-50 py-2 rounded">
                    <Trophy size={14} className="text-yellow-600" />
                    <span>{user.league || 'Novato'}</span>
                    <span className="text-gray-300">|</span>
                    <span className="font-bold">{user.xp || 0} XP</span>
                    </div>
                )}

                <Link 
                  to="/profile" 
                  className="mt-4 flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  Ver meu perfil <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* --- LISTA DE EVENTOS --- */}
        <div className={user ? "md:col-span-8 lg:col-span-9" : "col-span-12"}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Explorar Eventos</h1>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">Carregando eventos...</div>
          ) : events.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-gray-100">
              <p className="text-gray-500">Nenhum evento encontrado no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="group block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
                  <Link to={`/event/${event.id}`} className="flex flex-col sm:flex-row">
                    
                    {/* BANNER */}
                    <div className="sm:w-48 h-48 sm:h-auto bg-gray-200 relative shrink-0">
                      {event.banner ? (
                        <img src={getUrl(event.banner)!} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                          <Calendar size={40} />
                        </div>
                      )}
                      
                      {/* PREÇO FIXO E STATUS */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="px-2 py-1 rounded text-xs font-bold shadow-sm bg-green-500 text-white">
                            GRÁTIS
                        </span>
                        {/* Mostra se é Rascunho se o dono estiver vendo */}
                        {event.status === 'DRAFT' && (
                            <span className="px-2 py-1 rounded text-xs font-bold shadow-sm bg-gray-800 text-white">
                                RASCUNHO
                            </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1 block">
                             {new Date(event.start_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                          {event.title}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          <MapPin size={16} />
                          <span className="truncate">{event.location_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <User size={16} />
                           <span>Org: {event.organizer_name}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {event.max_enrollments ? `${event.max_enrollments} vagas` : 'Vagas ilimitadas'}
                        </span>
                        <span className="text-sm font-medium text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                          Ver Detalhes <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
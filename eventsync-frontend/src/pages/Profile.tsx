import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client'; 
import { useToast } from '../context/ToastContext'; 
import { 
  MapPin, Mail, Trophy, Star, Shield, LogOut, 
  User as UserIcon, Award, Briefcase, Sprout, Crown, Medal, Gem 
} from 'lucide-react';

export function Profile() {
  const { user: contextUser, logout } = useAuth();
  const { showToast } = useToast();
  
  const [user, setUser] = useState<any>(contextUser);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchLatestProfile();
  }, []);

  const fetchLatestProfile = async () => {
    try {
      const res = await api.get('/auth/user/');
      setUser(res.data);
    } catch (err) {
      console.error("Erro ao atualizar perfil", err);
    }
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Carregando perfil...</div>;

  const getUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };
  
  const userPhoto = getUrl(user.photo);

  const getLeagueStyle = (league: string) => {
    switch (league) {
        case 'CEO dos Eventos':
            return { 
                icon: <Trophy size={20} className="text-indigo-900" />, 
                bg: 'bg-indigo-100', 
                text: 'text-indigo-900', 
                border: 'border-indigo-300',
                color: 'from-indigo-600 to-black'
            };
        case 'Mestre dos Eventos':
            return { 
                icon: <Crown size={20} className="text-red-600" />, 
                bg: 'bg-red-100', 
                text: 'text-red-800', 
                border: 'border-red-200',
                color: 'from-red-500 to-red-700'
            };
        case 'Diamante':
            return { 
                icon: <Gem size={20} className="text-purple-600" />, 
                bg: 'bg-purple-100', 
                text: 'text-purple-800', 
                border: 'border-purple-200',
                color: 'from-purple-500 to-pink-500'
            };
        case 'Platina':
            return { 
                icon: <Medal size={20} className="text-cyan-600" />, 
                bg: 'bg-cyan-100', 
                text: 'text-cyan-800', 
                border: 'border-cyan-200',
                color: 'from-cyan-400 to-blue-500'
            };
        case 'Ouro':
            return { 
                icon: <Medal size={20} className="text-yellow-600" />, 
                bg: 'bg-yellow-100', 
                text: 'text-yellow-800', 
                border: 'border-yellow-200',
                color: 'from-yellow-400 to-yellow-600'
            };
        case 'Prata':
            return { 
                icon: <Medal size={20} className="text-slate-500" />, 
                bg: 'bg-slate-100', 
                text: 'text-slate-700', 
                border: 'border-slate-300',
                color: 'from-slate-300 to-slate-500'
            };
        case 'Bronze':
            return { 
                icon: <Medal size={20} className="text-orange-700" />, 
                bg: 'bg-orange-100', 
                text: 'text-orange-800', 
                border: 'border-orange-200',
                color: 'from-orange-400 to-orange-600'
            };
        default: // Novato
            return { 
                icon: <Sprout size={20} className="text-green-600" />, 
                bg: 'bg-green-100', 
                text: 'text-green-800', 
                border: 'border-green-200',
                color: 'from-green-400 to-emerald-500'
            };
    }
  };

  const leagueStyle = getLeagueStyle(user.league || 'Novato');

  const handleBecomeOrganizer = async () => {
    if (!confirm('Deseja se tornar Organizador?')) return;
    setUpgrading(true);
    try {
        await api.patch('/auth/user/', { role: 'ORGANIZER' });
        showToast('Parabéns! Você agora é um Organizador.', 'success');
        window.location.reload(); 
    } catch (err) {
        showToast('Erro ao atualizar perfil.', 'error');
    } finally {
        setUpgrading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      
      {/* Capa e Foto */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative">
        <div className="h-40 bg-gradient-to-r from-indigo-600 to-purple-600"></div>

        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-end -mt-16 mb-4 gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 overflow-hidden flex items-center justify-center">
                {userPhoto ? (
                  <img src={userPhoto} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={64} className="text-gray-400" />
                )}
              </div>
              
              <span className={`absolute bottom-1 right-1 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white rounded-full shadow border-2 border-white 
                ${user.role === 'ORGANIZER' ? 'bg-indigo-600' : 'bg-pink-500'}`}>
                {user.role === 'ORGANIZER' ? 'Org' : 'User'}
              </span>
            </div>

            <button 
              onClick={logout}
              className="mb-2 flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition font-medium text-sm shadow-sm"
            >
              <LogOut size={18} /> Sair
            </button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-gray-500 font-medium text-lg">@{user.username}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 text-gray-600">
            {user.city && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md">
                <MapPin size={18} className="text-indigo-500" />
                <span>{user.city}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md">
              <Mail size={18} className="text-indigo-500" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO: ESTATÍSTICAS (Apenas para Organizadores) */}
      {user.role === 'ORGANIZER' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card Gamification Clicável */}
            <Link to="/rankings" className="block group"> 
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition relative overflow-hidden h-full">
                    
                    {/* Dica visual de clique */}
                    <div className="absolute top-4 right-4 text-gray-300 group-hover:text-indigo-500 transition">
                        <Trophy size={20} />
                    </div>

                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className={`p-3 rounded-xl transition-colors ${leagueStyle.bg}`}>
                            {leagueStyle.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg group-hover:text-indigo-600 transition">Liga & Conquistas</h3>
                            <p className="text-xs text-gray-400">Ver progressão de ranks</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <span className="text-sm font-semibold text-gray-600">Liga Atual</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${leagueStyle.bg} ${leagueStyle.text} ${leagueStyle.border}`}>
                            {leagueStyle.icon}
                            {user.league || 'Novato'}
                        </span>
                    </div>

                    <div className="mt-4 relative z-10">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                            <span>XP Acumulado</span>
                            <span>{user.xp || 0} XP</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            {/* Barra de progresso visual */}
                            <div 
                                className={`h-3 rounded-full transition-all duration-1000 bg-gradient-to-r ${leagueStyle.color}`} 
                                style={{ width: `${Math.min(((user.xp || 0) / 10000) * 100, 100)}%` }} 
                            ></div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-right">Clique para ver detalhes</p>
                    </div>
                </div>
            </Link>

            {/* Card Reputação */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Award size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">Reputação</h3>
                        <p className="text-xs text-gray-400">Média das avaliações</p>
                    </div>
                </div>

                <div className="flex items-end gap-3 mt-2">
                    <span className="text-5xl font-black text-gray-800 tracking-tighter">
                        {(user.organizer_rating || 0).toFixed(1)}
                    </span>
                    <span className="text-gray-400 mb-2 font-medium">/ 5.0</span>
                </div>

                <div className="flex gap-1 mt-3 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        size={20} 
                        fill={star <= Math.round(user.organizer_rating || 0) ? "currentColor" : "none"} 
                        className={star <= Math.round(user.organizer_rating || 0) ? "text-yellow-400" : "text-gray-200"}
                    />
                    ))}
                </div>
            </div>
        </div>
      ) : (
          <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl border border-indigo-100 text-center shadow-sm">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quer criar seus próprios eventos?</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Torne-se um organizador para publicar eventos e subir no ranking!
              </p>
              <button 
                onClick={handleBecomeOrganizer}
                disabled={upgrading}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-70"
              >
                  {upgrading ? 'Atualizando...' : 'Ativar Conta de Organizador'}
              </button>
          </div>
      )}

      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-4">
        <Shield size={16} />
        <span>Dados protegidos. <span className="font-mono text-gray-500">#{user.pk}</span></span>
      </div>

    </div>
  );
}
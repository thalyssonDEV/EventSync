import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  Sprout, Medal, Crown, Trophy, ArrowLeft, Gem, Lock, CheckCircle2 
} from 'lucide-react';

// Configuração Visual dos Ranks
const RANKS_CONFIG = [
  { 
    name: 'Novato', 
    minXp: 0, 
    icon: Sprout, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200',
    shadow: 'shadow-emerald-200',
    gradient: 'from-emerald-400 to-green-500'
  },
  { 
    name: 'Bronze', 
    minXp: 200, 
    icon: Medal, 
    color: 'text-amber-700', 
    bg: 'bg-orange-50', 
    border: 'border-orange-200',
    shadow: 'shadow-orange-200',
    gradient: 'from-amber-500 to-orange-600'
  },
  { 
    name: 'Prata', 
    minXp: 500, 
    icon: Medal, 
    color: 'text-slate-600', 
    bg: 'bg-slate-50', 
    border: 'border-slate-300',
    shadow: 'shadow-slate-300',
    gradient: 'from-slate-400 to-gray-500'
  },
  { 
    name: 'Ouro', 
    minXp: 1000, 
    icon: Medal, 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-200',
    shadow: 'shadow-yellow-200',
    gradient: 'from-yellow-400 to-amber-500'
  },
  { 
    name: 'Platina', 
    minXp: 2000, 
    icon: Medal, 
    color: 'text-cyan-600', 
    bg: 'bg-cyan-50', 
    border: 'border-cyan-200',
    shadow: 'shadow-cyan-200',
    gradient: 'from-cyan-400 to-blue-500'
  },
  { 
    name: 'Diamante', 
    minXp: 3500, 
    icon: Gem, 
    color: 'text-purple-600', 
    bg: 'bg-purple-50', 
    border: 'border-purple-200',
    shadow: 'shadow-purple-200',
    gradient: 'from-purple-500 to-fuchsia-600'
  },
  { 
    name: 'Mestre dos Eventos', 
    minXp: 6000, 
    icon: Crown, 
    color: 'text-rose-600', 
    bg: 'bg-rose-50', 
    border: 'border-rose-200',
    shadow: 'shadow-rose-200',
    gradient: 'from-rose-500 to-red-600'
  },
  { 
    name: 'CEO dos Eventos', 
    minXp: 10000, 
    icon: Trophy, 
    color: 'text-indigo-800', 
    bg: 'bg-indigo-50', 
    border: 'border-indigo-300',
    shadow: 'shadow-indigo-300',
    gradient: 'from-indigo-600 to-violet-800'
  },
];

export function Rankings() {
  const navigate = useNavigate();
  const { user: contextUser } = useAuth();
  const [user, setUser] = useState<any>(contextUser);

  useEffect(() => {
    // Busca dados atualizados para garantir que a barra de progresso esteja certa
    api.get('/auth/user/').then(res => setUser(res.data));
  }, []);

  if (!user) return null;

  const currentXp = user.xp || 0;
  
  const currentRankIndex = [...RANKS_CONFIG].reverse().findIndex(r => currentXp >= r.minXp);
  const activeRankIndex = currentRankIndex >= 0 ? RANKS_CONFIG.length - 1 - currentRankIndex : 0;
  
  const nextRank = RANKS_CONFIG[activeRankIndex + 1];
  const currentRankConfig = RANKS_CONFIG[activeRankIndex];
  
  // Cálculo da porcentagem APENAS para o rank atual
  let progressPercent = 100;
  if (nextRank) {
    const xpInLevel = currentXp - currentRankConfig.minXp;
    const xpNeeded = nextRank.minXp - currentRankConfig.minXp;
    progressPercent = Math.min((xpInLevel / xpNeeded) * 100, 100);
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8 pt-6">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-full hover:bg-gray-100 shadow-sm border border-gray-200 transition group">
            <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition" />
        </button>
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Jornada do Organizador</h1>
            <p className="text-gray-500">Sua ascensão ao topo dos eventos</p>
        </div>
      </div>

      {/* CARD DE DESTAQUE */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-3xl shadow-2xl mb-12 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-10 opacity-10 transform translate-x-10 -translate-y-10">
            <Trophy size={200} />
        </div>
        <div className="relative z-10">
            <p className="text-indigo-200 font-medium mb-1 uppercase tracking-wider text-sm">XP Total Acumulado</p>
            <h2 className="text-5xl font-black tracking-tight mb-2">{currentXp.toLocaleString()} <span className="text-2xl font-normal text-indigo-300">XP</span></h2>
            
            {nextRank ? (
                <div className="flex items-center gap-2 text-indigo-100 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                    <span className="text-sm">Faltam <b>{nextRank.minXp - currentXp} XP</b> para <span className="text-white font-bold">{nextRank.name}</span></span>
                </div>
            ) : (
                <div className="text-yellow-400 font-bold flex items-center gap-2">
                    <Crown size={20} /> NÍVEL MÁXIMO ALCANÇADO!
                </div>
            )}
        </div>
      </div>

      {/* TIMELINE DE RANKS */}
      <div className="space-y-6 relative">
        
        {/* Linha Conectora de Fundo */}
        <div className="absolute left-[2.25rem] top-8 bottom-8 w-1 bg-gray-100 -z-20 rounded-full"></div>
        
        {/* Linha de Progresso Colorida (Preenche até o rank atual) */}
        <div 
            className="absolute left-[2.25rem] top-0 w-1 bg-gradient-to-b from-emerald-400 via-yellow-400 to-purple-500 -z-10 rounded-full transition-all duration-1000"
            style={{ height: `${(activeRankIndex / (RANKS_CONFIG.length - 1)) * 100}%` }}
        ></div>

        {RANKS_CONFIG.map((rank, index) => {
            const isUnlocked = currentXp >= rank.minXp;
            const isCurrent = index === activeRankIndex;
            const isFuture = !isUnlocked;
            const Icon = rank.icon;

            return (
                <div 
                    key={rank.name} 
                    className={`
                        relative flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-300
                        ${isCurrent ? `bg-white ${rank.border} shadow-xl ${rank.shadow} scale-105 z-10` : ''} 
                        ${isUnlocked && !isCurrent ? 'bg-white border-gray-100 opacity-90' : ''}
                        ${isFuture ? 'bg-gray-50 border-dashed border-gray-200' : ''}
                    `}
                >
                    {/* Ícone Lateral */}
                    <div className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border-2
                        ${isCurrent ? `bg-gradient-to-br ${rank.gradient} text-white border-white ring-4 ring-white` : ''}
                        ${isUnlocked && !isCurrent ? `${rank.bg} ${rank.color} ${rank.border}` : ''}
                        ${isFuture ? 'bg-white text-gray-400 border-gray-200' : ''}
                    `}>
                        <Icon size={isCurrent ? 32 : 28} strokeWidth={isCurrent ? 2 : 1.5} />
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <h3 className={`font-bold text-lg ${isFuture ? 'text-gray-400' : 'text-gray-800'}`}>
                                {rank.name}
                            </h3>
                            
                            {/* Badges de Status */}
                            {isCurrent && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${rank.gradient} text-white shadow-sm`}>
                                    ATUAL
                                </span>
                            )}
                            {isUnlocked && !isCurrent && (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                                    <CheckCircle2 size={12} /> CONQUISTADO
                                </span>
                            )}
                            {isFuture && (
                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                                    <Lock size={12} /> {rank.minXp} XP
                                </span>
                            )}
                        </div>

                        {/* Se for o rank atual: Barra de Progresso Interna */}
                        {isCurrent && nextRank && (
                            <div className="mt-3">
                                <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                                    <span>Progresso da Liga</span>
                                    <span>{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div 
                                        className={`h-3 rounded-full transition-all duration-1000 bg-gradient-to-r ${rank.gradient}`} 
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Se for futuro: Mostra o design */}
                        {isFuture && (
                             <p className="text-xs text-gray-400 mt-1">
                                Desbloqueia ao atingir <span className="font-mono font-bold">{rank.minXp} XP</span>
                             </p>
                        )}
                         
                        {/* Se for passado: Texto simples */}
                        {isUnlocked && !isCurrent && (
                            <p className="text-xs text-gray-400 mt-1">Concluído.</p>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
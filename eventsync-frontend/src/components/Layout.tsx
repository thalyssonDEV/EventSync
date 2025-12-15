import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Ticket, PlusCircle } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();

  // Helper para corrigir URL da foto
  const getPhotoUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <Link to="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-800 tracking-tight flex items-center gap-2">
            EventSync
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Link para Ingressos */}
                <Link 
                  to="/my-tickets" 
                  className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-indigo-600 transition"
                  title="Meus Ingressos"
                >
                  <Ticket size={18} />
                  <span>Ingressos</span>
                </Link>

                {/* 2. Link Criar Evento */}
                {user.role === 'ORGANIZER' && (
                  <Link 
                    to="/create-event" 
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 border border-indigo-100 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                  >
                    <PlusCircle size={16} />
                    <span className="hidden sm:inline">Criar Evento</span>
                  </Link>
                )}

                {/* Divisor Visual */}
                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                {/* Área do Perfil */}
                <Link to="/profile" className="flex items-center gap-3 group pl-1 pr-1 py-1 rounded-full hover:bg-gray-50 transition">
                    <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 overflow-hidden flex items-center justify-center shadow-sm group-hover:border-indigo-300 transition">
                      {/* CORREÇÃO AQUI: Removemos o user.photo_url antigo */}
                      {getPhotoUrl(user.photo) ? (
                        <img 
                          src={getPhotoUrl(user.photo)!} 
                          alt="User" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User size={18} className="text-gray-500" />
                      )}
                    </div>
                    
                    <div className="hidden sm:flex flex-col items-start leading-none mr-2">
                      <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition max-w-[100px] truncate">
                        {user.first_name || user.username}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {user.role === 'ORGANIZER' ? 'Org' : 'User'}
                      </span>
                    </div>
                </Link>

                <button 
                  onClick={logout}
                  title="Sair"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <div className="space-x-3">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600">
                  Entrar
                </Link>
                <Link to="/register" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition shadow-sm hover:shadow">
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 animate-fadeIn">
        <Outlet />
      </main>

      <footer className="bg-white border-t py-6 text-center text-sm text-gray-400">
        <p>&copy; 2025 EventSync - Gestão de Eventos</p>
      </footer>
    </div>
  );
}
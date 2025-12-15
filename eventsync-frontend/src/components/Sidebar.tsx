import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, User, Ticket, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => pathname === path ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50";

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 hidden md:flex flex-col p-6 z-10">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">E</div>
        <span className="text-xl font-bold text-gray-900">EventSync</span>
      </div>

      <nav className="space-y-2 flex-1">
        <Link to="/" className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${isActive('/')}`}>
          <Home size={20} /> Feed
        </Link>
        
        <Link to="/my-tickets" className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${isActive('/my-tickets')}`}>
          <Ticket size={20} /> Meus Ingressos
        </Link>

        <Link to="/create-event" className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${isActive('/create-event')}`}>
          <PlusSquare size={20} /> Criar Evento
        </Link>
        
        <Link to="/profile" className={`flex items-center gap-3 p-3 rounded-lg transition font-medium ${isActive('/profile')}`}>
          <User size={20} /> Meu Perfil
        </Link>
      </nav>

      <button onClick={logout} className="flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition font-medium mt-auto">
        <LogOut size={20} /> Sair
      </button>
    </aside>
  );
}
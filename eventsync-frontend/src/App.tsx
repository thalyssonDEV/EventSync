import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ValidateCertificate } from './pages/ValidateCertificate';

// Layout e Componentes
import { Layout } from './components/Layout';

// Páginas Públicas
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Páginas Privadas
import { Feed } from './pages/Feed'; 
import { Profile } from './pages/Profile';
import { EventDetails } from './pages/EventDetails';
import { MyTickets } from './pages/MyTickets'; 
import { CreateEvent } from './pages/CreateEvent';
import { ManageEvent } from './pages/ManageEvent';
import { Rankings } from './pages/Rankings'; 

// Componente para proteger rotas (Só acessa se logado)
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="p-10 text-center">Carregando...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas (Fora do Layout padrão) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/validate/:code" element={<ValidateCertificate />} />
            
            {/* Rotas com Layout (Menu Lateral/Header) */}
            <Route path="/" element={<Layout />}>
              
              {/* Home / Feed */}
              <Route index element={<Feed />} />
              
              <Route path="rankings" element={<ProtectedRoute><Rankings /></ProtectedRoute>} />

              <Route path="event/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
              <Route path="manage/:id" element={<ProtectedRoute><ManageEvent /></ProtectedRoute>} />
              <Route path="my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />

            </Route>

            {/* Qualquer rota desconhecida vai para o Feed */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
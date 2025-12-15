import { createContext, useState, useEffect, type ReactNode, useContext } from 'react';
import { api } from '../api/client';

export interface User {
  pk: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: 'PARTICIPANT' | 'ORGANIZER';
  city?: string;
  
  photo?: string;
  photo_url?: string; 
  
  xp?: number;
  league?: string;
  organizer_rating?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: any) => Promise<void>;
  setAuthData: (data: { access: string, refresh?: string, user: User }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        // Se tem token salvo, restaura a sessão
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Erro ao recuperar usuário", error);
        }
      }
      
      setLoading(false); 
    };

    loadStorageData();
  }, []);

  // Função auxiliar para salvar dados de sessão (Usado no Login e Cadastro)
  function setAuthData(data: { access: string, refresh?: string, user: User }) {
    localStorage.setItem('access_token', data.access);
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Atualiza o header do axios imediatamente
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
    setUser(data.user);
  }

  async function login(credentials: any) {
    const res = await api.post('/auth/login/', credentials);
    setAuthData(res.data);
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      setAuthData, 
      logout, 
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
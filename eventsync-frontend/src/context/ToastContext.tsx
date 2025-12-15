import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastMessage {
  message: string;
  type: ToastType;
  id: number;
}

interface ToastContextData {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(message: string, type: ToastType) {
    // Cria um ID único baseado no tempo para garantir que o useEffect dispare
    setToast({ message, type, id: Date.now() });
  }

  // Fecha o toast automaticamente após 3 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000); // 3 segundos

      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Componente Visual do Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all animate-bounce-in
          ${toast.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-red-100 border border-red-200 text-red-800'}
        `}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          
          <span className="font-medium text-sm">{toast.message}</span>
          
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
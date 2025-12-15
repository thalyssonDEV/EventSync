import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const { showToast } = useToast();

  const onSubmit = async (data: any) => {
    try {
      await login(data);
      showToast('Login realizado com sucesso!', 'success');
      navigate('/');
    } catch (error) {
      showToast('Email ou senha inválidos.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-indigo-700">Entrar no EventSync</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              {...register('email')} 
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input 
              {...register('password')} 
              type="password" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500" 
              required 
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-bold">
            ACESSAR
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Não tem conta? <Link to="/register" className="text-indigo-600 hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
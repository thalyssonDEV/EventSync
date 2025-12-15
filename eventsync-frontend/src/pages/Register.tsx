import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function Register() {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();
  
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Monitora o input de foto em tempo real
  const photoFile = watch('photo');

  useEffect(() => {
    if (photoFile && photoFile.length > 0 && typeof photoFile !== 'string') {
      const file = photoFile[0];
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Limpa a memória quando a foto mudar ou componente desmontar
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [photoFile]);

  // Função para remover a foto selecionada
  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Evita cliques acidentais
    setValue('photo', null); // Limpa o estado do formulário
  };

  const onSubmit = async (data: any) => {
    if (data.password !== data.confirm_password) {
      showToast('As senhas não conferem!', 'error');
      return;
    }

    setLoading(true);

    try {
      // Criar a conta (JSON)
      const registerData = {
        username: data.username,
        email: data.email,
        password1: data.password,
        password2: data.confirm_password,
        first_name: data.first_name,
        last_name: data.last_name,
      };

      console.log('1. Criando conta...');
      const res = await api.post('/auth/registration/', registerData);

      if (res.data.access) {
        // Guarda o token temporariamente
        const accessToken = res.data.access;
        const refreshToken = res.data.refresh;
        
        // Configura o header manualmente para a próxima requisição funcionar
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        // Upload da Foto e Dados Extras (Multipart)
        const formData = new FormData();
        formData.append('first_name', data.first_name);
        formData.append('last_name', data.last_name);
        formData.append('role', data.role);
        if (data.city) formData.append('city', data.city);

        if (data.photo && data.photo.length > 0) {
           formData.append('photo', data.photo[0]);
        }

        try {
          console.log('2. Enviando foto...');
          // O PATCH retorna o usuário ATUALIZADO (com a foto)
          const userRes = await api.patch('/auth/user/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          // Salva no contexto com os dados finais
          setAuthData({
            access: accessToken,
            refresh: refreshToken,
            user: userRes.data
          });

          console.log('3. Sucesso! Redirecionando...');
          showToast('Conta criada com sucesso!', 'success');
          navigate('/');

        } catch (patchError) {
          console.error('Erro no upload da foto:', patchError);
          setAuthData(res.data);
          navigate('/');
        }
      } else {
        navigate('/login');
      }

    } catch (err: any) {
      console.error(err);
      const serverError = err.response?.data;
      let msg = 'Erro desconhecido.';

      if (serverError) {
        const keys = Object.keys(serverError);
        if (keys.length > 0) {
            const firstKey = keys[0];
            const errorContent = serverError[firstKey];
            msg = `${firstKey}: ${Array.isArray(errorContent) ? errorContent[0] : errorContent}`;
        }
      }
      showToast(`Falha: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10 px-4">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-center mb-2 text-indigo-700">Criar Conta</h2>
        <p className="text-center text-gray-500 mb-8">Junte-se ao EventSync</p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* --- ÁREA DE FOTO --- */}
          <div className="flex flex-col items-center mb-6 group">
             <div className="relative w-28 h-28 mb-2">
                {preview ? (
                  <div className="relative w-full h-full">
                    <img src={preview} alt="Preview" className="w-full h-full rounded-full object-cover border-4 border-indigo-100 shadow-sm" />
                    <button 
                      onClick={handleRemovePhoto}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition z-10"
                      title="Remover foto"
                      type="button" 
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 group-hover:border-indigo-400 group-hover:text-indigo-500 transition">
                    <Upload size={32} />
                  </div>
                )}
                
                {/* Input Invisível: Só renderiza se não tiver preview para evitar conflitos de clique */}
                {!preview && (
                  <input 
                    type="file" 
                    accept="image/*"
                    {...register('photo')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Adicionar foto"
                  />
                )}
             </div>
             <span className="text-sm text-indigo-600 font-medium cursor-pointer">
                {preview ? 'Foto selecionada' : 'Adicionar foto de perfil'}
             </span>
          </div>

          {/* Nome e Sobrenome */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input {...register('first_name', { required: true })} className="w-full border border-gray-300 p-2 rounded outline-none focus:border-indigo-500" placeholder="Ex: Ana" />
              {errors.first_name && <span className="text-red-500 text-xs">Obrigatório</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
              <input {...register('last_name', { required: true })} className="w-full border border-gray-300 p-2 rounded outline-none focus:border-indigo-500" placeholder="Silva" />
              {errors.last_name && <span className="text-red-500 text-xs">Obrigatório</span>}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário</label>
            <input {...register('username', { required: true })} className="w-full border border-gray-300 p-2 rounded outline-none focus:border-indigo-500" placeholder="ana.silva" />
            {errors.username && <span className="text-red-500 text-xs">Obrigatório</span>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" {...register('email', { required: true })} className="w-full border border-gray-300 p-2 rounded outline-none focus:border-indigo-500" placeholder="ana@email.com" />
            {errors.email && <span className="text-red-500 text-xs">Obrigatório</span>}
          </div>

          {/* Cidade e Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input {...register('city')} className="w-full border border-gray-300 p-2 rounded outline-none focus:border-indigo-500" placeholder="Sua cidade" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eu sou...</label>
              <select {...register('role')} className="w-full border border-gray-300 p-2 rounded bg-white outline-none focus:border-indigo-500">
                <option value="PARTICIPANT">Participante</option>
                <option value="ORGANIZER">Organizador</option>
              </select>
            </div>
          </div>

          {/* Senhas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input type="password" {...register('password', { required: true, minLength: 8 })} className="w-full border border-gray-300 p-2 rounded outline-none focus:border-indigo-500" />
              {errors.password && <span className="text-red-500 text-xs">Mín 8 caracteres</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar</label>
              <input type="password" {...register('confirm_password', { required: true })} className="w-full border border-gray-300 p-2 rounded outline-none focus:border-indigo-500" />
              {errors.confirm_password && <span className="text-red-500 text-xs">Não confere</span>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white py-3 rounded-md font-bold shadow-md mt-6 transition transform active:scale-95
              ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
            `}
          >
            {loading ? 'CRIANDO CONTA...' : 'FINALIZAR CADASTRO'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Já possui cadastro? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Faça Login</Link>
        </p>
      </div>
    </div>
  );
}
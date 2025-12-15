import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ImageIcon } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export function CreateEvent() {
  const { register, handleSubmit, watch } = useForm();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const bannerFile = watch('banner');

  useEffect(() => {
    if (bannerFile && bannerFile.length > 0 && bannerFile[0] instanceof File) {
      const url = URL.createObjectURL(bannerFile[0]);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [bannerFile]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('start_date', data.start_date);
    formData.append('location_address', data.location_address);
    formData.append('max_enrollments', data.max_enrollments || '');
    formData.append('requires_approval', data.requires_approval ? 'true' : 'false'); 
    
    if (data.banner && data.banner.length > 0) {
      formData.append('banner', data.banner[0]);
    }

    try {
      // Cria o evento
      const res = await api.post('/api/events/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('Rascunho criado! Publique o evento agora.', 'success');
      
      // Redireciona direto para o Gerenciador 
      navigate(`/manage/${res.data.id}`); 

    } catch (err: any) {
      console.error(err);
      
      if (err.response?.data) {
        const errors = err.response.data;
        
        // Verifica se o erro é na data
        if (errors.start_date) {
            showToast(`Data Inválida: ${errors.start_date[0]}`, 'error');
        } 
        // Verifica se é no título
        else if (errors.title) {
            showToast(`Título: ${errors.title[0]}`, 'error');
        }
        else {
            showToast('Erro ao criar evento. Verifique os campos.', 'error');
        }
      } else {
        showToast('Erro de conexão com o servidor.', 'error');
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar Novo Evento</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Banner Upload */}
        <div className="relative h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden group hover:bg-gray-100 transition">
          {preview ? (
            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon className="mx-auto mb-2 w-10 h-10 text-gray-300" />
              <span className="text-sm font-medium">Clique para adicionar banner</span>
              <p className="text-xs text-gray-400 mt-1">Recomendado: 800x400px</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            {...register('banner')} 
            className="absolute inset-0 opacity-0 cursor-pointer" 
          />
        </div>

        {/* Campos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título do Evento</label>
          <input {...register('title', {required: true})} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Workshop de React" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea {...register('description', {required: true})} rows={4} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Detalhes sobre o evento..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
            <input type="datetime-local" {...register('start_date', {required: true})} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input {...register('location_address', {required: true})} className="w-full border p-2 rounded outline-none" placeholder="Rua X, Bairro Y" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de Vagas</label>
             <input type="number" {...register('max_enrollments')} className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Deixe vazio para ilimitado" />
          </div>
          <div className="flex items-center pt-6">
             <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" {...register('requires_approval')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
               <span className="text-sm text-gray-700">Exige aprovação manual?</span>
             </label>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg disabled:opacity-70">
          {loading ? 'CRIANDO...' : 'PUBLICAR EVENTO'}
        </button>
      </form>
    </div>
  );
}
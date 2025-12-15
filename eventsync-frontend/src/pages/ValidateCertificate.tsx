import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { CheckCircle, XCircle, Search } from 'lucide-react';

export function ValidateCertificate() {
  const { code } = useParams<{ code: string }>(); 
  const [validationStatus, setValidationStatus] = useState<'loading' | 'valid' | 'invalid' | 'error'>('loading');
  
  // LINHA CORRIGIDA: Declara a variável de estado 'certificateData' e seu setter
  const [certificateData, setCertificateData] = useState<any>(null);

  useEffect(() => {
    // ... (lógica useEffect intacta) ...
    if (!code) {
      setValidationStatus('error');
      return;
    }
    
    const validate = async () => {
      try {
        const res = await api.get(`/api/certificates/validate_code/${code}`);
        
        if (res.data.valid) {
          setValidationStatus('valid');
          setCertificateData(res.data.certificate_details); 
        } else {
          setValidationStatus('invalid');
        }
      } catch (err: any) { 
        if (err.response && err.response.status === 404) {
          setValidationStatus('invalid'); 
        } else {
          setValidationStatus('error');
        }
      }
    };

    validate();
  }, [code]);


  const renderContent = () => {
    switch (validationStatus) {
      case 'loading':
        return (
          <div className="text-center p-8">
            <Search className="animate-pulse mx-auto text-indigo-500" size={32} />
            <p className="mt-4 text-gray-600">Verificando validade do código...</p>
          </div>
        );
      case 'valid':
        // AQUI USAMOS certificateData para exibir o nome do usuário/evento
        return (
          <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="mx-auto text-green-600" size={48} />
            <h2 className="text-2xl font-bold text-green-800 mt-4">Certificado Válido!</h2>
            {/* Exibe o nome do usuário se os dados existirem */}
            {certificateData?.user?.first_name && (
                <p className="mt-2 text-green-700">
                    Emitido para: <b>{certificateData.user.first_name} {certificateData.user.last_name}</b>
                </p>
            )}
            {/* Opcional: Mostrar o evento */}
            {certificateData?.event?.title && (
                <p className="mt-1 text-green-700">
                    Evento: <b>{certificateData.event.title}</b>
                </p>
            )}
          </div>
        );
      case 'invalid':
      case 'error':
        return (
          <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="mx-auto text-red-600" size={48} />
            <h2 className="text-2xl font-bold text-red-800 mt-4">Certificado Inválido</h2>
            <p className="mt-2 text-red-700">O código {code} não foi encontrado ou expirou.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Verificação de Certificado</h1>
      {renderContent()}
    </div>
  );
}
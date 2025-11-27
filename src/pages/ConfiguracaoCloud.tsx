import { useState, useEffect } from 'react';
import { Cloud, CheckCircle, XCircle, AlertCircle, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { initializeFirebase, isFirebaseInitialized, clearFirebase, type FirebaseConfig } from '../config/firebase';
import { cloudStorage } from '../utils/cloudStorage';
import { STORAGE_KEYS } from '../utils/storage';

const FIREBASE_CONFIG_KEY = 'srk_firebase_config';

export default function ConfiguracaoCloud() {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Carregar configuração salva
    const savedConfig = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        // Tentar inicializar se já houver configuração
        if (parsed.apiKey && parsed.projectId) {
          const success = initializeFirebase(parsed);
          setIsConnected(success);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    }

    // Verificar status atual
    setIsConnected(isFirebaseInitialized());
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Validar campos obrigatórios
      if (!config.apiKey || !config.authDomain || !config.projectId) {
        setMessage({ type: 'error', text: 'Preencha pelo menos: API Key, Auth Domain e Project ID' });
        setIsLoading(false);
        return;
      }

      // Salvar configuração
      localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));

      // Limpar conexão anterior
      clearFirebase();

      // Tentar inicializar
      const success = initializeFirebase(config);
      setIsConnected(success);

      if (success) {
        setMessage({ type: 'success', text: 'Configuração salva e conectada com sucesso!' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao conectar com Firebase. Verifique as credenciais.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Tem certeza que deseja desconectar do Firebase? Os dados continuarão apenas no navegador local.')) {
      clearFirebase();
      setIsConnected(false);
      setMessage({ type: 'info', text: 'Desconectado do Firebase. Dados serão salvos apenas localmente.' });
    }
  };

  const handleSyncAll = async () => {
    if (!cloudStorage.isAvailable()) {
      setMessage({ type: 'error', text: 'Firebase não está conectado!' });
      return;
    }

    setSyncing(true);
    setMessage({ type: 'info', text: 'Sincronizando todos os dados...' });

    try {
      const keys = Object.values(STORAGE_KEYS);
      let successCount = 0;
      let errorCount = 0;

      for (const key of keys) {
        try {
          const localData = localStorage.getItem(key);
          if (localData) {
            const items = JSON.parse(localData);
            if (Array.isArray(items) && items.length > 0) {
              await cloudStorage.syncFromLocal(key, items);
              successCount++;
            }
          }
        } catch (error) {
          console.error(`Erro ao sincronizar ${key}:`, error);
          errorCount++;
        }
      }

      setMessage({
        type: successCount > 0 ? 'success' : 'error',
        text: `Sincronização concluída: ${successCount} coleções sincronizadas${errorCount > 0 ? `, ${errorCount} erros` : ''}`,
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro na sincronização: ${error.message}` });
    } finally {
      setSyncing(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Cloud className="w-8 h-8 mr-3 text-primary-600" />
            Configuração de Armazenamento em Nuvem
          </h1>
          <p className="mt-2 text-gray-600">
            Configure o Firebase para sincronizar dados entre dispositivos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Conectado</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Desconectado</span>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : message.type === 'error' ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Credenciais do Firebase</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">API Key *</label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="AIza..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Auth Domain *</label>
            <input
              type="text"
              value={config.authDomain}
              onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="seu-projeto.firebaseapp.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Project ID *</label>
            <input
              type="text"
              value={config.projectId}
              onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="seu-projeto-id"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Storage Bucket</label>
            <input
              type="text"
              value={config.storageBucket}
              onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="seu-projeto.appspot.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Messaging Sender ID</label>
            <input
              type="text"
              value={config.messagingSenderId}
              onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="123456789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">App ID</label>
            <input
              type="text"
              value={config.appId}
              onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="1:123456789:web:abc123"
            />
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar e Conectar'}
          </button>
          {isConnected && (
            <>
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar Todos os Dados'}
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Desconectar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Guia Completo de Configuração
        </h3>
        <p className="text-sm text-blue-800 mb-3">
          Siga o guia passo a passo para configurar o Firebase corretamente:
        </p>
        <div className="bg-white rounded-lg p-3 mb-3">
          <a 
            href="/GUIA_CONFIGURACAO_FIREBASE.md" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium flex items-center"
          >
            📖 Abrir Guia Completo de Configuração
          </a>
        </div>
        <div className="border-t border-blue-200 pt-3 mt-3">
          <h4 className="font-semibold text-blue-900 mb-2 text-sm">Resumo Rápido:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Firebase Console</a></li>
            <li>Crie um novo projeto (ex: "sumitomo-sriko-itcc")</li>
            <li>Ative o <strong>Firestore Database</strong> (modo de teste)</li>
            <li>Vá em "Configurações do Projeto" (ícone ⚙️)</li>
            <li>Na seção "Seus apps", clique em "Web" (ícone &lt;/&gt;)</li>
            <li>Copie as credenciais do objeto de configuração</li>
            <li>Cole aqui e clique em "Salvar e Conectar"</li>
            <li>Clique em "Sincronizar Todos os Dados" para enviar os dados existentes</li>
          </ol>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Importante:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
          <li>Os dados serão sincronizados automaticamente entre todos os dispositivos conectados</li>
          <li>O sistema funciona offline usando localStorage como backup</li>
          <li>Quando conectado, as mudanças são sincronizadas em tempo real</li>
          <li>Você pode usar o botão "Sincronizar Todos os Dados" para forçar uma sincronização completa</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">✅ Vantagens do Firebase:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
          <li><strong>Suporta milhares de usuários simultâneos</strong> (perfeito para 2000+ funcionários)</li>
          <li><strong>Todas as buscas automáticas funcionam perfeitamente</strong> em tempo real</li>
          <li>Sincronização automática entre todos os dispositivos</li>
          <li>Funciona offline (com cache local)</li>
          <li>Escalável e confiável</li>
          <li>Sem conflitos de escrita ou corrupção de dados</li>
        </ul>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 mb-2">🚨 Por que NÃO usar Pasta Compartilhada:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
          <li><strong>NÃO recomendado para empresas com muitos funcionários (2000+ usuários)</strong></li>
          <li>Pasta compartilhada pode causar conflitos de escrita e corrupção de dados</li>
          <li>Performance muito lenta com muitos acessos simultâneos</li>
          <li>Buscas automáticas podem não funcionar corretamente</li>
          <li>Firebase Firestore é a solução recomendada para escalabilidade e confiabilidade</li>
        </ul>
      </div>
    </div>
  );
}


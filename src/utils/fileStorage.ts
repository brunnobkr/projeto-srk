// Sistema de armazenamento em pasta compartilhada (alternativa ao Firebase)
// ATENÇÃO: Esta solução NÃO é recomendada para mais de 50 usuários simultâneos
// Para empresas com muitos funcionários, use Firebase Firestore

export interface FileStorageConfig {
  path: string; // Caminho da pasta compartilhada (ex: \\servidor\dados\srk)
  enabled: boolean;
}

const CONFIG_KEY = 'srk_file_storage_config';

export const fileStorage = {
  // Verificar se o File System Access API está disponível (navegadores modernos)
  isFileSystemAvailable: (): boolean => {
    return 'showDirectoryPicker' in window;
  },

  // Salvar configuração
  saveConfig: (config: FileStorageConfig): void => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  },

  // Carregar configuração
  loadConfig: (): FileStorageConfig | null => {
    try {
      const config = localStorage.getItem(CONFIG_KEY);
      return config ? JSON.parse(config) : null;
    } catch {
      return null;
    }
  },

  // Verificar se está habilitado
  isEnabled: (): boolean => {
    const config = fileStorage.loadConfig();
    return config?.enabled === true && config?.path !== '';
  },

  // Salvar arquivo JSON na pasta compartilhada
  saveFile: async (_filename: string, _data: any): Promise<boolean> => {
    if (!fileStorage.isEnabled()) {
      return false;
    }

    try {
      // Usar File System Access API se disponível
      if (fileStorage.isFileSystemAvailable()) {
        // Esta API requer interação do usuário para selecionar a pasta
        // Por isso, a pasta deve ser selecionada uma vez e salva
        const config = fileStorage.loadConfig();
        if (!config?.path) {
          return false;
        }

        // Nota: File System Access API não permite acesso direto a caminhos de rede
        // Seria necessário usar uma API backend ou WebDAV
        console.warn('File System Access API não suporta caminhos de rede diretamente');
        return false;
      }

      // Alternativa: usar fetch para enviar para um servidor que salva na pasta
      // Isso requer um backend
      return false;
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      return false;
    }
  },

  // Carregar arquivo JSON da pasta compartilhada
  loadFile: async (_filename: string): Promise<any | null> => {
    if (!fileStorage.isEnabled()) {
      return null;
    }

    try {
      // Similar ao saveFile, requer backend ou WebDAV
      return null;
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      return null;
    }
  },
};

// IMPORTANTE: Para usar pasta compartilhada com 2000 funcionários, você precisaria:
// 1. Um servidor backend (Node.js, Python, etc.) que acesse a pasta compartilhada
// 2. API REST para ler/escrever arquivos
// 3. Sistema de cache e sincronização
// 4. Controle de concorrência (locks)
//
// RECOMENDAÇÃO: Use Firebase Firestore que já está implementado e é muito mais adequado


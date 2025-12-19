// Sistema de Segurança e Proteção do Código

// ⚠️ CONFIGURAÇÃO: Para DESABILITAR todas as proteções, altere para true
// Quando desabilitado, o sistema não pedirá senha e não aplicará proteções
const DISABLE_SECURITY = true; // Altere para true para remover todas as proteções

// Senha de desenvolvimento/segurança
const DEV_PASSWORD = 'SRK2024DEV@SECURE';

// Verificar se está em modo desenvolvimento
const isDevMode = () => {
  return (import.meta.env?.DEV as boolean) || window.location.hostname === 'localhost';
};

// Proteção contra DevTools
export const protectDevTools = () => {
  if (isDevMode()) return; // Não proteger em desenvolvimento

  const devtools = { open: false };
  const element = new Image();
  
  Object.defineProperty(element, 'id', {
    get: function() {
      devtools.open = true;
      if (devtools.open) {
        document.body.innerHTML = '';
        document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Acesso Negado</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                background: #1a1a1a; 
                color: #fff; 
                margin: 0;
              }
              .container { text-align: center; padding: 20px; }
              h1 { color: #ff4444; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️ Acesso Negado</h1>
              <p>Ferramentas de desenvolvedor detectadas.</p>
              <p>Este sistema está protegido.</p>
            </div>
          </body>
          </html>
        `);
      }
    }
  });

  setInterval(() => {
    devtools.open = false;
    console.log(element);
    if (devtools.open) {
      document.body.innerHTML = '';
      document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Acesso Negado</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              background: #1a1a1a; 
              color: #fff; 
              margin: 0;
            }
            .container { text-align: center; padding: 20px; }
            h1 { color: #ff4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Acesso Negado</h1>
            <p>Ferramentas de desenvolvedor detectadas.</p>
            <p>Este sistema está protegido.</p>
          </div>
        </body>
        </html>
      `);
    }
  }, 500);
};

// Proteção contra cópia de texto
export const protectCopy = () => {
  if (isDevMode()) return;

  // Desabilitar seleção de texto
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  });

  // Desabilitar cópia
  document.addEventListener('copy', (e) => {
    e.preventDefault();
    return false;
  });

  // Desabilitar botão direito
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Desabilitar atalhos de teclado
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, F12
    if (
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
      (e.ctrlKey && e.key === 'U') ||
      e.key === 'F12'
    ) {
      e.preventDefault();
      return false;
    }
  });

  // Proteger contra drag and drop
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });
};

// Proteção do console
export const protectConsole = () => {
  if (isDevMode()) return;

  // Sobrescrever console
  const noop = () => {};
  const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace'];
  
  methods.forEach(method => {
    (window.console as any)[method] = noop;
  });

  // Proteger console object
  Object.defineProperty(window, 'console', {
    value: {},
    writable: false,
    configurable: false
  });
};

// Sistema de senha de segurança
export const checkSecurityPassword = (): boolean => {
  if (DISABLE_SECURITY) return true; // Se segurança desabilitada, sempre permitir
  if (isDevMode()) return true;

  const savedPassword = sessionStorage.getItem('srk_dev_password');
  if (savedPassword === DEV_PASSWORD) {
    return true;
  }

  const password = prompt('🔒 Senha de Segurança do Sistema:\n\nEste código está protegido. Digite a senha de desenvolvimento para continuar:');
  
  if (password === DEV_PASSWORD) {
    sessionStorage.setItem('srk_dev_password', DEV_PASSWORD);
    return true;
  } else {
    alert('❌ Senha incorreta. Acesso negado.');
    window.location.href = 'about:blank';
    return false;
  }
};

// Ofuscação básica de strings sensíveis
export const obfuscate = (str: string): string => {
  return btoa(str).split('').reverse().join('');
};

export const deobfuscate = (str: string): string => {
  return atob(str.split('').reverse().join(''));
};

// Inicializar todas as proteções
export const initSecurity = () => {
  // Se a segurança estiver desabilitada, não aplicar nenhuma proteção
  if (DISABLE_SECURITY) {
    console.log('🔓 Proteções de segurança desabilitadas pela configuração');
    return;
  }

  if (isDevMode()) {
    console.log('🔓 Modo de desenvolvimento ativo - Proteções desabilitadas');
    return;
  }

  // Verificar senha primeiro (não bloquear se já estiver autenticado)
  // A senha é salva no sessionStorage, então persiste durante o refresh
  const savedPassword = sessionStorage.getItem('srk_dev_password');
  if (savedPassword !== DEV_PASSWORD) {
    if (!checkSecurityPassword()) {
      return;
    }
  }

  // Aplicar proteções
  protectDevTools();
  protectCopy();
  protectConsole();

  // Proteção adicional: detectar tentativas de inspeção
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (url.includes('view-source:') || url.includes('chrome-extension://')) {
        window.location.href = 'about:blank';
      }
    }
  }).observe(document, { subtree: true, childList: true });
};

// Proteção contra minificação de código
export const preventCodeInspection = () => {
  if (isDevMode()) return;

  // Adicionar código ofuscado que será difícil de remover
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(script => {
    script.addEventListener('error', () => {
      window.location.reload();
    });
  });
};


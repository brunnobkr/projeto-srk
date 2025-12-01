import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
// import { initSecurity } from './utils/security' // Proteção desabilitada

// Garantir que o React está disponível
if (!React || !ReactDOM) {
  console.error('React não foi carregado corretamente!');
  throw new Error('React não foi carregado corretamente');
}

// Inicializar sistema de segurança
// initSecurity(); // Proteção desabilitada

// Registrar Service Worker para PWA
// Detecta o base path automaticamente para funcionar com GitHub Pages
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Detecta base path: se a URL contém /repositorio/, o base path é /repositorio/
    const basePath = import.meta.env.BASE_URL || '/';
    const swPath = basePath + 'sw.js';
    
    navigator.serviceWorker.register(swPath, { scope: basePath })
      .then((registration) => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
      })
      .catch((error) => {
        console.log('Falha ao registrar Service Worker:', error);
      });
  });
}

// Garantir que o elemento root existe antes de renderizar
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento root não encontrado!');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)


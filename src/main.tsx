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
  console.error('Elemento root não encontrado! Tentando criar...');
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  ReactDOM.createRoot(newRoot).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>,
  );
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Erro ao renderizar aplicação:', error);
    // Tentar renderizar novamente após um pequeno delay
    setTimeout(() => {
      if (rootElement) {
        ReactDOM.createRoot(rootElement).render(
          <React.StrictMode>
            <AuthProvider>
              <App />
            </AuthProvider>
          </React.StrictMode>,
        );
      }
    }, 100);
  }
}


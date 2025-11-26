import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // Base path para GitHub Pages
  // Em desenvolvimento: '/' (raiz)
  // Em produção: '/nome-do-repositorio/' (definido via VITE_BASE_PATH no workflow)
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      // Desabilitar registro automático - vamos usar o service worker manual
      injectRegister: false,
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Sumitomo S-riko - Controle ITCC',
        short_name: 'ITCC',
        description: 'Sistema de Controle ITCC - Sumitomo S-riko',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      // Não gerar service worker automaticamente
      workbox: false
    })
  ],
  resolve: {
    dedupe: ['react', 'react-dom'], // Garantir que há apenas uma versão do React
    alias: {
      // Garantir que o React seja resolvido corretamente
      'react': 'react',
      'react-dom': 'react-dom',
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'], // Forçar pré-empacotamento do React
  },
  server: {
    host: '0.0.0.0', // Permite acesso via IP na rede local
  },
  build: {
    minify: 'esbuild', // Usar esbuild que já vem com Vite
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Configuração para preview (teste local do build)
  preview: {
    port: 4173,
    host: true,
  },
})


// Service Worker para PWA
const CACHE_NAME = 'itcc-v3'; // Atualizado para GitHub Pages

// Detectar base path automaticamente
// Se estiver em GitHub Pages, o base path será /nome-do-repositorio/
// Se estiver em localhost, será /
function getBasePath() {
  const path = self.location.pathname;
  // Se o service worker está em /repositorio/sw.js, o base path é /repositorio/
  // Se está em /sw.js, o base path é /
  const swPathIndex = path.lastIndexOf('/sw.js');
  if (swPathIndex > 0) {
    return path.substring(0, swPathIndex + 1);
  }
  return '/';
}

const BASE_PATH = getBasePath();

// URLs para cache (ajustadas com base path)
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + '404.html'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto com base path:', BASE_PATH);
        // Adiciona URLs ao cache, ignorando erros de URLs que podem não existir
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn('Erro ao adicionar ao cache (ignorado):', url, err);
            })
          )
        );
      })
  );
  // Força ativação imediata do novo service worker
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        // Forçar controle de todas as abas
        return self.clients.claim();
      });
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Ignorar requisições que não sejam HTTP/HTTPS
  // chrome-extension, data:, blob:, etc. não são suportados pelo Cache API
  try {
    const url = new URL(request.url);
    // Verificar se é um protocolo suportado
    if (!url.protocol.startsWith('http')) {
      return; // Deixa o navegador lidar com essas requisições normalmente
    }
  } catch {
    // Se não conseguir criar URL, ignorar a requisição
    return;
  }
  
  // Verificar se o método é GET (único método suportado pelo cache)
  if (request.method !== 'GET') {
    return;
  }
  
  // Verificar se a requisição é para o mesmo origin (mesmo domínio)
  try {
    const requestUrl = new URL(request.url);
    const selfUrl = new URL(self.location.href);
    // Se não for do mesmo origin, não fazer cache
    if (requestUrl.origin !== selfUrl.origin) {
      return fetch(request);
    }
  } catch {
    return fetch(request);
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - retorna resposta
        if (response) {
          return response;
        }
        
        // Se for uma rota (não tem extensão de arquivo), tentar index.html
        const url = new URL(request.url);
        const pathname = url.pathname;
        const isRoute = !pathname.includes('.') || pathname.endsWith('/');
        
        if (isRoute && pathname.startsWith(BASE_PATH)) {
          // Tentar buscar index.html para rotas
          const indexUrl = new URL(BASE_PATH + 'index.html', request.url);
          return caches.match(indexUrl).then(cachedIndex => {
            if (cachedIndex) {
              return cachedIndex;
            }
            return fetch(request);
          });
        }
        
        return fetch(request).then(
          (response) => {
            // Verifica se recebemos uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              // Se for 404 e for uma rota, retornar index.html
              if (response.status === 404 && isRoute) {
                return caches.match(BASE_PATH + 'index.html').then(cachedIndex => {
                  return cachedIndex || response;
                });
              }
              return response;
            }
            
            // Verificar novamente se a URL é válida antes de fazer cache
            try {
              const cacheUrl = new URL(request.url);
              // Só fazer cache de requisições HTTP/HTTPS válidas do mesmo origin
              if (cacheUrl.protocol.startsWith('http') && 
                  !cacheUrl.protocol.includes('chrome-extension') &&
                  !cacheUrl.protocol.includes('moz-extension') &&
                  !cacheUrl.protocol.includes('safari-extension') &&
                  cacheUrl.origin === new URL(self.location.href).origin) {
                // IMPORTANTE: Clona a resposta
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseToCache).catch((err) => {
                      // Silenciosamente ignorar erros de cache
                      console.warn('Erro ao fazer cache (ignorado):', err.message);
                    });
                  })
                  .catch((err) => {
                    // Silenciosamente ignorar erros
                    console.warn('Erro ao abrir cache (ignorado):', err.message);
                  });
              }
            } catch (e) {
              // Se houver erro ao processar URL, apenas retornar a resposta sem cache
              console.warn('Erro ao processar URL para cache (ignorado):', e.message);
            }
            return response;
          }
        ).catch((error) => {
          console.warn('Erro ao buscar recurso:', error);
          // Se for uma rota e falhar, tentar index.html
          if (isRoute) {
            return caches.match(BASE_PATH + 'index.html').then(cachedIndex => {
              return cachedIndex || new Response('Erro ao carregar recurso', { status: 503 });
            });
          }
          return new Response('Erro ao carregar recurso', { status: 503 });
        });
      })
      .catch((error) => {
        // Se houver erro ao acessar cache, buscar normalmente
        console.warn('Erro ao acessar cache:', error);
        return fetch(request);
      })
  );
});


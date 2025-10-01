import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'

// Limpa caches antigos
cleanupOutdatedCaches()

// Precache dos recursos gerados pelo Vite
precacheAndRoute(self.__WB_MANIFEST)

// Estratégias de cache customizadas
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 5,
  })
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        return `${request.url}?version=1`
      }
    }]
  })
)

registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources'
  })
)

// Eventos customizados
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Notificação de status online/offline
self.addEventListener('online', () => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'online' })
    })
  })
})

// Background Sync para tarefas
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks())
  }
})

async function syncTasks() {
  try {
    // Implementar sincronização de tarefas quando voltar online
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({ type: 'sync-tasks' })
    })
  } catch (error) {
    console.error('Erro ao sincronizar tarefas:', error)
  }
}
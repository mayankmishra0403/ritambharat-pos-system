import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute'
import { registerRoute } from 'workbox-routing/registerRoute'
import { StaleWhileRevalidate } from 'workbox-strategies/StaleWhileRevalidate'
import { ExpirationPlugin } from 'workbox-expiration/ExpirationPlugin'
import { CacheableResponsePlugin } from 'workbox-cacheable-response/CacheableResponsePlugin'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    ])
  )
})

registerRoute(
  /^https:\/\/.*\/api\/menu.*/,
  new StaleWhileRevalidate({
    cacheName: 'menu-api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

registerRoute(
  /^https:\/\/.*\/api\/restaurant.*/,
  new StaleWhileRevalidate({
    cacheName: 'restaurant-api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 })
    ]
  })
)

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const options = {
    body: data.body || 'New update',
    icon: data.icon || '/favicon.png',
    badge: data.badge || '/favicon.png',
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    ...(data.sound ? { sound: data.sound } : {})
  }
  event.waitUntil(self.registration.showNotification(data.title || 'Ritam POS', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})

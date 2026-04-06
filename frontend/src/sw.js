// Star Crumbs Service Worker v3.0
// Compatible: Chrome, Edge, Firefox (desktop+Android), Safari macOS 16+, Safari iOS 16.4+ (PWA), Samsung Internet
const CACHE_NAME = 'star-crumbs-v3';
const STATIC_ASSETS = ['/', '/index.html', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // No interceptar llamadas a la API ni a socket.io
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;
  // Navegación: intentar red, fallback a index.html (SPA)
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
    return;
  }
  // Activos estáticos: red primero, guardar en caché, fallback a caché
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// ─── PUSH NOTIFICATIONS ────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  // Valores por defecto si el payload falla o viene vacío
  let data = {
    title: 'Star Crumbs 🍪',
    body: 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: '/'
  };

  if (e.data) {
    try {
      data = { ...data, ...e.data.json() };
    } catch (_) {
      // Si el JSON falla, usar el texto plano como body
      data.body = e.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: { url: data.url },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    // tag agrupa notificaciones del mismo tipo (evita spam visual)
    tag: data.tag || 'star-crumbs-notif',
    // renotify: true muestra la notificación aunque ya haya una con el mismo tag
    renotify: true
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── NOTIFICATION CLICK ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || '/';

  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Buscar una pestaña ya abierta con la app
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            // Navegar a la URL objetivo y enfocar la pestaña
            return client.navigate(targetUrl).then(c => c && c.focus ? c.focus() : null);
          }
        }
        // No hay pestaña abierta: abrir una nueva
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ─── PUSH SUBSCRIPTION CHANGE ──────────────────────────────────────────────
// Se dispara cuando el navegador invalida la suscripción (raro pero posible)
self.addEventListener('pushsubscriptionchange', (e) => {
  e.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: e.oldSubscription?.options?.applicationServerKey
    }).then(newSub => {
      // Notificar al backend con la nueva suscripción
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: newSub.endpoint,
          keys: newSub.toJSON().keys
        })
      });
    }).catch(() => {})
  );
});

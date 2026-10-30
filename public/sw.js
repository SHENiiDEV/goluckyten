// GoLuckyTen service worker: offline page, cached build assets, push notifications.
const VERSION = 'lt-v2';
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(VERSION).then((c) => c.addAll([OFFLINE, '/images/brand/icon-192.png'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== location.origin) return;

    // Hashed build files never change: cache first.
    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/images/brand/')) {
        event.respondWith(
            caches.match(req).then((hit) => hit || fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(VERSION).then((c) => c.put(req, copy));
                return res;
            })),
        );
        return;
    }

    // Pages: always fresh from the network (prices, tickets left), offline page as fallback.
    if (req.mode === 'navigate') {
        event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    }
});

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: 'GoLuckyTen', body: event.data?.text() };
    }
    event.waitUntil(
        self.registration.showNotification(data.title || 'GoLuckyTen', {
            body: data.body || '',
            icon: '/images/brand/icon-192.png',
            badge: '/images/brand/favicon-32.png',
            data: { url: data.url || '/account/notifications' },
            tag: data.tag,
        }),
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = event.notification.data?.url || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
            for (const w of wins) {
                if ('focus' in w) {
                    w.navigate(target);
                    return w.focus();
                }
            }
            return self.clients.openWindow(target);
        }),
    );
});

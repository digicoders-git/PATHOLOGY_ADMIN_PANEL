importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCGlmY-ior7xqv_-4PiQcs1CoePb7IDM90',
  authDomain: 'collegepanel-1027b.firebaseapp.com',
  projectId: 'collegepanel-1027b',
  storageBucket: 'collegepanel-1027b.firebasestorage.app',
  messagingSenderId: '335340683871',
  appId: '1:335340683871:web:9142931f719c20be5bd1ea'
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const title = payload.notification?.title || 'New Notification';
  const body = payload.notification?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'pathology-notification',
    requireInteraction: true,
    data: payload.data || {}
  });
});

// Notification click — open app and go to bookings
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate('/dashboard/bookings');
          return;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/dashboard/bookings');
      }
    })
  );
});

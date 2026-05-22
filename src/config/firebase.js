import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyCGlmY-ior7xqv_-4PiQcs1CoePb7IDM90',
  authDomain: 'collegepanel-1027b.firebaseapp.com',
  projectId: 'collegepanel-1027b',
  storageBucket: 'collegepanel-1027b.firebasestorage.app',
  messagingSenderId: '335340683871',
  appId: '1:335340683871:web:9142931f719c20be5bd1ea',
  measurementId: 'G-ZX7PQLL6CL'
};

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const VAPID_KEY = 'BPERg2BAS_k4Bq2pvQc4CWQq0RJNn_OSPv-qXNSkiYnqi15qWctR8Ha8cBxki22nE7NQi5J2rL1LzDNHHT8Cf3M';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Step 1: Register service worker + get FCM token
export const requestNotificationPermission = async () => {
  try {
    // Check browser support
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Register service worker first
    let swRegistration = null;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
        console.log('Service Worker ready:', swRegistration.scope);
      } catch (err) {
        console.error('Service Worker registration failed:', err);
      }
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration || undefined
    });

    if (token) {
      console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    }

    console.warn('No FCM token available');
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Step 2: Listen for foreground messages (when app is open/focused)
export const setupMessageListener = (onNotificationReceived) => {
  onMessage(messaging, (payload) => {
    console.log('📩 Foreground message received:', payload);

    const title = payload.notification?.title || 'New Notification';
    const body = payload.notification?.body || '';
    const data = payload.data || {};

    // Show browser notification via service worker (works in foreground too)
    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'pathology-notification-' + Date.now(),
          requireInteraction: true,
          data
        });
      });
    }

    // Also call callback to update UI
    if (onNotificationReceived) {
      onNotificationReceived({ title, body, data });
    }
  });
};

// Save FCM token to backend
export const saveFCMTokenToBackend = async (token, authToken) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/notifications/save-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    console.log('✅ FCM token saved to backend:', data);
    return data;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return null;
  }
};

// Remove FCM token from backend
export const removeFCMTokenFromBackend = async (token, authToken) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/notifications/remove-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return null;
  }
};

export default messaging;

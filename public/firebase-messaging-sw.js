
// This file must be in the `public` directory.
// It uses importScripts to load the Firebase SDK, as ES6 modules are not universally supported in service workers.

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// This is a placeholder for the firebase config that will be passed via query parameter or defined globally.
let firebaseConfig = self.firebaseConfig || null;

try {
  // The service worker might be registered with the firebase config in the URL.
  const urlParams = new URLSearchParams(self.location.search);
  const firebaseConfigParam = urlParams.get('firebaseConfig');
  if (firebaseConfigParam) {
    firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigParam));
  }
} catch (e) {
  // Ignore error if not in URL
}


if (firebaseConfig) {
  // Initialize the Firebase app in the service worker
  if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
  } else {
      firebase.app(); // if already initialized, use that one
  }

  // Retrieve an instance of Firebase Messaging so that it can handle background messages.
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Customize notification here
    const notificationTitle = payload.notification.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification.body || 'You have a new message.',
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      data: {
        url: payload.fcmOptions?.link || self.location.origin, // Fallback to origin
      },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  // Handle notification click
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
      self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      }).then((clientList) => {
        // If a window is already open, focus it.
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window.
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  });
} else {
  console.error('Firebase config not found in service worker. Background notifications will not work.');
}

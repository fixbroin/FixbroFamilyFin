// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Parse the config from the query string
const urlParams = new URLSearchParams(self.location.search);
const firebaseConfigStr = urlParams.get('firebaseConfig');

if (firebaseConfigStr) {
  try {
    const firebaseConfig = JSON.parse(decodeURIComponent(firebaseConfigStr));
    
    // Initialize the Firebase app in the service worker
    firebase.initializeApp(firebaseConfig);
    
    // Retrieve an instance of Firebase Messaging so that it can handle background messages.
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage(function(payload) {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      // Customize notification here
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/apple-touch-icon.png'
      };
    
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (e) {
    console.error('Error parsing Firebase config in service worker:', e);
  }
} else {
  console.error('Firebase config not found in service worker query string.');
}

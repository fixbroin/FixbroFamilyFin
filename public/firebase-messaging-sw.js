// This file MUST be in the /public directory
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Parse the config from the query string
const urlParams = new URLSearchParams(self.location.search);
const firebaseConfig = JSON.parse(decodeURIComponent(urlParams.get('firebaseConfig')));

// Initialize the Firebase app in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  if (!payload.notification) {
    return;
  }
  
  // Customize the notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/apple-touch-icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

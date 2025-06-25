
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, isSupported } from "firebase/messaging";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db)
    .catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a time.
        console.warn('Firebase persistence failed: multiple tabs open.');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firebase persistence not available in this browser.');
    }
});


const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        const encodedFirebaseConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
        navigator.serviceWorker
            .register(`/firebase-messaging-sw.js?firebaseConfig=${encodedFirebaseConfig}`)
            .then(function (registration) {
                console.log("Service worker successfully registered.");
                return registration;
            })
            .catch(function (err) {
                console.error("Unable to register service worker.", err);
            });
    }
}

const getFcmToken = async () => {
    const supported = await isSupported();
    if (!supported) {
        console.log("Firebase Messaging is not supported in this browser.");
        return null;
    }
    
    try {
        const messaging = getMessaging(app);
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const fcmToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            if (fcmToken) {
                return fcmToken;
            }
            console.log("No registration token available. Request permission to generate one.");
            return null;
        }
        console.log("Unable to get permission to notify.");
        return null;
    } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
        return null;
    }
};

export { app, auth, db, storage, getFcmToken, registerServiceWorker };

// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBZ1LJqVx0LHMmaDJXFSWmY0rH_RXXxDDw',
  projectId: 'traslado-placas',
  messagingSenderId: '660478589201',
  appId: '1:660478589201:web:5b527c609312a9a63334b0',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('📩 Notificación en segundo plano:', payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon,
  });
});

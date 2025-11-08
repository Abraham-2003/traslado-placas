import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseApp, db } from '../firebase/firebase'; 

const messaging = getMessaging(firebaseApp);

// Solicita permiso y guarda el token en Firestore
export const solicitarPermisoNotificacion = async (uid) => {
  try {
    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BGtXSlLIk_NTIBMqr5lLRfCOvudeam-u4jzXDjg_H2DfGAJpawM2ioXZNPhfU7caKWhceGE2XwPCHdTnNdLdWlY',
      });
      console.log('Token FCM:', token);

      await setDoc(doc(db, 'usuarios', uid), {
        fcmToken: token,
      }, { merge: true });
    } else {
      console.warn('Permiso de notificación denegado');
    }
  } catch (error) {
    console.error('Error al obtener token FCM:', error);
  }
};

// Escucha notificaciones cuando la app está abierta
onMessage(messaging, (payload) => {
  if (Notification.permission === 'granted') {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: payload.notification.icon,
    });
  }
});

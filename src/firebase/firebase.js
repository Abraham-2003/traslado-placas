import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBZ1LJqVx0LHMmaDJXFSWmY0rH_RXXxDDw",
  authDomain: "traslado-placas.firebaseapp.com",
  projectId: "traslado-placas",
  storageBucket: "traslado-placas.firebasestorage.app", 
  messagingSenderId: "660478589201",
  appId: "1:660478589201:web:5b527c609312a9a63334b0"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const db = getFirestore(app);
const messaging = getMessaging(app);

export { auth, db, messaging };
export default app; 

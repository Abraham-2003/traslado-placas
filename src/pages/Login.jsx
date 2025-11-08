import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db, messaging } from '../firebase/firebase';
import { showAlert } from '../utils/alerts';
import { getToken } from 'firebase/messaging';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const registrarTokenFCM = async (uid) => {
    try {
      const token = await getToken(messaging, {
        vapidKey: 'BGtXSlLIk_NTIBMqr5lLRfCOvudeam-u4jzXDjg_H2DfGAJpawM2ioXZNPhfU7caKWhceGE2XwPCHdTnNdLdWlY',
      });

      if (!token) {
        console.warn('⚠️ No se obtuvo token FCM');
        return;
      }

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().role === 'admin') {
        await setDoc(userRef, { fcmToken: token }, { merge: true });
        console.log('✅ Token FCM guardado para administrador:', token);
      } else {
        console.log('🔒 Usuario no es administrador, no se guarda token');
      }
    } catch (error) {
      console.error('❌ Error al registrar token FCM:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await registrarTokenFCM(uid); // registra el token si es admin

      navigate('/');
    } catch (error) {
      showAlert('Error de acceso', error.message, 'error');
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-10 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8 tracking-tight">
          Acceso al sistema
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-2 rounded-md font-medium hover:bg-gray-900 transition duration-200"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );

}

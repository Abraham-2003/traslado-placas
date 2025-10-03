import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;
        const nombre = userDoc.exists() ? userDoc.data().nombre : null;
        const centroId = userDoc.exists() ? userDoc.data().centroId : null;
        const userData = { uid: firebaseUser.uid, email: firebaseUser.email, role, nombre, centroId };
        console.log('Usuario autenticado:', userData);
        setUser(userData);
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        setUser(null);
      }
      setLoading(false);
    } else {
      setUser(null);
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, []);


  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { auth } from './firebase/firebase';
import Login from './pages/Login';
import AdminRoutes from './routes/AdminRoutes';
import ManagerRoutes from './routes/ManagerRoutes';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-600 text-sm">Cargando sesión...</span>
      </div>
    );
  }

  const RedirectByRole = () => {
    if (user?.role === 'admin') return <Navigate to="/admin" />;
    if (user?.role === 'Encargado') return <Navigate to="/Encargado" />;
    if (auth.currentUser) return null; 
    return <Navigate to="/login" />;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RedirectByRole />} />
      {user?.role === 'admin' && (
        <Route path="/admin/*" element={<AdminRoutes />} />
      )}
      {user?.role === 'Encargado' && (
        <Route path="/Encargado/*" element={<ManagerRoutes />} />
      )}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;

import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../componets/layout/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import Centros from '../pages/admin/Centros';
import Usuarios from '../pages/admin/Usuarios';
import Historial from '../pages/admin/Historial';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="centros" element={<Centros />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="historial" element={<Historial />} />
      </Route>
    </Routes>
  );
}

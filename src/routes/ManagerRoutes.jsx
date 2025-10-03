import { Routes, Route } from 'react-router-dom';
import ManagerLayout from '../componets/layout/ManagerLayout';
import Dashboard from '../pages/manager/Dashboard';
import TrasladoPlacas from '../pages/manager/TrasladoPlacas';


export default function ManagerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ManagerLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="Formulario" element={<TrasladoPlacas />} />
      </Route>
    </Routes>
  );
}

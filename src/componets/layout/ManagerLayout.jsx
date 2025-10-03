import Navbar from '../common/NabvarManager';
import { Outlet } from 'react-router-dom';

export default function ManagerLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}

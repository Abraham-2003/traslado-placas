import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, HomeIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase';

export default function NavbarGerente() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md flex justify-around py-2 z-50">
      <NavLink
        to="/Encargado"
        className={({ isActive }) =>
          `flex flex-col items-center text-xs ${
            isActive ? 'text-gray-800 font-semibold' : 'text-gray-500'
          }`
        }
      >
        <HomeIcon className="h-5 w-5 mb-1" />
        Dashboard
      </NavLink>

      <NavLink
        to="/Encargado/Formulario"
        className={({ isActive }) =>
          `flex flex-col items-center text-xs ${
            isActive ? 'text-gray-800 font-semibold' : 'text-gray-500'
          }`
        }
      >
        <ClipboardDocumentIcon className="h-5 w-5 mb-1" />
        Traslado
      </NavLink>

      <button
        onClick={handleLogout}
        className="flex flex-col items-center text-xs text-red-600"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5 mb-1" />
        Salir
      </button>
    </nav>
  );
}

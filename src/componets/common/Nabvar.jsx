import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Título */}
        <div className="text-lg sm:text-xl font-semibold text-gray-800">
          Panel Administrador
          {user?.nombre && (
            <span className="text-sm text-gray-500 ml-2">| {user.nombre}</span>
          )}
        </div>

        {/* Botón hamburguesa */}
        <button
          className="sm:hidden text-gray-600 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Menú horizontal (escritorio) */}
        <div className="hidden sm:flex items-center space-x-6">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 font-medium border-b-2 border-gray-600 pb-1'
                : 'text-gray-700 hover:text-blue-600'
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/centros"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 font-medium border-b-2 border-gray-600 pb-1'
                : 'text-gray-700 hover:text-blue-600'
            }
          >
            Centros
          </NavLink>
          <NavLink
            to="/admin/usuarios"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 font-medium border-b-2 border-gray-600 pb-1'
                : 'text-gray-700 hover:text-blue-600'
            }
          >
            Usuarios
          </NavLink>
          <NavLink
            to="/admin/historial"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 font-medium border-b-2 border-gray-600 pb-1'
                : 'text-gray-700 hover:text-blue-600'
            }
          >
            Historial
          </NavLink>
          <button
            onClick={handleLogout}
            className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Menú desplegable (móvil) */}
      {menuOpen && (
        <div className="sm:hidden mt-4 space-y-2">
          <NavLink
            to="/admin"
            className="block text-gray-700 hover:text-blue-600"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/centros"
            className="block text-gray-700 hover:text-blue-600"
            onClick={() => setMenuOpen(false)}
          >
            Centros
          </NavLink>
          <NavLink
            to="/admin/usuarios"
            className="block text-gray-700 hover:text-blue-600"
            onClick={() => setMenuOpen(false)}
          >
            Usuarios
          </NavLink>
          <NavLink
            to="/admin/historial"
            className="block text-gray-700 hover:text-blue-600"
            onClick={() => setMenuOpen(false)}
          >
            Historial
          </NavLink>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
            className="w-full text-left bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-900 transition"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}

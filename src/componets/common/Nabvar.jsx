import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
            <div className="text-xl font-semibold text-gray-800">
        Panel Administrador
        {user?.nombre && (
          <span className="text-sm text-gray-500 ml-2">| {user.nombre}</span>
        )}
      </div>

            <div className="flex items-center space-x-6">
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
                            : 'text-gray-700 hover:text-gray-600'
                    }
                >
                    Usuarios
                </NavLink>
                <NavLink
                    to="/admin/historial"
                    className={({ isActive }) =>
                        isActive
                            ? 'text-blue-600 font-medium border-b-2 border-gray-600 pb-1'
                            : 'text-gray-700 hover:gray-blue-600'
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
        </nav>
    );
}

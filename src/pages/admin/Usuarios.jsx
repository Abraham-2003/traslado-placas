import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { db, auth } from '../../firebase/firebase';
import { showAlert } from '../../utils/alerts';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    id: '',
    nombre: '',
    correo: '',
    contraseña: '',
    role: '',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsuarios(lista);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.correo,
        form.contraseña
      );
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'users', uid), {
        nombre: form.nombre,
        email: form.correo,
        role: form.role,
        contraseña: form.contraseña,
        createdAt: serverTimestamp(),
      });
      showAlert('Usuario creado', 'El usuario fue registrado correctamente', 'success');
      setModalOpen(false);
      setForm({ id: '', nombre: '', correo: '', contraseña: '', role: '' });
    } catch (error) {
      showAlert('Error al crear usuario', error.message, 'error');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'users', form.id), {
        nombre: form.nombre,
        email: form.correo,
        role: form.role,
        contraseña: form.contraseña,
        updatedAt: serverTimestamp(),
      });
      showAlert('Usuario actualizado', 'Los datos fueron modificados correctamente', 'success');
      setModalOpen(false);
      setEditMode(false);
      setForm({ id: '', nombre: '', correo: '', contraseña: '', role: 'admin' });
    } catch (error) {
      showAlert('Error al editar usuario', error.message, 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      await deleteDoc(doc(db, 'users', id));
      showAlert('Usuario eliminado', 'El usuario fue borrado de la base de datos', 'success');
    }
  };

  const openEditModal = (usuario) => {
    setForm({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.email,
      contraseña: usuario.contraseña || '',
      role: usuario.role,
    });
    setEditMode(true);
    setModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Gestión de usuarios</h1>
        <button
          onClick={() => {
            setModalOpen(true);
            setEditMode(false);
            setForm({ id: '', nombre: '', correo: '', contraseña: '', role: 'admin' });
          }}
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition"
        >
          + Crear usuario
        </button>
      </div>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">role</th>
              <th className="px-4 py-2">Contraseña</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.nombre}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">{u.contraseña || '—'}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => openEditModal(u)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editMode ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
            <form onSubmit={editMode ? handleEditUser : handleCreateUser} className="space-y-4">
              <input
                type="text"
                name="nombre"
                placeholder="Nombre completo"
                value={form.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-500"
                required
              />
              <input
                type="email"
                name="correo"
                placeholder="Correo electrónico"
                value={form.correo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-500"
                required
              />
              <input
                type="text"
                name="contraseña"
                placeholder="Contraseña"
                value={form.contraseña}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-500"
                required
              />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-500"
              >
                <option value="admin">Administrador</option>
                <option value="gerente">Gerente</option>
              </select>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditMode(false);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                >
                  {editMode ? 'Guardar cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

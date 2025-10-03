import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    setDoc,
    doc,
    updateDoc,
    serverTimestamp,
    getDoc,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { showAlert } from '../../utils/alerts';

export default function Centros() {
    const [modalOpen, setModalOpen] = useState(false);
    const [nombre, setNombre] = useState('');
    const [encargadoId, setEncargadoId] = useState('');
    const [gerentes, setGerentes] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [centroId, setCentroId] = useState('');

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const lista = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((u) => u.role === 'gerente');
            setGerentes(lista);
        });
        return () => unsubscribe();
    }, []);

    const openEditModal = (centro) => {
        setNombre(centro.nombre);
        setEncargadoId(centro.encargadoId);
        setCentroId(centro.id);
        setEditMode(true);
        setModalOpen(true);
    };

    const [centros, setCentros] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'centros'), async (snapshot) => {
            const lista = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                    const data = docSnap.data();
                    let encargadoNombre = '—';
                    if (data.encargadoId) {
                        const encargadoDoc = await getDoc(doc(db, 'users', data.encargadoId));
                        if (encargadoDoc.exists()) {
                            encargadoNombre = encargadoDoc.data().nombre;
                        }
                    }
                    return {
                        id: docSnap.id,
                        nombre: data.nombre,
                        encargadoId: data.encargadoId,
                    };
                })
            );
            setCentros(lista);
        });

        return () => unsubscribe();
    }, []);
    const handleCreateCentro = async (e) => {
        e.preventDefault();
        try {
            const centroRef = doc(collection(db, 'centros'));
            await setDoc(centroRef, {
                nombre,
                encargadoId,
                createdAt: serverTimestamp(),
            });

            await updateDoc(doc(db, 'users', encargadoId), {
                centroId: centroRef.id,
            });

            showAlert('Centro creado', 'El centro fue registrado correctamente', 'success');
            setModalOpen(false);
            setNombre('');
            setEncargadoId('');
        } catch (error) {
            showAlert('Error al crear centro', error.message, 'error');
        }
    };
    const handleEditCentro = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, 'centros', centroId), {
                nombre,
                encargadoId,
                updatedAt: serverTimestamp(),
            });

            await updateDoc(doc(db, 'users', encargadoId), {
                centroId,
            });

            showAlert('Centro actualizado', 'Los datos fueron modificados correctamente', 'success');
            setModalOpen(false);
            setEditMode(false);
            setNombre('');
            setEncargadoId('');
            setCentroId('');
        } catch (error) {
            showAlert('Error al editar centro', error.message, 'error');
        }
    };
    const handleDeleteCentro = async (id) => {
        if (confirm('¿Estás seguro de eliminar este centro?')) {
            await deleteDoc(doc(db, 'centros', id));
            showAlert('Centro eliminado', 'El centro fue borrado de la base de datos', 'success');
        }
    };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Gestión de centros</h1>
                <button
                    onClick={() => {
                        setModalOpen(true);
                        setEditMode(false);         // ← asegúrate de salir del modo edición
                        setNombre('');              // ← limpia el nombre
                        setEncargadoId('');         // ← limpia el encargado
                        setCentroId('');            // ← limpia el ID
                    }}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition"
                >
                    + Crear centro
                </button>

            </div>
            <div className="mt-8 overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full text-sm text-gray-700">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="px-4 py-2">Nombre del centro</th>
                            <th className="px-4 py-2">Encargado</th>
                            <th className="px-4 py-2">Acciones</th>
                        </tr>

                    </thead>
                    <tbody>
                        {centros.map((c) => (
                            <tr key={c.id} className="border-t">
                                <td className="px-4 py-2">{c.nombre}</td>
                                <td className="px-4 py-2">{c.encargado}</td>
                                <td className="px-4 py-2 space-x-2">
                                    <button
                                        onClick={() => openEditModal(c)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCentro(c.id)}
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

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Nuevo centro</h2>
                        <form onSubmit={editMode ? handleEditCentro : handleCreateCentro} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre del centro"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-500"
                                required
                            />
                            <select
                                value={encargadoId}
                                onChange={(e) => setEncargadoId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-500"
                                required
                            >
                                <option value="">Selecciona encargado</option>
                                {gerentes.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.nombre} ({g.email})
                                    </option>
                                ))}
                            </select>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
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

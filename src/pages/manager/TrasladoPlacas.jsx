import { useState, useEffect, useContext } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { showAlert } from '../../utils/alerts';
import { AuthContext } from '../../context/AuthContext';

export default function TrasladoPlacas() {
  const [placa, setPlaca] = useState('');
  const [centroDestino, setCentroDestino] = useState('');
  const [conCita, setConCita] = useState(false);
  const [atipico, setAtipico] = useState(false);
  const [centros, setCentros] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'centros'), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        nombre: doc.data().nombre,
      }));
      setCentros(lista);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'traslados'), {
        placa,
        encargado: user?.nombre || '—',
        centroDestino,
        conCita,
        atipico,
        createdAt: serverTimestamp(),
      });

      showAlert('Traslado registrado', 'El formulario fue enviado correctamente', 'success');
      setPlaca('');
      setCentroDestino('');
      setConCita(false);
      setAtipico(false);
    } catch (error) {
      showAlert('Error al registrar traslado', error.message, 'error');
    }
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Traslado de placas</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
          <input
            type="text"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            placeholder="Ej. ABC-123"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Centro destino</label>
          <select
            value={centroDestino}
            onChange={(e) => setCentroDestino(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
            required
          >
            <option value="">Selecciona centro</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={conCita}
              onChange={(e) => setConCita(e.target.checked)}
              className="h-4 w-4 text-gray-800 focus:ring-gray-800"
            />
            <span className="text-sm text-gray-700">Va con cita</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={atipico}
              onChange={(e) => setAtipico(e.target.checked)}
              className="h-4 w-4 text-gray-800 focus:ring-gray-800"
            />
            <span className="text-sm text-gray-700">Es atípico</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-gray-800 text-white rounded-md shadow hover:bg-gray-900 transition"
        >
          Enviar traslado
        </button>
      </form>
    </div>
  );
}

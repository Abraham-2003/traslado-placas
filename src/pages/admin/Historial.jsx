import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { showAlert } from '../../utils/alerts';
import { getStorage, ref, deleteObject } from 'firebase/storage';

export default function HistorialAdmin() {
  const [traslados, setTraslados] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchTraslados = async (reset = false) => {
    setLoading(true);

    let q = query(collection(db, 'traslados'), orderBy('createdAt', 'desc'), limit(20));
    if (!reset && lastDoc) {
      q = query(collection(db, 'traslados'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(20));
    }

    const snapshot = await getDocs(q);
    const docs = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const fecha = data.createdAt?.toDate?.();

        let centroDestino = '—';
        const encargado = data.encargado || '—';


        if (data.centroDestino) {
          const destinoDoc = await getDoc(doc(db, 'centros', data.centroDestino));
          if (destinoDoc.exists()) centroDestino = destinoDoc.data().nombre;
        }

        return {
          id: docSnap.id,
          placa: data.placa || '—',
          observaciones: data.observaciones || '',
          fecha: fecha ? format(fecha, "dd/MM/yyyy HH:mm", { locale: es }) : '—',
          encargado,
          centroDestino,
        };
      })
    );

    if (reset) {
      setTraslados(docs);
    } else {
      setTraslados((prev) => [...prev, ...docs]);
    }

    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.size === 20);
    setLoading(false);
  };

  useEffect(() => {
    fetchTraslados(true); // carga inicial limpia
  }, []);

  const handleDeleteByDateRange = async (e) => {
    e.preventDefault();
    try {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'traslados'),
        where('createdAt', '>=', inicio),
        where('createdAt', '<=', fin)
      );

      const snapshot = await getDocs(q);
      const storage = getStorage();

      const batch = snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const trasladoRef = docSnap.ref;

        // Extraer ruta desde imagenUrl
        if (data.imagenUrl) {
          const decodedUrl = decodeURIComponent(data.imagenUrl);
          const match = decodedUrl.match(/\/o\/(.+)\?alt=media/);
          const path = match?.[1];

          if (path) {
            const imageRef = ref(storage, path);
            try {
              await deleteObject(imageRef);
              console.log(`Imagen eliminada: ${path}`);
            } catch (err) {
              console.warn(`No se pudo eliminar la imagen: ${path}`, err);
            }
          }
        }

        // Eliminar documento
        await deleteDoc(trasladoRef);
      });

      await Promise.all(batch);

      showAlert('Registros eliminados', `Se eliminaron ${snapshot.size} traslados`, 'success');
      setTraslados([]);
      setLastDoc(null);
      fetchTraslados(true); // recarga limpia
    } catch (error) {
      console.error('Error completo:', error);
      showAlert('Error al eliminar', error.message, 'error');
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Historial de traslados</h2>

      {/* Filtro por fechas */}
      <form onSubmit={handleDeleteByDateRange} className="flex items-center gap-4 mb-6 flex-wrap">
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
          required
        />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Eliminar por rango
        </button>
      </form>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">Encargado</th>
              <th className="px-4 py-2">Centro destino</th>
              <th className="px-4 py-2">Placa</th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {traslados.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-2">{t.encargado}</td>
                <td className="px-4 py-2">{t.centroDestino}</td>
                <td className="px-4 py-2">{t.placa}</td>
                <td className="px-4 py-2">{t.fecha}</td>
                <td className="px-4 py-2">{t.observaciones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => fetchTraslados(false)}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition"
          >
            {loading ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  );
}

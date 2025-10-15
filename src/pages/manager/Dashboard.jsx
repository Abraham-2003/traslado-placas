import { useState, useEffect, useContext } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { showAlert } from '../../utils/alerts';
import { AuthContext } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [traslados, setTraslados] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [trasladoActivo, setTrasladoActivo] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const trasladosPorPagina = 5;
  const indexUltimo = paginaActual * trasladosPorPagina;
  const indexPrimero = indexUltimo - trasladosPorPagina;
  const trasladosPaginados = traslados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(traslados.length / trasladosPorPagina);

  const fetchTraslados = async () => {
    if (!user?.nombre) return;

    const q = query(
      collection(db, 'traslados'),
      where('encargado', '==', user.nombre),
      orderBy('createdAt', 'desc')
    );


    const snapshot = await getDocs(q);
    const lista = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const fecha = data.createdAt?.toDate?.();
        let destinoNombre = '—';

        if (data.centroDestino) {
          const destinoDoc = await getDoc(doc(db, 'centros', data.centroDestino));
          if (destinoDoc.exists()) destinoNombre = destinoDoc.data().nombre;
        }

        return {
          id: docSnap.id,
          placa: data.placa,
          centroDestino: destinoNombre,
          conCita: data.conCita,
          atipico: data.atipico,
          observaciones: data.observaciones || '',
          fecha: fecha ? format(fecha, "EEEE dd/MM/yyyy HH:mm", { locale: es }) : '—',
          leido: data.leido || false,
        };
      })
    );

    setTraslados(lista);
    setPaginaActual(1);
    setLoading(false);
  };
  useEffect(() => {
    fetchTraslados();
  }, [user?.nombre]);

  const handleObservacionChange = (id, value) => {
    setTraslados((prev) =>
      prev.map((t) => (t.id === id ? { ...t, observaciones: value } : t))
    );
  };

  const handleGuardar = async (id, observaciones) => {
    try {
      await updateDoc(doc(db, 'traslados', id), { observaciones });
      showAlert('Observaciones actualizadas', 'Se guardaron los cambios correctamente', 'success');
    } catch (error) {
      showAlert('Error al guardar', error.message, 'error');
    }
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Mis traslados</h2>
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-left text-gray-600 uppercase tracking-wide text-xs">
            <tr>
              <th className="px-4 py-3">Placa</th>
              <th className="px-4 py-3">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {trasladosPaginados.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-4 py-6 text-center text-gray-500">No se encontraron traslados</td>
              </tr>
            ) : (
              trasladosPaginados.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => {
                    setTrasladoActivo(t);
                    setModalOpen(true);
                  }}
                  className={`cursor-pointer border-t transition ${t.leido ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
                    }`}
                >
                  <td className="px-4 py-2 font-medium">{t.placa}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={t.observaciones}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setTraslados((prev) =>
                            prev.map((x) =>
                              x.id === t.id ? { ...x, observaciones: e.target.value } : x
                            )
                          )
                        }
                        placeholder="Observaciones..."
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-800 text-xs"
                        rows={2}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGuardar(t.id, t.observaciones);
                        }}
                        className="self-end px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 text-xs"
                      >
                        Guardar observación
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setPaginaActual(num)}
              className={`px-3 py-1 rounded text-sm ${paginaActual === num
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {num}
            </button>
          ))}
        </div>
      )}
      {modalOpen && trasladoActivo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del traslado</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div><strong>Fecha:</strong> {trasladoActivo.fecha}</div>
              <div><strong>Placa:</strong> {trasladoActivo.placa}</div>
              <div><strong>Centro destino:</strong> {trasladoActivo.centroDestino}</div>
              <div><strong>Cita:</strong> {trasladoActivo.conCita ? 'Sí' : 'No'}</div>
              <div><strong>Atípico:</strong> {trasladoActivo.atipico ? 'Sí' : 'No'}</div>
              <div><strong>Observaciones:</strong> {trasladoActivo.observaciones || '—'}</div>
              <div>
                <strong>Estatus:</strong>{' '}
                {trasladoActivo.leido ? (
                  <span className="text-green-600 font-medium">Leído</span>
                ) : (
                  <span className="text-yellow-600 font-medium">Pendiente</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

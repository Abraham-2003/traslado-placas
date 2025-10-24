import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { showAlert } from '../../utils/alerts';
import { orderBy } from 'firebase/firestore';

export default function HistorialFiltradoAdmin() {
  const [traslados, setTraslados] = useState([]);
  const [centros, setCentros] = useState([]);
  const [encargadoFiltro, setEncargadoFiltro] = useState('');
  const [encargados, setEncargados] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [centroDestino, setCentroDestino] = useState('');
  const [conCita, setConCita] = useState('');
  const [atipico, setAtipico] = useState('');

  const marcarComoLeido = async (id) => {
    try {
      await updateDoc(doc(db, 'traslados', id), { leido: true });
      showAlert('Traslado marcado como leído', '', 'success');
      setTraslados((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leido: true } : t))
      );
    } catch (error) {
      showAlert('Error al actualizar', error.message, 'error');
    }
  };
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const lista = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => u.role === 'Encargado');
      setEncargados(lista);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCentros = async () => {
      const snapshot = await getDocs(collection(db, 'centros'));
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        nombre: doc.data().nombre,
      }));
      setCentros(lista);
    };
    fetchCentros();
  }, []);

  const handleFiltrar = async () => {
    try {
      const filtros = [];
      if (fechaInicio) filtros.push(where('createdAt', '>=', new Date(fechaInicio)));
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        filtros.push(where('createdAt', '<=', fin));
      }
      if (encargadoFiltro) filtros.push(where('encargado', '==', encargadoFiltro));
      if (centroDestino) filtros.push(where('centroDestino', '==', centroDestino));
      if (conCita !== '') filtros.push(where('conCita', '==', conCita === 'true'));
      if (atipico !== '') filtros.push(where('atipico', '==', atipico === 'true'));

      const q = query(
        collection(db, 'traslados'),
        ...filtros,
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const lista = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const fecha = data.createdAt?.toDate?.();
          const encargado = data.encargado || '—';
          let destino = '—';

          if (data.centroDestino) {
            const docRef = await getDoc(doc(db, 'centros', data.centroDestino));
            if (docRef.exists()) destino = docRef.data().nombre;
          }

          return {
            id: docSnap.id,
            placa: data.placa || '—',
            observaciones: data.observaciones || '',
            fecha: fecha ? format(fecha, "dd/MM/yyyy HH:mm", { locale: es }) : '—',
            leido: data.leido || false,
            encargado,
            centroDestino: destino,
            conCita: data.conCita || false,
            atipico: data.atipico || false,
          };

        })
      );

      setTraslados(lista);
    } catch (error) {
      console.error('Error al filtrar:', error);
      showAlert('Error al filtrar', error.message, 'error');
    }

  };

  const handleExportarExcel = () => {
    const hoja = traslados.map((t) => ({
      Fecha: t.fecha,
      Placa: t.placa,
      Encargado: t.encargado,
      'Centro destino': t.centroDestino,
      Cita: t.conCita,
      Atipico: t.atipico,
      Observaciones: t.observaciones,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(hoja);
    XLSX.utils.book_append_sheet(wb, ws, 'Traslados');
    const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([blob]), 'traslados_filtrados.xlsx');
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center tracking-tight">
        Inicio
      </h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Fecha inicio</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-800" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Fecha fin</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-800" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Encargado</label>
          <select
            value={encargadoFiltro}
            onChange={(e) => setEncargadoFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-800"
          >
            <option value="">Todos</option>
            {encargados.map((u) => (
              <option key={u.id} value={u.nombre}>{u.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Centro destino</label>
          <select value={centroDestino} onChange={(e) => setCentroDestino(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-800">
            <option value="">Todos</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">¿Con cita?</label>
          <select value={conCita} onChange={(e) => setConCita(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-800">
            <option value="">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">¿Atípico?</label>
          <select value={atipico} onChange={(e) => setAtipico(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-800">
            <option value="">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <button onClick={handleFiltrar} className="px-5 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition duration-200">
          Filtrar
        </button>
        <button onClick={handleExportarExcel} className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200">
          Exportar Excel
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-md">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-left text-gray-600 uppercase tracking-wide text-xs">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Placa</th>
              <th className="px-4 py-3">Encargado</th>
              <th className="px-4 py-3">Centro destino</th>
              <th className="px-4 py-3 text-center">Cita</th>
              <th className="px-4 py-3 text-center">Atípico</th>
              <th className="px-4 py-3">Observaciones</th>
              <th className="px-4 py-3 text-center">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {traslados.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No se encontraron resultados</td>
              </tr>
            ) : (
              traslados.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-2">{t.fecha}</td>
                  <td className="px-4 py-2 font-medium">{t.placa}</td>
                  <td className="px-4 py-2">{t.encargado}</td>
                  <td className="px-4 py-2">{t.centroDestino}</td>
                  <td className="px-4 py-2 text-center">{t.conCita ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-2 text-center">{t.atipico ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-2">{t.observaciones}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => marcarComoLeido(t.id)}
                      disabled={t.leido}
                      className={`px-3 py-1 rounded text-xs ${t.leido
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      {t.leido ? 'Leído' : 'Marcar como leído'}
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

}

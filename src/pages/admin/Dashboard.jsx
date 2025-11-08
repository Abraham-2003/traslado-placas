import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { showAlert } from '../../utils/alerts'

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
  const [trasladosFiltrados, setTrasladosFiltrados] = useState([]);


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

  useEffect(() => {
    const q = query(collection(db, 'traslados'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
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
            imagenUrl: data.imagenUrl || '',
          };
        })
      );

      setTraslados(lista);
    });

    return () => unsubscribe(); // Limpia el listener al desmontar
  }, []);
  const aplicarFiltrosLocalmente = () => {
  const listaFiltrada = traslados.filter((t) => {
    const fechaValida =
      (!fechaInicio || new Date(t.fecha) >= new Date(fechaInicio)) &&
      (!fechaFin || new Date(t.fecha) <= new Date(fechaFin + 'T23:59:59'));

    const encargadoValido =
      !encargadoFiltro || t.encargado === encargadoFiltro;

    const centroValido =
      !centroDestino || t.centroDestino?.toLowerCase() === centroDestino.toLowerCase();

    const citaValida =
      conCita === '' || t.conCita === (conCita === 'true');

    const atipicoValido =
      atipico === '' || t.atipico === (atipico === 'true');

    return (
      fechaValida &&
      encargadoValido &&
      centroValido &&
      citaValida &&
      atipicoValido
    );
  });

  setTrasladosFiltrados(listaFiltrada);
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
  const forzarDescargaImagen = async (url, nombreArchivo = 'imagen.jpg') => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error al descargar imagen:', error);
      showAlert('Error al descargar', error.message, 'error');
    }
  };
  const fetchImageAsBlob = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo obtener la imagen');
    return await response.blob();
  };

  const blobToFile = (blob, filename) => {
    return new File([blob], filename, { type: blob.type });
  };

  const compartirImagenPorWhatsApp = async (url, nombreArchivo = 'imagen.jpg') => {
    try {
      const blob = await fetchImageAsBlob(url);
      const file = blobToFile(blob, nombreArchivo);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Traslado',
          text: '🚨 Favor de atender este vehículo, con este documento.',
        });
        console.log('✅ Imagen compartida con éxito');
      } else {
        alert('Tu navegador no permite compartir archivos directamente.');
      }
    } catch (error) {
      console.error('❌ Error al compartir la imagen:', error);
      alert('No se pudo compartir la imagen.');
    }
  };

  return (
    <div >
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
        <button onClick={aplicarFiltrosLocalmente} className="px-5 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition duration-200">
          Filtrar
        </button>
        <button onClick={handleExportarExcel} className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200">
          Exportar Excel
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-md">
        <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 bg-white">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-left text-gray-600 uppercase tracking-wide text-xs border-b border-gray-300">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Encargado</th>
                <th className="px-4 py-3">Centro destino</th>
                <th className="px-4 py-3 text-center">Cita</th>
                <th className="px-4 py-3 text-center">Atípico</th>
                <th className="px-4 py-3">Observaciones</th>
                <th className="px-4 py-3 text-center">Estatus</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {(trasladosFiltrados?.length ?? 0) === 0 && traslados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500 italic">
                    No se encontraron resultados
                  </td>
                </tr>
              ) : (
                (trasladosFiltrados.length > 0 ? trasladosFiltrados : traslados).map((t) => (
                  <tr
                    key={t.id}
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3">{t.fecha}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {t.placa}
                    </td>
                    <td className="px-4 py-3">{t.encargado}</td>
                    <td className="px-4 py-3">{t.centroDestino}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${t.conCita
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {t.conCita ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${t.atipico
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {t.atipico ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{t.observaciones}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => marcarComoLeido(t.id)}
                        disabled={t.leido}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${t.leido
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                          }`}
                      >
                        {t.leido ? "Leído" : "Marcar como leído"}
                      </button>
                    </td>
                    <td className="px-2 py-3 text-center space-x-2">
                      {t.atipico && t.imagenUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => compartirImagenPorWhatsApp(t.imagenUrl, `atipico_${t.placa}.jpg`)}
                            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                            title="Compartir por WhatsApp"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.37 0 .01 5.37.01 12c0 2.11.55 4.17 1.6 6L0 24l6.26-1.64a11.94 11.94 0 005.74 1.46c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.8 0-3.56-.48-5.1-1.38l-.36-.21-3.72.98.99-3.63-.23-.37A9.93 9.93 0 012.01 12C2.01 6.48 6.48 2 12 2s9.99 4.48 9.99 10S17.52 22 12 22zm5.2-7.6c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.54-.44-.47-.61-.48h-.52c-.18 0-.48.07-.73.34-.25.28-.96.94-.96 2.3s.98 2.66 1.12 2.84c.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.65.21 1.24.18 1.7.11.52-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.52-.32z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => forzarDescargaImagen(t.imagenUrl, `atipico_${t.placa}.jpg`)}
                            className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 transition"
                            title="Descargar imagen"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v6m0 0l-3-3m3 3l3-3M12 4v8" />
                            </svg>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

}

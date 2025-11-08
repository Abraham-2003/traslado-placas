import { useState, useEffect, useContext, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { showAlert } from '../../utils/alerts';
import { AuthContext } from '../../context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


export default function TrasladoPlacas() {
  const [placa, setPlaca] = useState('');
  const [centroDestino, setCentroDestino] = useState('');
  const [conCita, setConCita] = useState(false);
  const [atipico, setAtipico] = useState(false);
  const [centros, setCentros] = useState([]);
  const { user } = useContext(AuthContext);
  const [imagenAtipica, setImagenAtipica] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const inputFileRef = useRef(null);
  const [imagen, setImagen] = useState(null);




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
      let imagenUrl = '';

      if (atipico && imagenAtipica) {
        const storage = getStorage();
        const nombreArchivo = `atipicos/${Date.now()}_${imagenAtipica.name}`;
        const storageRef = ref(storage, nombreArchivo);

        // Subir imagen
        await uploadBytes(storageRef, imagenAtipica);
        console.log('Imagen subida correctamente');


        // Obtener URL pública
        imagenUrl = await getDownloadURL(storageRef);
        console.log('URL de imagen:', imagenUrl);

      }

      await addDoc(collection(db, 'traslados'), {
        placa,
        encargado: user?.nombre || '—',
        centroDestino,
        conCita,
        atipico,
        imagenUrl: atipico ? imagenUrl : '',
        createdAt: serverTimestamp(),
      });

      showAlert('Traslado registrado', 'El formulario fue enviado correctamente', 'success');
      setPlaca('');
      setCentroDestino('');
      setConCita(false);
      setAtipico(false);
      setImagenAtipica(null);
      setPreviewUrl('');
    } catch (error) {
      console.error('Error completo:', error);
      showAlert('Error al registrar traslado', error.message, 'error');
    }

  };

  const handleImagenChange = (file) => {
    if (!file) {
      alert('No se seleccionó ninguna imagen.');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImagenAtipica(file); // ← este es el que usas en handleSubmit
  };



  const handleEliminarImagen = () => {
    setImagenAtipica(null);
    setPreviewUrl('');
  };


  return (
    <div className="p-4 pb-28 max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center tracking-tight">
        Traslado de placas
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Campo: Placa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Placa
          </label>
          <input
            type="text"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            placeholder="Ej. ABC-123"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-800 text-gray-800 placeholder-gray-400"
            required
          />
        </div>

        {/* Campo: Centro destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Centro destino
          </label>
          <select
            value={centroDestino}
            onChange={(e) => setCentroDestino(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-800 text-gray-800"
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

        {/* Checkboxes */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              checked={conCita}
              onChange={(e) => {
                const checked = e.target.checked;
                setConCita(checked);
                if (checked) setAtipico(false);
              }}
              className="h-5 w-5 text-gray-800 rounded focus:ring-gray-800"
            />
            <span className="text-sm text-gray-700 font-medium">Va con cita</span>
          </label>

          <label className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              checked={atipico}
              onChange={(e) => {
                const checked = e.target.checked;
                setAtipico(checked);
                if (checked) setConCita(false);
              }}
              className="h-5 w-5 text-gray-800 rounded focus:ring-gray-800"
            />
            <span className="text-sm text-gray-700 font-medium">Es atípico</span>
          </label>
        </div>

        {/* Imagen si es atípico */}
        {atipico && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Foto del caso atípico
            </label>

            {!previewUrl ? (
              <div className="space-y-2">
                {/* BONUS: botón visual para seleccionar imagen */}
                <label className="block w-full">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        inputFileRef.current.removeAttribute('capture');
                        inputFileRef.current.click();
                      }}
                      className="w-full py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                    >
                      Galería
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        inputFileRef.current.setAttribute('capture', 'environment');
                        inputFileRef.current.click();
                      }}
                      className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Cámara
                    </button>

                    <input
                      type="file"
                      accept="image/*"
                      ref={inputFileRef}
                      onChange={(e) => handleImagenChange(e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Previsualización"
                  className="w-full h-auto rounded-lg border border-gray-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleEliminarImagen}
                  className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-sm"
                >
                  Eliminar y seleccionar otra
                </button>
              </div>
            )}
          </div>
        )}


        {/* Botón enviar */}
        <button
          type="submit"
          className="w-full py-3 bg-gray-800 text-white rounded-lg font-semibold text-base shadow-md hover:bg-gray-900 active:scale-[0.98] transition-transform duration-150"
        >
          Enviar traslado
        </button>
      </form>
    </div>
  );
}

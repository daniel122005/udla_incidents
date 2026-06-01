// src/pages/ReportPage.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { createIncident, uploadImage, TIPOS_INCIDENTE, UBICACIONES } from '../services/incidents';
import toast from 'react-hot-toast';
import { Camera, MapPin, Navigation, Upload, X, ArrowLeft } from 'lucide-react';

export default function ReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [submitting, setSubmitting] = useState(false);

  // Manejar selección de imagen
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  // Obtener GPS
  function getLocation() {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Ubicación obtenida correctamente');
        setLocating(false);
      },
      () => {
        toast.error('No se pudo obtener la ubicación');
        setLocating(false);
      }
    );
  }

  async function onSubmit(data) {
    if (!imageFile) {
      toast.error('La fotografía es obligatoria');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Crear documento temporal para obtener el ID
      const tempId = `${user.uid}_${Date.now()}`;

      // 2. Subir imagen a Storage
      toast.loading('Subiendo imagen…', { id: 'upload' });
      const imagenURL = await uploadImage(imageFile, tempId, setUploadProgress);
      toast.dismiss('upload');

      // 3. Guardar incidente en Firestore
      toast.loading('Guardando incidente…', { id: 'save' });
      await createIncident(
        {
          tipo: data.tipo,
          descripcion: data.descripcion,
          imagenURL,
          ubicacionTexto: data.ubicacionTexto,
          latitud: coords.lat,
          longitud: coords.lng,
        },
        user.uid,
        user.email
      );
      toast.dismiss('save');

      toast.success('¡Incidente reportado exitosamente!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Error al guardar el incidente. Intenta de nuevo.');
      console.error(err);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="main-content">
      <div className="page-wrapper" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '0.75rem' }}>
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 className="page-title">
            <Camera size={26} color="var(--color-primary)" />
            Reportar Incidente
          </h1>
          <p className="page-subtitle">Completa el formulario con los detalles del incidente</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Tipo de incidente */}
          <div className="form-group">
            <label className="form-label">
              Tipo de incidente <span className="required">*</span>
            </label>
            <select
              id="report-tipo"
              className={`form-select ${errors.tipo ? 'error' : ''}`}
              {...register('tipo', { required: 'Selecciona el tipo de incidente' })}
            >
              <option value="">Selecciona un tipo</option>
              {TIPOS_INCIDENTE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
            {errors.tipo && <span className="form-error">{errors.tipo.message}</span>}
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label className="form-label">
              Descripción detallada <span className="required">*</span>
            </label>
            <textarea
              id="report-descripcion"
              className={`form-textarea ${errors.descripcion ? 'error' : ''}`}
              placeholder="Describe el incidente con el mayor detalle posible: qué ocurrió, desde cuándo, qué tan grave es..."
              rows={4}
              {...register('descripcion', {
                required: 'La descripción es obligatoria',
                minLength: { value: 20, message: 'Mínimo 20 caracteres' },
              })}
            />
            {errors.descripcion && <span className="form-error">{errors.descripcion.message}</span>}
          </div>

          {/* Foto */}
          <div className="form-group">
            <label className="form-label">
              <Camera size={14} style={{ display: 'inline', marginRight: 4 }} />
              Fotografía <span className="required">*</span>
            </label>
            <div
              className={`photo-upload-area ${imagePreview ? 'has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Vista previa" className="photo-preview" />
                  <div className="photo-upload-overlay">
                    <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Upload size={18} /> Cambiar foto
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Camera size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                    Toca para adjuntar foto
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Desde cámara o galería · JPG, PNG, WEBP
                  </p>
                </>
              )}
            </div>
            {/* Input oculto — accept image/* capture permite abrir cámara en móvil */}
            <input
              id="report-foto"
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {imageFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <span>📎 {imageFile.name}</span>
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                  <X size={14} />
                </button>
              </div>
            )}
            {/* Barra de progreso */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ background: 'var(--color-border)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--color-primary)', width: `${uploadProgress}%`, height: '100%', transition: 'width 0.2s', borderRadius: '4px' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Subiendo… {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="form-group">
            <label className="form-label">
              <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
              Lugar del incidente <span className="required">*</span>
            </label>
            <select
              id="report-ubicacion"
              className={`form-select ${errors.ubicacionTexto ? 'error' : ''}`}
              {...register('ubicacionTexto', { required: 'Selecciona la ubicación' })}
            >
              <option value="">Selecciona el lugar</option>
              {UBICACIONES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {errors.ubicacionTexto && <span className="form-error">{errors.ubicacionTexto.message}</span>}
          </div>

          {/* GPS Opcional */}
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>
              <Navigation size={14} style={{ display: 'inline', marginRight: 4 }} />
              Geolocalización GPS <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>(opcional)</span>
            </label>
            <button
              id="report-gps"
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={getLocation}
              disabled={locating}
            >
              <Navigation size={14} />
              {locating ? 'Obteniendo ubicación…' : coords.lat ? '✅ Ubicación capturada' : 'Capturar GPS'}
            </button>
            {coords.lat && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                📍 Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
              </p>
            )}
          </div>

          {/* Botón enviar */}
          <button
            id="report-submit"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={submitting}
            style={{ marginTop: '0.5rem' }}
          >
            {submitting ? 'Enviando reporte…' : '📤 Enviar Reporte'}
          </button>
        </form>
      </div>
    </div>
  );
}

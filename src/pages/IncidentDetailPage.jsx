// src/pages/IncidentDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIncidentById, updateIncidentStatus, TIPOS_INCIDENTE, ESTADOS_INCIDENTE } from '../services/incidents';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/incidents/StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, MapPin, Calendar, User, Tag, Image, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);

  useEffect(() => {
    getIncidentById(id).then((data) => {
      setIncident(data);
      setLoading(false);
    }).catch(() => {
      toast.error('No se encontró el incidente');
      navigate('/dashboard');
    });
  }, [id]);

  async function handleStatusChange(nuevoEstado) {
    setUpdating(true);
    try {
      await updateIncidentStatus(id, nuevoEstado, incident.grupoId);
      setIncident((prev) => ({ ...prev, estado: nuevoEstado }));
      toast.success(`Estado actualizado a "${nuevoEstado}"`);
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /><p>Cargando incidente…</p></div>;
  }

  if (!incident) return null;

  const tipo = TIPOS_INCIDENTE.find((t) => t.value === incident.tipo);
  const fecha = incident.fechaCreacion?.toDate?.();

  return (
    <div className="main-content">
      <div className="page-wrapper" style={{ maxWidth: 720 }}>
        {/* Back button */}
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Volver
        </button>

        {/* Imagen */}
        {incident.imagenURL && (
          <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-lg)' }}
            onClick={() => setImgExpanded(true)}>
            <img
              src={incident.imagenURL}
              alt="Foto del incidente"
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
            />
            <div style={{ padding: '0.5rem 1rem', background: 'var(--color-bg)', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Image size={12} /> Toca para ampliar
            </div>
          </div>
        )}

        {/* Card principal */}
        <div className="card">
          {/* Tipo + Estado */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{tipo?.emoji || '📋'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{tipo?.label || incident.tipo}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tipo de incidente</div>
              </div>
            </div>
            <StatusBadge estado={incident.estado} />
          </div>

          <hr className="divider" />

          {/* Descripción */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p className="section-title"><Tag size={16} /> Descripción</p>
            <p style={{ lineHeight: 1.7, color: 'var(--color-text)' }}>{incident.descripcion}</p>
          </div>

          {/* Meta información */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p className="form-label" style={{ marginBottom: '0.25rem' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} /> Ubicación
              </p>
              <p style={{ fontSize: '0.9rem' }}>{incident.ubicacionTexto || '—'}</p>
              {incident.latitud && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  <Navigation size={11} style={{ display: 'inline' }} /> {incident.latitud.toFixed(5)}, {incident.longitud.toFixed(5)}
                </p>
              )}
            </div>
            <div>
              <p className="form-label" style={{ marginBottom: '0.25rem' }}>
                <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} /> Fecha de reporte
              </p>
              <p style={{ fontSize: '0.9rem' }}>
                {fecha ? format(fecha, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es }) : '—'}
              </p>
            </div>
            <div>
              <p className="form-label" style={{ marginBottom: '0.25rem' }}>
                <User size={13} style={{ display: 'inline', marginRight: 4 }} /> Reportado por
              </p>
              <p style={{ fontSize: '0.9rem' }}>{incident.usuarioEmail || '—'}</p>
            </div>
            {incident.grupoId && (
              <div>
                <p className="form-label" style={{ marginBottom: '0.25rem' }}>🔗 Grupo</p>
                <span className="badge badge-info">{incident.grupoId.slice(0, 8)}…</span>
              </div>
            )}
          </div>

          {/* Panel de cambio de estado (solo admin) */}
          {isAdmin && (
            <>
              <hr className="divider" />
              <div>
                <p className="section-title">⚙️ Actualizar Estado</p>
                {incident.grupoId && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', padding: '0.5rem', background: '#fef3c7', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
                    ⚠️ Este incidente pertenece a un grupo. El cambio de estado se aplicará a todos los incidentes del grupo.
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {ESTADOS_INCIDENTE.map((est) => (
                    <button
                      key={est}
                      className={`btn ${incident.estado === est ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleStatusChange(est)}
                      disabled={updating || incident.estado === est}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox imagen */}
      {imgExpanded && (
        <div className="modal-backdrop" onClick={() => setImgExpanded(false)}>
          <img
            src={incident.imagenURL}
            alt="Incidente"
            style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}
    </div>
  );
}

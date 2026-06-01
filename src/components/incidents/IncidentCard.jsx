import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from './StatusBadge';
import { TIPOS_INCIDENTE } from '../../services/incidents';

export default function IncidentCard({ incident, selectable, selected, onSelect }) {
  const navigate = useNavigate();
  const tipo = TIPOS_INCIDENTE.find((t) => t.value === incident.tipo);
  const fecha = incident.fechaCreacion?.toDate?.();

  function handleClick() {
    if (selectable) {
      onSelect?.(incident.id);
    } else {
      navigate(`/incidents/${incident.id}`);
    }
  }

  return (
    <div
      className="incident-card"
      onClick={handleClick}
      style={selected ? { outline: '2px solid var(--color-primary)', outlineOffset: '2px' } : {}}
    >
      {/* Imagen */}
      {incident.imagenURL ? (
        <img
          src={incident.imagenURL}
          alt="Foto del incidente"
          className="incident-card-image"
        />
      ) : (
        <div className="incident-card-image" style={{ background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
          {tipo?.emoji || '📋'}
        </div>
      )}

      {/* Body */}
      <div className="incident-card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="tipo-icon" style={{ background: 'var(--color-bg)' }}>
            {tipo?.emoji || '📋'}
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {tipo?.label || incident.tipo}
          </span>
        </div>

        <p className="incident-card-title">
          {incident.descripcion?.slice(0, 80)}
          {incident.descripcion?.length > 80 ? '…' : ''}
        </p>

        <div className="incident-card-meta">
          <MapPin size={12} />
          {incident.ubicacionTexto || 'Sin ubicación'}
        </div>

        {incident.usuarioEmail && (
          <div className="incident-card-meta">
            <User size={12} />
            {incident.usuarioEmail}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="incident-card-footer">
        <StatusBadge estado={incident.estado} />
        <div className="incident-card-meta">
          <Calendar size={12} />
          {fecha ? format(fecha, 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}
        </div>
      </div>
    </div>
  );
}

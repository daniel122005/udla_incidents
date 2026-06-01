// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents, TIPOS_INCIDENTE } from '../services/incidents';
import { useAuth } from '../context/AuthContext';
import IncidentCard from '../components/incidents/IncidentCard';
import { PlusCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const FILTROS = ['Todos', 'Reportado', 'En proceso', 'Resuelto'];

export default function DashboardPage() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [estado, setEstado] = useState('Todos');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // Admin ve todos; usuario normal solo los suyos
      const data = await getIncidents(isAdmin ? {} : { userId: user.uid });
      setIncidents(data);
    } catch {
      toast.error('Error al cargar incidentes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [isAdmin, user]);

  useEffect(() => {
    if (estado === 'Todos') setFiltered(incidents);
    else setFiltered(incidents.filter((i) => i.estado === estado));
  }, [estado, incidents]);

  const counts = {
    total: incidents.length,
    reportado: incidents.filter((i) => i.estado === 'Reportado').length,
    enProceso: incidents.filter((i) => i.estado === 'En proceso').length,
    resuelto: incidents.filter((i) => i.estado === 'Resuelto').length,
  };

  return (
    <div className="main-content">
      <div className="page-wrapper">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">
              <AlertTriangle size={26} color="var(--color-primary)" />
              {isAdmin ? 'Panel General' : 'Mis Incidentes'}
            </h1>
            <p className="page-subtitle">
              {isAdmin ? 'Todos los incidentes reportados' : `Hola, ${profile?.nombre || user?.email}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm no-print" onClick={load}>
              <RefreshCw size={15} /> Actualizar
            </button>
            <button className="btn btn-primary no-print" onClick={() => navigate('/report')}>
              <PlusCircle size={16} /> Reportar
            </button>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="stats-grid">
          {[
            { label: 'Total', value: counts.total, color: 'var(--color-primary)' },
            { label: 'Reportados', value: counts.reportado, color: '#ef4444' },
            { label: 'En proceso', value: counts.enProceso, color: '#f59e0b' },
            { label: 'Resueltos', value: counts.resuelto, color: '#22c55e' },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="filter-bar no-print">
          {FILTROS.map((f) => (
            <button
              key={f}
              className={`filter-btn ${estado === f ? 'active' : ''}`}
              onClick={() => setEstado(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
            <p>Cargando incidentes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">No hay incidentes{estado !== 'Todos' ? ` con estado "${estado}"` : ''}</p>
            <p className="empty-state-sub">Sé el primero en reportar un incidente</p>
            <button className="btn btn-primary" onClick={() => navigate('/report')}>
              <PlusCircle size={16} /> Reportar incidente
            </button>
          </div>
        ) : (
          <div className="incidents-grid">
            {filtered.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

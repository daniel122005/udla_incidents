// src/pages/AdminPage.jsx
// Panel de administración: lista todos los incidentes, permite cambiar estado y agrupar
import { useState, useEffect } from 'react';
import { getIncidents, updateIncidentStatus, groupIncidents, TIPOS_INCIDENTE, ESTADOS_INCIDENTE } from '../services/incidents';
import IncidentCard from '../components/incidents/IncidentCard';
import StatusBadge from '../components/incidents/StatusBadge';
import { ShieldCheck, RefreshCw, Link2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const FILTROS = ['Todos', ...ESTADOS_INCIDENTE];
const TIPO_FILTROS = ['Todos', ...TIPOS_INCIDENTE.map((t) => t.value)];

export default function AdminPage() {
  const [incidents, setIncidents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [selected, setSelected] = useState([]);
  const [grouping, setGrouping] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getIncidents({});
      setIncidents(data);
    } catch {
      toast.error('Error al cargar incidentes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = incidents;
    if (estadoFiltro !== 'Todos') result = result.filter((i) => i.estado === estadoFiltro);
    if (tipoFiltro !== 'Todos') result = result.filter((i) => i.tipo === tipoFiltro);
    setFiltered(result);
  }, [estadoFiltro, tipoFiltro, incidents]);

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleGroup() {
    if (selected.length < 2) {
      toast.error('Selecciona al menos 2 incidentes para agrupar');
      return;
    }
    setGrouping(true);
    try {
      const grupoId = await groupIncidents(selected);
      toast.success(`✅ Incidentes agrupados (ID: ${grupoId.slice(0, 8)}…)`);
      setSelected([]);
      await load();
    } catch (err) {
      toast.error(err.message || 'Error al agrupar');
    } finally {
      setGrouping(false);
    }
  }

  async function handleQuickStatus(id, nuevoEstado, grupoId) {
    try {
      await updateIncidentStatus(id, nuevoEstado, grupoId);
      setIncidents((prev) =>
        prev.map((inc) => inc.id === id ? { ...inc, estado: nuevoEstado } : inc)
      );
      toast.success(`Estado: ${nuevoEstado}`);
    } catch {
      toast.error('Error al actualizar');
    }
  }

  const tipo = (val) => TIPOS_INCIDENTE.find((t) => t.value === val);

  return (
    <div className="main-content">
      <div className="page-wrapper">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title"><ShieldCheck size={26} color="var(--color-primary)" /> Panel de Administración</h1>
            <p className="page-subtitle">Gestiona todos los incidentes del campus</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {selected.length > 0 && (
              <button className="btn btn-secondary" onClick={handleGroup} disabled={grouping}>
                <Link2 size={15} /> Agrupar ({selected.length})
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={load}>
              <RefreshCw size={15} /> Actualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {[
            { label: 'Total', value: incidents.length, color: 'var(--color-primary)' },
            { label: 'Reportados', value: incidents.filter((i) => i.estado === 'Reportado').length, color: '#ef4444' },
            { label: 'En proceso', value: incidents.filter((i) => i.estado === 'En proceso').length, color: '#f59e0b' },
            { label: 'Resueltos', value: incidents.filter((i) => i.estado === 'Resuelto').length, color: '#22c55e' },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-muted)' }}>
              <Filter size={12} style={{ display: 'inline' }} /> Por estado:
            </p>
            <div className="filter-bar" style={{ margin: 0 }}>
              {FILTROS.map((f) => (
                <button key={f} className={`filter-btn ${estadoFiltro === f ? 'active' : ''}`} onClick={() => setEstadoFiltro(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-muted)' }}>
              Por tipo:
            </p>
            <div className="filter-bar" style={{ margin: 0 }}>
              {TIPO_FILTROS.map((f) => (
                <button key={f} className={`filter-btn ${tipoFiltro === f ? 'active' : ''}`} onClick={() => setTipoFiltro(f)}>
                  {f === 'Todos' ? 'Todos' : `${tipo(f)?.emoji} ${tipo(f)?.label}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selected.length > 0 && (
          <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#1d4ed8' }}>
            ✅ {selected.length} incidente(s) seleccionado(s). Pulsa <strong>Agrupar</strong> para vincularlos.
            <button onClick={() => setSelected([])} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', fontWeight: 600 }}>
              Cancelar selección
            </button>
          </div>
        )}

        {/* Lista con acciones rápidas */}
        {loading ? (
          <div className="loading-screen"><div className="spinner" /><p>Cargando…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-text">No hay incidentes con estos filtros</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((inc) => (
              <div key={inc.id} className="card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
                {/* Checkbox selección */}
                <input
                  type="checkbox"
                  checked={selected.includes(inc.id)}
                  onChange={() => toggleSelect(inc.id)}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />

                {/* Info */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
                  {inc.imagenURL && (
                    <img src={inc.imagenURL} alt="" style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <span>{tipo(inc.tipo)?.emoji}</span>
                      <strong style={{ fontSize: '0.85rem' }}>{tipo(inc.tipo)?.label}</strong>
                      <StatusBadge estado={inc.estado} />
                      {inc.grupoId && <span className="badge badge-info">Agrupado</span>}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.descripcion?.slice(0, 70)}…
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      📍 {inc.ubicacionTexto} · 👤 {inc.usuarioEmail}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
                  {ESTADOS_INCIDENTE.map((est) => (
                    <button
                      key={est}
                      className={`btn btn-sm ${inc.estado === est ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleQuickStatus(inc.id, est, inc.grupoId)}
                      disabled={inc.estado === est}
                      style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

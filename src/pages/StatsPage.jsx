import { useState, useEffect } from 'react';
import { getStats, TIPOS_INCIDENTE, ESTADOS_INCIDENTE } from '../services/incidents';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { BarChart3, Printer, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Colores para gráficas
const ESTADO_COLORS = { 'Reportado': '#ef4444', 'En proceso': '#f59e0b', 'Resuelto': '#22c55e' };
const TIPO_COLORS = ['#1a6b3c', '#2d9e5f', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

const PERIODOS = [
  { label: 'Este mes', desde: startOfMonth(new Date()), hasta: endOfMonth(new Date()) },
  { label: 'Mes anterior', desde: startOfMonth(subMonths(new Date(), 1)), hasta: endOfMonth(subMonths(new Date(), 1)) },
  { label: 'Últimos 3 meses', desde: startOfMonth(subMonths(new Date(), 2)), hasta: endOfMonth(new Date()) },
  { label: 'Todo el tiempo', desde: null, hasta: null },
];

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodoIdx, setPeriodoIdx] = useState(3);
  const [desdeCuston, setDesdeCustom] = useState('');
  const [hastaCustom, setHastaCustom] = useState('');
  const [usingCustom, setUsingCustom] = useState(false);

  async function load() {
    setLoading(true);
    try {
      let desde = null, hasta = null;
      if (usingCustom) {
        desde = desdeCuston ? new Date(desdeCuston) : null;
        hasta = hastaCustom ? new Date(hastaCustom) : null;
      } else {
        desde = PERIODOS[periodoIdx].desde;
        hasta = PERIODOS[periodoIdx].hasta;
      }
      const data = await getStats({ desde, hasta });
      setStats(data);
    } catch {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [periodoIdx, usingCustom]);

  // Preparar datos para gráfica de estados
  const pieData = stats
    ? ESTADOS_INCIDENTE.map((e) => ({ name: e, value: stats.porEstado[e] || 0 })).filter((d) => d.value > 0)
    : [];

  // Preparar datos para gráfica de tipos
  const barData = stats
    ? TIPOS_INCIDENTE.map((t) => ({
        name: `${t.emoji} ${t.label}`,
        cantidad: stats.porTipo[t.value] || 0,
      })).filter((d) => d.cantidad > 0)
    : [];

  const periodo = usingCustom
    ? `${desdeCuston || '…'} — ${hastaCustom || '…'}`
    : PERIODOS[periodoIdx].label;

  return (
    <div className="main-content">
      <div className="page-wrapper">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title"><BarChart3 size={26} color="var(--color-primary)" /> Estadísticas</h1>
            <p className="page-subtitle">Resumen de incidentes por período</p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={15} /> Actualizar</button>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              <Printer size={15} /> Imprimir
            </button>
          </div>
        </div>

        {/* Filtros de período */}
        <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
          <p className="section-title" style={{ marginBottom: '0.75rem' }}>📅 Filtrar por período</p>
          <div className="filter-bar" style={{ marginBottom: '1rem' }}>
            {PERIODOS.map((p, i) => (
              <button
                key={p.label}
                className={`filter-btn ${!usingCustom && periodoIdx === i ? 'active' : ''}`}
                onClick={() => { setPeriodoIdx(i); setUsingCustom(false); }}
              >
                {p.label}
              </button>
            ))}
            <button
              className={`filter-btn ${usingCustom ? 'active' : ''}`}
              onClick={() => setUsingCustom(true)}
            >
              Personalizado
            </button>
          </div>

          {usingCustom && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
                <label className="form-label">Desde</label>
                <input type="date" className="form-input" value={desdeCuston} onChange={(e) => setDesdeCustom(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 160 }}>
                <label className="form-label">Hasta</label>
                <input type="date" className="form-input" value={hastaCustom} onChange={(e) => setHastaCustom(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={load}>Aplicar</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /><p>Cargando estadísticas…</p></div>
        ) : stats ? (
          <>
            {/* Print header (solo visible al imprimir) */}
            <div style={{ display: 'none' }} className="print-only">
              <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                Reporte de Incidentes — Universidad de la Amazonia
              </h2>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>
                Período: {periodo} · Generado: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>

            {/* KPIs */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total de incidentes</div>
              </div>
              {ESTADOS_INCIDENTE.map((e) => (
                <div className="stat-card" key={e}>
                  <div className="stat-number" style={{ color: ESTADO_COLORS[e] }}>{stats.porEstado[e] || 0}</div>
                  <div className="stat-label">{e}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {/* Gráfica de torta — por estado */}
              <div className="card">
                <p className="section-title">🔵 Incidentes por Estado</p>
                {pieData.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <p className="empty-state-text">Sin datos para mostrar</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={45}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={ESTADO_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} incidentes`]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Gráfica de barras — por tipo */}
              <div className="card">
                <p className="section-title">📊 Incidentes por Tipo</p>
                {barData.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <p className="empty-state-text">Sin datos para mostrar</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-40} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip formatter={(v) => [`${v} incidentes`]} />
                      <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                        {barData.map((_, i) => (
                          <Cell key={i} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Tabla detallada por tipo */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <p className="section-title">📋 Detalle por Tipo de Incidente</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Tipo</th>
                      <th style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right' }}>Cantidad</th>
                      <th style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right' }}>% del total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIPOS_INCIDENTE.map((t) => {
                      const cnt = stats.porTipo[t.value] || 0;
                      const pct = stats.total > 0 ? ((cnt / stats.total) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={t.value} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.625rem 0.75rem' }}>{t.emoji} {t.label}</td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>{cnt}</td>
                          <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>{pct}%</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: 'var(--color-bg)', fontWeight: 700 }}>
                      <td style={{ padding: '0.625rem 0.75rem' }}>Total</td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>{stats.total}</td>
                      <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Estilos solo para impresión */}
      <style>{`
        @media print {
          .print-only { display: block !important; }
        }
      `}</style>
    </div>
  );
}

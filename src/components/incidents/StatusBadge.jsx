// Badge visual del estado de un incidente con color e ícono
import { Clock, Wrench, CheckCircle } from 'lucide-react';

const CONFIG = {
  'Reportado':   { cls: 'badge-reportado',   icon: <Clock size={11} />,        label: 'Reportado'   },
  'En proceso':  { cls: 'badge-en-proceso',  icon: <Wrench size={11} />,       label: 'En proceso'  },
  'Resuelto':    { cls: 'badge-resuelto',    icon: <CheckCircle size={11} />,  label: 'Resuelto'    },
};

export default function StatusBadge({ estado }) {
  const cfg = CONFIG[estado] || CONFIG['Reportado'];
  return (
    <span className={`badge ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

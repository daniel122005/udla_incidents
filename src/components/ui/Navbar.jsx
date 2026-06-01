import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/auth';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, PlusCircle, BarChart3, ShieldCheck,
  LogOut, Menu, X, AlertTriangle
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      toast.success('Sesión cerrada');
      navigate('/login');
    } catch {
      toast.error('Error al cerrar sesión');
    }
  }

  const links = [
    { to: '/dashboard', label: 'Inicio',       icon: <LayoutDashboard size={16} /> },
    { to: '/report',    label: 'Reportar',     icon: <PlusCircle size={16} /> },
    { to: '/stats',     label: 'Estadísticas', icon: <BarChart3 size={16} /> },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: <ShieldCheck size={16} /> }] : []),
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/dashboard" className="navbar-brand">
          <div className="navbar-logo" style={{ padding: 0, overflow: 'hidden', background: 'transparent' }}>
            <img src="/logo.jpg" alt="Logo UDLA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div className="navbar-title">UDLA Reportes</div>
            <div className="navbar-subtitle">Universidad de la Amazonia</div>
          </div>
        </NavLink>

        {/* Desktop menu */}
        <div className="navbar-menu">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                'navbar-link' + (isActive ? ' active' : '')
              }
            >
              {l.icon}
              {l.label}
            </NavLink>
          ))}

          {/* User info + logout */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginLeft:'0.5rem', paddingLeft:'0.75rem', borderLeft:'1px solid rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize:'0.75rem', opacity:0.8 }}>
              {profile?.nombre || user?.email}
              {isAdmin && <span style={{ marginLeft:'4px', background:'rgba(255,255,255,0.2)', padding:'1px 6px', borderRadius:'999px', fontSize:'0.65rem' }}>Admin</span>}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ color:'white', borderColor:'rgba(255,255,255,0.3)' }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Hamburger */}
        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          {menuOpen ? <X size={22} color="white" /> : <Menu size={22} color="white" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`navbar-mobile ${menuOpen ? 'open' : ''}`}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className="navbar-link"
            onClick={() => setMenuOpen(false)}
          >
            {l.icon}
            {l.label}
          </NavLink>
        ))}
        <button className="navbar-link btn-ghost" onClick={handleLogout} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.85)', textAlign:'left', display:'flex', alignItems:'center', gap:'0.375rem' }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

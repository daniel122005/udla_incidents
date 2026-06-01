// Ruta protegida: redirige al login si no hay sesión.
// Opcionalmente, requiere rol de administrador.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin, loading } = useAuth();

  // Mientras se inicializa Firebase Auth, mostrar pantalla de carga
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no hay sesión, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere admin y no lo es, redirigir al dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

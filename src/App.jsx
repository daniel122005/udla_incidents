import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Navbar from './components/ui/Navbar';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/ReportPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import AdminPage from './pages/AdminPage';
import StatsPage from './pages/StatsPage';

// Componente Layout que incluye el Navbar (solo visible si está autenticado)
function Layout({ children }) {
  return (
    <div className="app-container">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Notificaciones globales */}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas protegidas (Usuarios y Admin) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><DashboardPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Layout><ReportPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/:id"
            element={
              <ProtectedRoute>
                <Layout><IncidentDetailPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <Layout><StatsPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Rutas protegidas (Solo Admin) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout><AdminPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

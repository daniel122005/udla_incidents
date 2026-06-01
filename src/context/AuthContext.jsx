// Proveedor global de autenticación — disponible en toda la app mediante useAuth()
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../services/auth';

const AuthContext = createContext(null);

/**
 * Hook para acceder al contexto de autenticación desde cualquier componente.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/**
 * Proveedor que envuelve la app y expone el estado de auth.
 * Detecta cambios de sesión en tiempo real con onAuthStateChanged.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);  // Usuario de Firebase Auth
  const [profile, setProfile] = useState(null);  // Perfil de Firestore (incluye rol)
  const [loading, setLoading] = useState(true);  // Mientras se inicializa

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Cargar perfil con rol desde Firestore
        const prof = await getUserProfile(firebaseUser.uid);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Limpiar suscripción al desmontar
  }, []);

  const isAdmin = profile?.rol === 'administrador';

  const value = {
    user,          // Objeto Firebase Auth
    profile,       // Datos de Firestore (nombre, rol, etc.)
    loading,       // true mientras se inicializa
    isAdmin,       // true si es administrador
    isLoggedIn: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

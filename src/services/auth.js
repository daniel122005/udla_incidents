// Servicio de autenticación con Firebase Auth
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Registra un nuevo usuario con correo y contraseña.
 * Crea también su documento en Firestore con rol 'usuario'.
 */
export async function registerWithEmail(email, password, nombre) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Actualizar displayName en Firebase Auth
  await updateProfile(user, { displayName: nombre });

  // Crear documento del usuario en Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: email,
    nombre: nombre,
    rol: 'usuario', // Rol por defecto
    fechaRegistro: serverTimestamp(),
  });

  return user;
}

/**
 * Inicia sesión con correo y contraseña.
 */
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Obtiene el perfil del usuario desde Firestore (incluye rol).
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

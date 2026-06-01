// Servicio CRUD de incidentes en Firestore + subida de imágenes a Firebase Storage
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Constantes ────────────────────────────────────────────────────────────────

export const TIPOS_INCIDENTE = [
  { value: 'baños',          label: 'Baños',           emoji: '🚽' },
  { value: 'electricidad',   label: 'Electricidad',    emoji: '⚡' },
  { value: 'infraestructura',label: 'Infraestructura', emoji: '🏗️' },
  { value: 'seguridad',      label: 'Seguridad',       emoji: '🔒' },
  { value: 'agua',           label: 'Fuga de agua',    emoji: '💧' },
  { value: 'limpieza',       label: 'Limpieza',        emoji: '🧹' },
  { value: 'otro',           label: 'Otro',            emoji: '📋' },
];

export const ESTADOS_INCIDENTE = ['Reportado', 'En proceso', 'Resuelto'];

export const UBICACIONES = [
  // --- SEDE EL PORVENIR ---
  'Bloque 1 - Sede Porvenir',
  'Bloque 2 - Sede Porvenir',
  'Bloque 3 - Sede Porvenir',
  'Bloque 4 - Sede Porvenir',
  'Bloque 5 - Sede Porvenir',
  'Bloque 6 - Sede Porvenir',
  'Bloque 7 - Sede Porvenir',
  'Biblioteca - Sede Porvenir',
  'Cafetería - Sede Porvenir',
  'Canchas deportivas - Sede Porvenir',
  'Laboratorios - Sede Porvenir',
  'Parqueadero - Sede Porvenir',
  'Auditorio Ángel Cuniberti - Sede Porvenir',
  'Rectoría - Sede Porvenir',
  'Bienestar Universitario - Sede Porvenir',
  'Entrada principal - Sede Porvenir',

  // --- SEDE CENTRO-IDEMA (Estructura y Comunes) ---
  'Bloque A - Sede Centro-Idema',
  'Bloque B - Sede Centro-Idema',
  'Bloque C - Sede Centro-Idema',
  'Laboratorios - Sede Centro-Idema',
  'Consultorio Jurídico - Sede Centro-Idema',
  'Auditorio - Sede Centro-Idema',
  'Cafetería - Sede Centro-Idema',
  'Entrada principal - Sede Centro-Idema',

  // --- SALAS DE SISTEMAS Y TECNOLOGÍA - SEDE CENTRO ---
  'Sala UniTIC - Sede Centro-Idema',
  'Sala de Sistemas 1 - Sede Centro-Idema',
  'Sala de Sistemas 2 - Sede Centro-Idema',
  'Sala de Sistemas (Distancia) - Sede Centro-Idema',

  // --- GENERALES / OTROS ---
  'Sede Macagual (CIMAZ)',
  'Otro lugar'
];

// ─── Subida de imágenes ────────────────────────────────────────────────────────

/**
 * Convierte una imagen a Base64 comprimido para guardarla directo en Firestore
 * Esto evita el cobro/plan de Firebase Storage.
 * @param {File} file - Archivo de imagen
 * @param {string} incidentId - No se usa en esta versión
 * @param {function} onProgress - Callback de progreso
 */
export function uploadImage(file, incidentId, onProgress) {
  return new Promise((resolve, reject) => {
    if (onProgress) onProgress(10);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (onProgress) onProgress(40);
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        if (onProgress) onProgress(60);
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Resolución máxima
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir a JPEG 60% calidad para que pese poco y entre en Firestore
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        if (onProgress) onProgress(100);
        resolve(dataUrl); // Retornamos el Base64 como URL
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// ─── CRUD de incidentes ────────────────────────────────────────────────────────

/**
 * Crea un nuevo incidente en Firestore.
 * La imagen ya debe estar subida; se recibe la URL.
 */
export async function createIncident(data, userId, userEmail) {
  const docRef = await addDoc(collection(db, 'incidents'), {
    usuarioId: userId,
    usuarioEmail: userEmail,
    tipo: data.tipo,
    descripcion: data.descripcion,
    imagenURL: data.imagenURL || '',
    ubicacionTexto: data.ubicacionTexto,
    latitud: data.latitud || null,
    longitud: data.longitud || null,
    fechaCreacion: serverTimestamp(),
    estado: 'Reportado',
    grupoId: null,
  });
  return docRef.id;
}

/**
 * Obtiene todos los incidentes (para admin) u solo los del usuario.
 * Permite filtrar por estado.
 */
export async function getIncidents({ userId = null, estado = null } = {}) {
  const snap = await getDocs(collection(db, 'incidents'));
  let incidents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (userId) {
    incidents = incidents.filter((inc) => inc.usuarioId === userId);
  }
  if (estado && estado !== 'Todos') {
    incidents = incidents.filter((inc) => inc.estado === estado);
  }

  // Ordenar por fechaCreacion descendente en memoria para evitar errores de índices
  incidents.sort((a, b) => {
    const timeA = a.fechaCreacion?.toDate?.()?.getTime() || 0;
    const timeB = b.fechaCreacion?.toDate?.()?.getTime() || 0;
    return timeB - timeA;
  });

  return incidents;
}

/**
 * Obtiene un incidente por su ID.
 */
export async function getIncidentById(id) {
  const snap = await getDoc(doc(db, 'incidents', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Actualiza el estado de un incidente (y del grupo si pertenece a uno).
 */
export async function updateIncidentStatus(id, nuevoEstado, grupoId = null) {
  const batch = writeBatch(db);

  // Actualizar el incidente principal
  batch.update(doc(db, 'incidents', id), {
    estado: nuevoEstado,
    fechaActualizacion: serverTimestamp(),
  });

  // Si pertenece a un grupo, actualizar todos los del grupo
  if (grupoId) {
    const grupoSnap = await getDoc(doc(db, 'groups', grupoId));
    if (grupoSnap.exists()) {
      const { incidentIds } = grupoSnap.data();
      for (const incId of incidentIds) {
        if (incId !== id) {
          batch.update(doc(db, 'incidents', incId), {
            estado: nuevoEstado,
            fechaActualizacion: serverTimestamp(),
          });
        }
      }
      batch.update(doc(db, 'groups', grupoId), { estado: nuevoEstado });
    }
  }

  await batch.commit();
}

/**
 * Agrupa varios incidentes bajo un mismo grupoId (RF-10).
 * Crea un documento en la colección 'groups'.
 */
export async function groupIncidents(incidentIds) {
  if (incidentIds.length < 2) throw new Error('Selecciona al menos 2 incidentes para agrupar.');

  // Obtener el primer incidente para heredar tipo y estado
  const first = await getIncidentById(incidentIds[0]);

  const groupRef = await addDoc(collection(db, 'groups'), {
    incidentIds,
    tipo: first?.tipo || 'otro',
    estado: first?.estado || 'Reportado',
    fechaCreacion: serverTimestamp(),
  });

  // Actualizar cada incidente con el grupoId
  const batch = writeBatch(db);
  for (const id of incidentIds) {
    batch.update(doc(db, 'incidents', id), { grupoId: groupRef.id });
  }
  await batch.commit();

  return groupRef.id;
}

/**
 * Obtiene estadísticas de incidentes por período.
 */
export async function getStats({ desde = null, hasta = null } = {}) {
  const snap = await getDocs(collection(db, 'incidents'));
  let incidents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Filtrar por fechas si se proporcionan
  if (desde) {
    incidents = incidents.filter((inc) => {
      const fecha = inc.fechaCreacion?.toDate?.();
      return fecha && fecha >= desde;
    });
  }
  if (hasta) {
    const hastaFin = new Date(hasta);
    hastaFin.setHours(23, 59, 59, 999);
    incidents = incidents.filter((inc) => {
      const fecha = inc.fechaCreacion?.toDate?.();
      return fecha && fecha <= hastaFin;
    });
  }

  // Calcular estadísticas
  const total = incidents.length;
  const porEstado = {};
  const porTipo = {};

  ESTADOS_INCIDENTE.forEach((e) => (porEstado[e] = 0));
  TIPOS_INCIDENTE.forEach((t) => (porTipo[t.value] = 0));

  for (const inc of incidents) {
    if (porEstado[inc.estado] !== undefined) porEstado[inc.estado]++;
    if (porTipo[inc.tipo] !== undefined) porTipo[inc.tipo]++;
  }

  return { total, porEstado, porTipo, incidents };
}

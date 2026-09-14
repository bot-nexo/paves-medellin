// ── Estado de sesión del admin (store mínimo con useSyncExternalStore) ─────
// Independiente del contexto de React: el guard y el login leen la misma
// fuente, sin prop-drilling ni re-renders innecesarios.
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";

let session = null;
let ready = false;
const listeners = new Set();

// Snapshot cacheado: useSyncExternalStore compara por identidad (Object.is).
// Devolver un objeto nuevo en cada llamada provocaría un bucle infinito de renders.
let snapshot = { session, ready };

const emit = () => {
  const next = { session, ready };
  // Solo notificamos (y cambiamos identidad) si hubo una transición real
  if (next.session === snapshot.session && next.ready === snapshot.ready) return;
  snapshot = next;
  listeners.forEach((fn) => fn());
};

export const setAdminSession = (newSession) => {
  session = newSession;
  ready = true;
  emit();
};

/** Suscripción para useSyncExternalStore. */
export const subscribeSession = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Estado actual: { session, ready } (misma identidad mientras no cambie) */
export const getSessionState = () => snapshot;

/** Inicia la escucha de sesión de Supabase (llamar una vez desde main). */
export async function initSessionListener() {
  if (!isSupabaseConfigured) {
    setAdminSession(null);
    return;
  }
  const { data } = await supabase.auth.getSession();
  setAdminSession(data?.session ?? null);

  supabase.auth.onAuthStateChange((_event, newSession) => {
    setAdminSession(newSession);
  });
}

/** Cierra sesión del dueño. */
export async function logoutAdmin() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  setAdminSession(null);
}

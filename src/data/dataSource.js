// ── Fuente de datos (adapter): Supabase ↔ Local ────────────────────────────
// Punto único de acceso al catálogo para TODA la app (tienda + panel admin).
//
// Prioridad:
//   1. Supabase (si VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY están definidas)
//   2. Fallback local (src/data/menu.js) si Supabase no está configurado,
//      falla la red o devuelve vacío → la tienda NUNCA se rompe.
//
// El shape de los datos es idéntico al que ya consume la tienda
// (ver src/data/menu.js), así no hay que tocar MenuCard/Menu/etc.
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";
import {
  products as localProducts,
  categories as localCategories,
  info as localInfo,
  localImagesByNombre,
} from "./menu";
import { VALOR_DOMICILIO, MINIMO_ENVIO_GRATIS, calculateItemUnitPrice } from "../utils/price";

// ── Cache en memoria + suscripción a cambios (realtime) ─────────────────────
const cache = { categories: null, products: null, settings: null };
const listeners = new Set();

const notify = () => listeners.forEach((fn) => { try { fn(); } catch { /* noop */ } });

/** Suscribe un callback a los cambios del catálogo (realtime). Devuelve unsubscribe. */
export const subscribeToCatalog = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** ¿La app está leyendo de Supabase? (útil para badges de estado en el panel) */
export const isUsingSupabase = () => isSupabaseConfigured;

// ── Normalizadores: fila BD → shape de la tienda ────────────────────────────
const normalizeCategory = (row) => ({
  id: row.nombre,
  nombre: row.nombre,
  emoji: row.emoji || "",
  label: row.label || `${row.emoji || ""} ${row.nombre}`.trim(),
  orden: row.orden ?? 0,
  visible: row.visible !== false,
});

const resolveImage = (row) =>
  (row.imagen_url || "").trim() || localImagesByNombre[row.nombre] || "";

const normalizeProduct = (row) => {
  const { categories: _cat, ...rest } = row;
  return {
    ...rest,
    category: row.categories?.nombre || "",
    imagen: resolveImage(row),
  };
};

const normalizeSettings = (row) => ({
  name: localInfo.name,
  phone: row.phone || localInfo.phone,
  address: row.address || localInfo.address,
  mapsGoogle: row.maps_url || localInfo.mapsGoogle,
  instagram: row.instagram || localInfo.instagram,
  facebook: row.facebook || localInfo.facebook,
  tiktok: row.tiktok || localInfo.tiktok,
  closed: localInfo.closed || "",
  day1: row.day1 || localInfo.day1,
  hours1: row.hours1 || localInfo.hours1,
  deliveryFee: row.delivery_fee ?? VALOR_DOMICILIO,
  freeDeliveryThreshold: row.free_delivery_threshold ?? MINIMO_ENVIO_GRATIS,
});

// ── Fallbacks locales (datos actuales del catálogo) ──────────────────────────
const buildLocalCategories = () =>
  localCategories
    .filter((c) => c.id !== "Todo")
    .map((c, i) => ({
      id: c.id,
      nombre: c.id,
      emoji: "",
      label: c.label,
      orden: i + 1,
      visible: true,
    }));

const buildLocalProducts = () =>
  localProducts.map((p, i) => ({
    ...p,
    category_id: null,
    category: p.category,
    orden: i + 1,
    disponible: p.disponible !== false,
    nota: p.nota || "",
  }));

const buildLocalSettings = () => ({
  ...localInfo,
  deliveryFee: VALOR_DOMICILIO,
  freeDeliveryThreshold: MINIMO_ENVIO_GRATIS,
});

// ── Realtime: refresca el cache cuando el admin cambia algo ──────────────────
let realtimeInitialized = false;
const initRealtime = () => {
  if (!isSupabaseConfigured || realtimeInitialized) return;
  realtimeInitialized = true;

  const invalidate = (key, refetch) => {
    cache[key] = null;
    refetch().then(notify).catch(() => {});
  };

  supabase
    .channel("catalogo-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" },
      () => invalidate("products", getProducts))
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" },
      () => invalidate("categories", getCategories))
    .on("postgres_changes", { event: "*", schema: "public", table: "settings" },
      () => invalidate("settings", getSettings))
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        realtimeInitialized = false; // permite reintento en la próxima lectura
      }
    });
};

/** Fuerza recarga del cache en la próxima lectura (lo usa el panel admin tras escribir). */
export const invalidateCatalog = () => {
  cache.categories = null;
  cache.products = null;
  cache.settings = null;
};

// ── API pública: getters (siempre async, shape uniforme) ─────────────────────

/** Categorías visibles y ordenadas (para el filtro del menú). */
export async function getCategories() {
  if (cache.categories) return cache.categories;

  if (!isSupabaseConfigured) {
    cache.categories = buildLocalCategories();
    return cache.categories;
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("orden", { ascending: true });
    if (error) throw error;
    cache.categories = data.length
      ? data.map(normalizeCategory)
      : buildLocalCategories();
  } catch (e) {
    console.warn("[dataSource] categorías → fallback local:", e.message);
    cache.categories = buildLocalCategories();
  }
  return cache.categories;
}

/** Productos con categoría e imagen resuelta (orden del menú). */
export async function getProducts() {
  if (cache.products) return cache.products;
  initRealtime();

  if (!isSupabaseConfigured) {
    cache.products = buildLocalProducts();
    return cache.products;
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(nombre)")
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });
    if (error) throw error;
    cache.products = data.length
      ? data.map(normalizeProduct)
      : buildLocalProducts();
  } catch (e) {
    console.warn("[dataSource] productos → fallback local:", e.message);
    cache.products = buildLocalProducts();
  }
  return cache.products;
}

/** Configuración del negocio (info de contacto + costos de domicilio). */
export async function getSettings() {
  if (cache.settings) return cache.settings;

  if (!isSupabaseConfigured) {
    cache.settings = buildLocalSettings();
    return cache.settings;
  }

  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    cache.settings = data ? normalizeSettings(data) : buildLocalSettings();
  } catch (e) {
    console.warn("[dataSource] settings → fallback local:", e.message);
    cache.settings = buildLocalSettings();
  }
  return cache.settings;
}

// ── Pedidos: guardado silencioso antes de enviar a WhatsApp (F2) ─────────────

/** Convierte el carrito en un snapshot jsonb serializable para orders.items. */
export const buildOrderItems = (cart) =>
  cart.map((item) => ({
    nombre: item.nombre,
    cantidad: item.quantity,
    precio_unitario: calculateItemUnitPrice(item),
    opciones: Object.values(item.customizations?.options || {})
      .filter(Boolean)
      .map((o) => o.nombre || o.name || ""),
    toppings: (item.customizations?.toppings || []).map(
      (t) => (typeof t === "object" ? t.nombre || t.name : t) || "",
    ),
    observaciones: item.customizations?.observaciones || "",
  }));

/**
 * Registra un pedido en la BD. NUNCA lanza: la tienda continúa hacia
 * WhatsApp aunque el guardado falle (la BD es trazabilidad, no bloqueo).
 * @returns {{ ok: boolean, persisted: boolean, numero: number|null, reason?: string }}
 */
export async function createOrder(deliveryData, cart, totals) {
  if (!isSupabaseConfigured) {
    return { ok: false, persisted: false, numero: null, reason: "supabase-no-configurado" };
  }
  try {
    // Nota: NO usamos .select() tras el insert — devolver datos requeriría
    // SELECT para anon en orders (fuga de privacidad: teléfonos/direcciones).
    // El nº de pedido se genera igual en la BD (identity) y el admin lo ve en
    // el panel. En F6 se agrega una función RPC segura para devolver el nº.
    const { error } = await supabase.from("orders").insert({
      nombre: deliveryData.nombre,
      telefono: deliveryData.telefono,
      direccion: deliveryData.direccion || "",
      unidad: deliveryData.unidad || "",
      apto: deliveryData.apto || "",
      observaciones: deliveryData.observaciones || "",
      pago: deliveryData.pago || "",
      subtotal: totals.subtotal,
      delivery_fee: totals.deliveryFee,
      total: totals.total,
      items: buildOrderItems(cart),
    });
    if (error) throw error;
    return { ok: true, persisted: true, numero: null };
  } catch (e) {
    console.error("[dataSource] pedido no guardado en BD:", e.message);
    return { ok: false, persisted: false, numero: null, reason: e.message };
  }
}

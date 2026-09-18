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
import { deleteProductImage } from "../services/storage";
import {
  products as localProducts,
  categories as localCategories,
  info as localInfo,
  localImagesByNombre,
} from "./menu";
import { calculateItemUnitPrice } from "../utils/price";

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

// Placeholder SVG (data URI) para productos sin foto (creados desde el panel
// antes de subir imagen) — evita <img> rotos en tienda y panel.
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23241a15'/%3E%3Ctext x='50%25' y='50%25' font-size='120' text-anchor='middle' dominant-baseline='central'%3E%F0%9F%8D%A8%3C/text%3E%3C/svg%3E";

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
  (row.imagen_url || "").trim() || localImagesByNombre[row.nombre] || PLACEHOLDER_IMG;

const normalizeProduct = (row) => {
  const { categories: _cat, product_additions: _pa, product_sauces: _ps, ...rest } = row;
  return {
    ...rest,
    category: row.categories?.nombre || "",
    imagen: resolveImage(row),
    // Adiciones asociadas al producto (con su flag de requerido), ocultando no disponibles
    adiciones: (row.product_additions || [])
      .map((pa) => (pa.additions ? { ...pa.additions, requerido: pa.requerido } : null))
      .filter((a) => a && a.disponible !== false),
    // Salsas asociadas al producto (con su flag de requerido), ocultando no disponibles
    salsas: (row.product_sauces || [])
      .map((ps) => (ps.sauces ? { ...ps.sauces, requerido: ps.requerido } : null))
      .filter((s) => s && s.disponible !== false),
  };
};

const normalizeSettings = (row) => {
  let offersDelivery = row.offers_delivery !== false;
  let offersPickup = row.offers_pickup !== false;
  let offersLocal = row.offersLocal !== false;

  // Seguro contra BD inconsistente
  if (!offersDelivery && !offersPickup && !offersLocal) {
    offersDelivery = true;
  }

  return {
    name: localInfo.name,
    razon_social: row.razon_social || localInfo.name,
    phone: row.phone || localInfo.phone,
    address: row.address || localInfo.address,
    mapsGoogle: row.maps_url || localInfo.mapsGoogle,
    instagram: row.instagram || localInfo.instagram,
    facebook: row.facebook || localInfo.facebook,
    tiktok: row.tiktok || localInfo.tiktok,
    closed: localInfo.closed || "",
    day1: row.day1 || localInfo.day1,
    hours1: row.hours1 || localInfo.hours1,
    logo_url: row.logo_url || "",
    deliveryFee: row.delivery_fee ?? VALOR_DOMICILIO,
    freeDeliveryThreshold: row.free_delivery_threshold ?? MINIMO_ENVIO_GRATIS,
    offersDelivery,
    offersPickup,
    offersLocal,
    forceClosed: row.force_closed === true,
    bankAccounts: Array.isArray(row.bank_accounts) ? row.bank_accounts : [],
    isActive: row.is_active !== false,
    canChangePassword: row.can_change_password !== false,
  };
};

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
  offersDelivery: true,
  offersPickup: true,
  offersLocal: true,
  forceClosed: false,
  bankAccounts: [],
  isActive: true,
  canChangePassword: true,
});

// ── Realtime: refresca el cache cuando el admin cambia algo ──────────────────
let realtimeInitialized = false;
const initRealtime = () => {
  if (!isSupabaseConfigured || realtimeInitialized) return;
  realtimeInitialized = true;

  const invalidate = (key, refetch) => {
    cache[key] = null;
    refetch().then(notify).catch(() => { });
  };

  supabase
    .channel("catalogo-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" },
      () => invalidate("products", getProducts))
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" },
      () => invalidate("categories", getCategories))
    .on("postgres_changes", { event: "*", schema: "public", table: "settings" },
      () => invalidate("settings", getSettings))
    .on("postgres_changes", { event: "*", schema: "public", table: "additions" },
      () => invalidate("products", getProducts))
    .on("postgres_changes", { event: "*", schema: "public", table: "sauces" },
      () => invalidate("products", getProducts))
    .on("postgres_changes", { event: "*", schema: "public", table: "product_additions" },
      () => invalidate("products", getProducts))
    .on("postgres_changes", { event: "*", schema: "public", table: "product_sauces" },
      () => invalidate("products", getProducts))
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
      .eq("visible", true) // la tienda solo ve las categorías visibles (el admin usa getCategoriesRaw)
      .order("orden", { ascending: true });
    if (error) throw error;
    // Resultado vacío VÁLIDO (todo oculto) se respeta; solo errores caen a local
    cache.categories = data.map(normalizeCategory);
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
      .select(
        `*,
        categories(nombre),
        product_additions(requerido, additions(*)),
        product_sauces(requerido, sauces(*))`
      )
      .order("orden", { ascending: true })
      .order("nombre", { ascending: true });
    if (error) throw error;
    // Resultado vacío VÁLIDO (catálogo vaciado por el admin) se respeta
    cache.products = data.map(normalizeProduct);
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

/** Obtiene el rol del usuario desde user_roles. Si falla o no existe, asume 'admin' por defecto. */
export async function getUserRole(userId) {
  if (!isSupabaseConfigured || !userId) return "admin";
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    const resolvedRole = data?.role || "admin";
    console.log(`[dataSource] Rol obtenido para ${userId}:`, resolvedRole, data ? "" : "(no existía fila en user_roles, usando 'admin')");
    return resolvedRole;
  } catch (err) {
    console.error("[dataSource] Error obteniendo rol:", err.message);
    return "admin";
  }
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
    adiciones: Object.values(item.customizations?.adiciones || {}).map(
      (a) => a.nombre || ""
    ),
    salsas: Object.values(item.customizations?.salsas || {}).map(
      (s) => s.nombre || ""
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

  const items = buildOrderItems(cart);

  try {
    // 1º intento: RPC segura (devuelve el nº para el mensaje de WhatsApp
    // sin conceder SELECT de orders a anon — protege datos de otros clientes)
    const { data: numero, error } = await supabase.rpc("crear_pedido", {
      p_nombre: deliveryData.nombre,
      p_telefono: deliveryData.telefono,
      p_direccion: deliveryData.direccion || "",
      p_unidad: deliveryData.unidad || "",
      p_apto: deliveryData.apto || "",
      p_observaciones: deliveryData.observaciones || "",
      p_pago: deliveryData.pago || "",
      p_subtotal: totals.subtotal,
      p_delivery_fee: totals.deliveryFee,
      p_total: totals.total,
      p_items: items,
      p_tipo_entrega: deliveryData.tipoEntrega || "domicilio",
    });
    if (error) throw error;
    return { ok: true, persisted: true, numero: numero ?? null };
  } catch (eRpc) {
    // 2º intento: insert directo (por si la RPC aún no fue aplicada en la BD).
    // El nº no se conoce aquí, pero el pedido queda registrado igual.
    try {
      const { error } = await supabase.from("orders").insert({
        nombre: deliveryData.nombre,
        telefono: deliveryData.telefono,
        direccion: deliveryData.direccion || "",
        unidad: deliveryData.unidad || "",
        apto: deliveryData.apto || "",
        observaciones: deliveryData.observaciones || "",
        pago: deliveryData.pago || "",
        tipo_entrega: deliveryData.tipoEntrega || "domicilio",
        subtotal: totals.subtotal,
        delivery_fee: totals.deliveryFee,
        total: totals.total,
        items,
      });
      if (error) throw error;
      return { ok: true, persisted: true, numero: null };
    } catch (e2) {
      console.error("[dataSource] pedido no guardado en BD:", e2.message);
      return { ok: false, persisted: false, numero: null, reason: e2.message };
    }
  }
}

// ── Escrituras del panel admin (requieren sesión iniciada — RLS) ────────────

/** Categorías crudas (con UUID) para el formulario de productos del panel. */
export async function getCategoriesRaw() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, nombre, orden, visible")
    .order("orden", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createProduct(data) {
  const { data: row, error } = await supabase
    .from("products")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  invalidateCatalog(); // la tienda se refresca sola (realtime + cache invalidada)
  return row;
}

export async function updateProduct(id, cambios) {
  const { error } = await supabase
    .from("products")
    .update(cambios)
    .eq("id", id);
  if (error) throw error;
  invalidateCatalog();
}

export async function deleteProduct(id) {
  // La foto del bucket también se limpia (ahorro en la capa gratuita)
  const { data: row } = await supabase
    .from("products")
    .select("imagen_url")
    .eq("id", id)
    .single();
  if (row?.imagen_url) await deleteProductImage(row.imagen_url);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  invalidateCatalog();
}

// ── Categorías (panel admin) ────────────────────────────────────────────────

export async function createCategory(data) {
  const { data: row, error } = await supabase
    .from("categories")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  invalidateCatalog();
  return row;
}

export async function updateCategory(id, cambios) {
  const { error } = await supabase
    .from("categories")
    .update(cambios)
    .eq("id", id);
  if (error) throw error;
  invalidateCatalog();
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
  invalidateCatalog();
}

// ── Adiciones (panel admin) ─────────────────────────────────────────────────

/** Lista todas las adiciones del catálogo (disponibles o no). */
export async function getAdditions() {
  const { data, error } = await supabase
    .from("additions")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createAddition(data) {
  const { data: row, error } = await supabase
    .from("additions")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

export async function updateAddition(id, cambios) {
  const { error } = await supabase.from("additions").update(cambios).eq("id", id);
  if (error) throw error;
  invalidateCatalog();
}

export async function deleteAddition(id) {
  const { error } = await supabase.from("additions").delete().eq("id", id);
  if (error) throw error;
  invalidateCatalog();
}

// ── Salsas (panel admin) ────────────────────────────────────────────────────

/** Lista todas las salsas del catálogo (disponibles o no). */
export async function getSauces() {
  const { data, error } = await supabase
    .from("sauces")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createSauce(data) {
  const { data: row, error } = await supabase
    .from("sauces")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  invalidateCatalog();
  return row;
}

export async function updateSauce(id, cambios) {
  const { error } = await supabase.from("sauces").update(cambios).eq("id", id);
  if (error) throw error;
  invalidateCatalog();
}

export async function deleteSauce(id) {
  const { error } = await supabase.from("sauces").delete().eq("id", id);
  if (error) throw error;
  invalidateCatalog();
}

// ── Asociaciones Producto ↔ Adiciones / Salsas ──────────────────────────────

/**
 * Sincroniza las adiciones de un producto:
 * borra todas las filas actuales e inserta las nuevas.
 * @param {string} productId
 * @param {Array<{id: string, requerido: boolean}>} items
 */
export async function setProductAdditions(productId, items) {
  // 1. Borrar las filas anteriores
  const { error: delError } = await supabase
    .from("product_additions")
    .delete()
    .eq("product_id", productId);
  if (delError) throw delError;

  // 2. Insertar las nuevas (si hay alguna)
  if (items.length === 0) return;
  const rows = items.map(({ id, requerido }) => ({
    product_id: productId,
    addition_id: id,
    requerido: !!requerido,
  }));
  const { error: insError } = await supabase.from("product_additions").insert(rows);
  if (insError) throw insError;
  invalidateCatalog();
}

/**
 * Sincroniza las salsas de un producto:
 * borra todas las filas actuales e inserta las nuevas.
 * @param {string} productId
 * @param {Array<{id: string, requerido: boolean}>} items
 */
export async function setProductSauces(productId, items) {
  const { error: delError } = await supabase
    .from("product_sauces")
    .delete()
    .eq("product_id", productId);
  if (delError) throw delError;

  if (items.length === 0) return;
  const rows = items.map(({ id, requerido }) => ({
    product_id: productId,
    sauce_id: id,
    requerido: !!requerido,
  }));
  const { error: insError } = await supabase.from("product_sauces").insert(rows);
  if (insError) throw insError;
  invalidateCatalog();
}

// ── Pedidos (panel admin) ───────────────────────────────────────────────────

// ── Configuración (panel admin) ─────────────────────────────────────────────
// Mapea las claves normalizadas → columnas reales de la tabla settings
const COLUMNAS_SETTINGS = {
  mapsGoogle: "maps_url",
  logo_url: "logo_url",
  deliveryFee: "delivery_fee",
  freeDeliveryThreshold: "free_delivery_threshold",
  offersDelivery: "offers_delivery",
  offersPickup: "offers_pickup",
  offersLocal: "offersLocal",
  forceClosed: "force_closed",
  bankAccounts: "bank_accounts",
  isActive: "is_active",
  canChangePassword: "can_change_password",
};

/** Actualiza la fila única de settings (upsert: crea la fila si no existe). */
export async function updateSettings(cambios) {
  const fila = {};
  Object.entries(cambios).forEach(([clave, valor]) => {
    fila[COLUMNAS_SETTINGS[clave] || clave] = valor;
  });
  const { error } = await supabase.from("settings").upsert({ id: 1, ...fila });
  if (error) throw error;
  invalidateCatalog(); // la tienda refresca WhatsApp/domicilios en segundos
}

const normalizeOrder = (row) => ({
  ...row,
  items: Array.isArray(row.items) ? row.items : [],
});

/** Lista de pedidos, más recientes primero (solo admin — RLS). */
export async function getOrders(limite = 200) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data.map(normalizeOrder);
}

/** Cambia el estado de un pedido (flujo del negocio). */
export async function updateOrderStatus(id, estado) {
  const { error } = await supabase.from("orders").update({ estado }).eq("id", id);
  if (error) throw error;
}

/**
 * Realtime de pedidos para el panel: notifica INSERT (pedido nuevo 🛎️) y
 * UPDATE (cambio de estado desde otro dispositivo). Devuelve unsubscribe.
 */
export function subscribeToOrders(fn) {
  if (!isSupabaseConfigured) return () => { };
  const channel = supabase
    .channel("pedidos-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      (payload) => fn("insert", normalizeOrder(payload.new)),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders" },
      (payload) => fn("update", normalizeOrder(payload.new)),
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

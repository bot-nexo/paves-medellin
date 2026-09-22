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
  VALOR_DOMICILIO_DEFAULT,
  MINIMO_ENVIO_GRATIS_DEFAULT,
} from "./menu";
import { calculateItemUnitPrice } from "../utils/price";

// ── Cache en memoria + suscripción a cambios (realtime) ─────────────────────
const cache = { categories: null, products: null, settings: null, design: null };
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
    deliveryFee: row.delivery_fee ?? VALOR_DOMICILIO_DEFAULT,
    freeDeliveryThreshold: row.free_delivery_threshold ?? MINIMO_ENVIO_GRATIS_DEFAULT,
    offersDelivery,
    offersPickup,
    offersLocal,
    forceClosed: row.force_closed === true,
    isActive: row.is_active !== false,
    canChangePassword: row.can_change_password !== false,
  };
};

// ── Promociones y Combos Iniciales por Defecto ─────────────────────────────
export const DEFAULT_PROMOTIONS_ITEMS = [
  {
    id: "promo-1",
    titulo: "2x1 en Pavés Seleccionados",
    tag: "Viernes & Sábados",
    descripcion: "Lleva dos deliciosos Pavés de 8oz al precio de uno en sabores tradicionales.",
    descuento: "2x1",
    imagen: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "promo-2",
    titulo: "Envío Gratis en Compras > $45.000",
    tag: "Toda la semana",
    descripcion: "Disfruta de tus postres favoritos en casa sin costo adicional de domicilio.",
    descuento: "ENVÍO GRATIS",
    imagen: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=80",
  },
];

export const DEFAULT_COMBOS_ITEMS = [
  {
    id: "combo-1",
    nombre: "Combo Dúo Pavé + Torta",
    precio: 32000,
    precioOriginal: 38000,
    badge: "Ahorra $6.000",
    descripcion: "1 Pavé 8oz tradicional de Leche Klim + 1 Porción de Torta húmeda de chocolate con toppings.",
    incluye: ["1x Pavé 8oz (Leche Klim)", "1x Torta húmeda de chocolate"],
    imagen: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "combo-2",
    nombre: "Pack Familiar 4 Pavés",
    precio: 62000,
    precioOriginal: 72000,
    badge: "Más Popular 🔥",
    descripcion: "4 Pavés de 8oz a elección, perfecto para compartir en familia o con amigos.",
    incluye: ["4x Pavés 8oz a elección", "Cucharas y servilletas"],
    imagen: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80",
  },
];

// ── Diseño del Menú / Catálogo por Defecto (Fallback idéntico al actual) ────
export const DEFAULT_CATALOG_DESIGN = {
  // Global
  appBg: "#0d0805",
  fontFamily: "Montserrat",

  // Hero
  heroBg: "linear-gradient(180deg, #0d0805 0%, #140c08 100%)",
  heroHeaderBg: "rgba(13, 8, 5, 0.85)",
  heroCtaBg: "#ffcc00",
  heroCtaText: "#120a06",
  heroBadgeBg: "rgba(255, 204, 0, 0.15)",
  heroBadgeText: "#ffcc00",
  heroFloatCartBg: "#ffcc00",
  heroFloatCartText: "#120a06",

  // Promociones
  showPromotions: true,
  promotionsTitle: "Promociones & Especiales",
  promotionsSubtitle: "Aprovecha nuestras ofertas por tiempo limitado en tus postres favoritos",
  promotionsBg: "#120a06",
  promotionsCardBg: "#180e09",
  promotionsAccent: "#ffcc00",
  promotionsItems: DEFAULT_PROMOTIONS_ITEMS,

  // Combos
  showCombos: true,
  combosTitle: "Combos & Packs para Compartir",
  combosSubtitle: "Las combinaciones perfectas al mejor precio para tus momentos dulces",
  combosBg: "#0f0906",
  combosCardBg: "#180e09",
  combosAccent: "#d92b38",
  combosItems: DEFAULT_COMBOS_ITEMS,

  // Menú
  bgColor: "#0d0805",
  cardBg: "#160e0a",
  headerBadgeBg: "rgba(255, 204, 0, 0.12)",
  headerBadgeText: "#ffcc00",
  textPrimary: "#fdfbf7",
  textMuted: "#bda899",
  borderColor: "rgba(255, 255, 255, 0.08)",
  cardRadius: "22px",
  cardShadow: "md",
  btnPrimaryBg: "#ffcc00",
  btnPrimaryText: "#120a06",
  btnDetailsBg: "rgba(255, 255, 255, 0.05)",
  btnDetailsText: "#e2d5cc",
  btnDetailsBorder: "rgba(255, 255, 255, 0.12)",
  priceTagBg: "#ffcc00",
  priceTagText: "#120a06",
  badgePopularBg: "#ffcc00",
  badgePopularText: "#120a06",
  categoryBarBg: "rgba(20, 12, 8, 0.9)",
  categoryActiveBg: "#ffcc00",
  categoryActiveText: "#120a06",
  categoryInactiveBg: "transparent",
  categoryInactiveText: "#bda899",
  columnsDesktop: "auto",
  columnsMobile: "1",
  cardLayout: "vertical",
  imageAspectRatio: "16/11",

  // Footer
  footerBg: "linear-gradient(180deg, #0d0805 0%, #060402 100%)",
  footerText: "rgba(253, 251, 247, 0.7)",
  footerAccent: "#ffcc00",
};

const isLegacyLightColor = (color) => {
  if (!color) return true;
  const c = color.trim().toLowerCase();
  return (
    c === "#fdfbf7" ||
    c === "#fecdcd" ||
    c === "#fff5f5" ||
    c === "#fff8f8" ||
    c === "#fbf8f3" ||
    c === "#ffffff" ||
    c === "#fdf1f1" ||
    c.includes("255, 255, 255") ||
    c.includes("fdf1f1") ||
    c.includes("fecdcd")
  );
};

const normalizeCatalogDesign = (row) => ({
  // Global
  appBg: !isLegacyLightColor(row.app_bg) ? row.app_bg : DEFAULT_CATALOG_DESIGN.appBg,
  fontFamily: row.font_family || DEFAULT_CATALOG_DESIGN.fontFamily,

  // Hero
  heroBg: !isLegacyLightColor(row.hero_bg) ? row.hero_bg : DEFAULT_CATALOG_DESIGN.heroBg,
  heroHeaderBg: !isLegacyLightColor(row.hero_header_bg) ? row.hero_header_bg : DEFAULT_CATALOG_DESIGN.heroHeaderBg,
  heroCtaBg: row.hero_cta_bg || DEFAULT_CATALOG_DESIGN.heroCtaBg,
  heroCtaText: row.hero_cta_text || DEFAULT_CATALOG_DESIGN.heroCtaText,
  heroBadgeBg: row.hero_badge_bg || DEFAULT_CATALOG_DESIGN.heroBadgeBg,
  heroBadgeText: row.hero_badge_text || DEFAULT_CATALOG_DESIGN.heroBadgeText,
  heroFloatCartBg: row.hero_float_cart_bg || DEFAULT_CATALOG_DESIGN.heroFloatCartBg,
  heroFloatCartText: row.hero_float_cart_text || DEFAULT_CATALOG_DESIGN.heroFloatCartText,

  // Promociones
  showPromotions: row.show_promotions !== false,
  promotionsTitle: row.promotions_title || DEFAULT_CATALOG_DESIGN.promotionsTitle,
  promotionsSubtitle: row.promotions_subtitle || DEFAULT_CATALOG_DESIGN.promotionsSubtitle,
  promotionsBg: !isLegacyLightColor(row.promotions_bg) ? row.promotions_bg : DEFAULT_CATALOG_DESIGN.promotionsBg,
  promotionsCardBg: !isLegacyLightColor(row.promotions_card_bg) ? row.promotions_card_bg : DEFAULT_CATALOG_DESIGN.promotionsCardBg,
  promotionsAccent: row.promotions_accent || DEFAULT_CATALOG_DESIGN.promotionsAccent,
  promotionsItems: Array.isArray(row.promotions_items) && row.promotions_items.length > 0
    ? row.promotions_items
    : DEFAULT_PROMOTIONS_ITEMS,

  // Combos
  showCombos: row.show_combos !== false,
  combosTitle: row.combos_title || DEFAULT_CATALOG_DESIGN.combosTitle,
  combosSubtitle: row.combos_subtitle || DEFAULT_CATALOG_DESIGN.combosSubtitle,
  combosBg: !isLegacyLightColor(row.combos_bg) ? row.combos_bg : DEFAULT_CATALOG_DESIGN.combosBg,
  combosCardBg: !isLegacyLightColor(row.combos_card_bg) ? row.combos_card_bg : DEFAULT_CATALOG_DESIGN.combosCardBg,
  combosAccent: row.combos_accent || DEFAULT_CATALOG_DESIGN.combosAccent,
  combosItems: Array.isArray(row.combos_items) && row.combos_items.length > 0
    ? row.combos_items
    : DEFAULT_COMBOS_ITEMS,

  // Menú
  bgColor: !isLegacyLightColor(row.bg_color) ? row.bg_color : DEFAULT_CATALOG_DESIGN.bgColor,
  cardBg: !isLegacyLightColor(row.card_bg) ? row.card_bg : DEFAULT_CATALOG_DESIGN.cardBg,
  headerBadgeBg: row.header_badge_bg || DEFAULT_CATALOG_DESIGN.headerBadgeBg,
  headerBadgeText: row.header_badge_text || DEFAULT_CATALOG_DESIGN.headerBadgeText,
  textPrimary: row.text_primary && row.text_primary !== "#3d2314" ? row.text_primary : DEFAULT_CATALOG_DESIGN.textPrimary,
  textMuted: row.text_muted && row.text_muted !== "#7a6353" ? row.text_muted : DEFAULT_CATALOG_DESIGN.textMuted,
  borderColor: row.border_color || DEFAULT_CATALOG_DESIGN.borderColor,
  cardRadius: row.card_radius || DEFAULT_CATALOG_DESIGN.cardRadius,
  cardShadow: row.card_shadow || DEFAULT_CATALOG_DESIGN.cardShadow,
  btnPrimaryBg: row.btn_primary_bg || DEFAULT_CATALOG_DESIGN.btnPrimaryBg,
  btnPrimaryText: row.btn_primary_text || DEFAULT_CATALOG_DESIGN.btnPrimaryText,
  btnDetailsBg: row.btn_details_bg || DEFAULT_CATALOG_DESIGN.btnDetailsBg,
  btnDetailsText: row.btn_details_text || DEFAULT_CATALOG_DESIGN.btnDetailsText,
  btnDetailsBorder: row.btn_details_border || DEFAULT_CATALOG_DESIGN.btnDetailsBorder,
  priceTagBg: row.price_tag_bg && row.price_tag_bg !== "#3d2314" ? row.price_tag_bg : DEFAULT_CATALOG_DESIGN.priceTagBg,
  priceTagText: row.price_tag_text || DEFAULT_CATALOG_DESIGN.priceTagText,
  badgePopularBg: row.badge_popular_bg || DEFAULT_CATALOG_DESIGN.badgePopularBg,
  badgePopularText: row.badge_popular_text || DEFAULT_CATALOG_DESIGN.badgePopularText,
  categoryBarBg: row.category_bar_bg || DEFAULT_CATALOG_DESIGN.categoryBarBg,
  categoryActiveBg: row.category_active_bg || DEFAULT_CATALOG_DESIGN.categoryActiveBg,
  categoryActiveText: row.category_active_text || DEFAULT_CATALOG_DESIGN.categoryActiveText,
  categoryInactiveBg: row.category_inactive_bg || DEFAULT_CATALOG_DESIGN.categoryInactiveBg,
  categoryInactiveText: row.category_inactive_text || DEFAULT_CATALOG_DESIGN.categoryInactiveText,
  columnsDesktop: row.columns_desktop || DEFAULT_CATALOG_DESIGN.columnsDesktop,
  columnsMobile: row.columns_mobile || DEFAULT_CATALOG_DESIGN.columnsMobile,
  cardLayout: row.card_layout || DEFAULT_CATALOG_DESIGN.cardLayout,
  imageAspectRatio: row.image_aspect_ratio || DEFAULT_CATALOG_DESIGN.imageAspectRatio,

  // Footer
  footerBg: row.footer_bg || DEFAULT_CATALOG_DESIGN.footerBg,
  footerText: row.footer_text || DEFAULT_CATALOG_DESIGN.footerText,
  footerAccent: row.footer_accent || DEFAULT_CATALOG_DESIGN.footerAccent,
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
  deliveryFee: VALOR_DOMICILIO_DEFAULT,
  freeDeliveryThreshold: MINIMO_ENVIO_GRATIS_DEFAULT,
  offersDelivery: true,
  offersPickup: true,
  offersLocal: true,
  forceClosed: false,
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
    .on("postgres_changes", { event: "*", schema: "public", table: "catalog_design" },
      () => invalidate("design", getCatalogDesign))
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
  cache.design = null;
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

/** Configuración de diseño y aspecto visual del catálogo. */
export async function getCatalogDesign() {
  if (cache.design) return cache.design;

  if (!isSupabaseConfigured) {
    cache.design = { ...DEFAULT_CATALOG_DESIGN };
    return cache.design;
  }

  try {
    const { data, error } = await supabase
      .from("catalog_design")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    cache.design = data ? normalizeCatalogDesign(data) : { ...DEFAULT_CATALOG_DESIGN };
  } catch (e) {
    console.warn("[dataSource] design → fallback local:", e.message);
    cache.design = { ...DEFAULT_CATALOG_DESIGN };
  }
  return cache.design;
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

const COLUMNAS_DESIGN = {
  // Global
  appBg: "app_bg",
  fontFamily: "font_family",

  // Hero
  heroBg: "hero_bg",
  heroHeaderBg: "hero_header_bg",
  heroCtaBg: "hero_cta_bg",
  heroCtaText: "hero_cta_text",
  heroBadgeBg: "hero_badge_bg",
  heroBadgeText: "hero_badge_text",
  heroFloatCartBg: "hero_float_cart_bg",
  heroFloatCartText: "hero_float_cart_text",

  // Promociones
  showPromotions: "show_promotions",
  promotionsTitle: "promotions_title",
  promotionsSubtitle: "promotions_subtitle",
  promotionsBg: "promotions_bg",
  promotionsCardBg: "promotions_card_bg",
  promotionsAccent: "promotions_accent",
  promotionsItems: "promotions_items",

  // Combos
  showCombos: "show_combos",
  combosTitle: "combos_title",
  combosSubtitle: "combos_subtitle",
  combosBg: "combos_bg",
  combosCardBg: "combos_card_bg",
  combosAccent: "combos_accent",
  combosItems: "combos_items",

  // Menú
  bgColor: "bg_color",
  cardBg: "card_bg",
  headerBadgeBg: "header_badge_bg",
  headerBadgeText: "header_badge_text",
  textPrimary: "text_primary",
  textMuted: "text_muted",
  borderColor: "border_color",
  cardRadius: "card_radius",
  cardShadow: "card_shadow",
  btnPrimaryBg: "btn_primary_bg",
  btnPrimaryText: "btn_primary_text",
  btnDetailsBg: "btn_details_bg",
  btnDetailsText: "btn_details_text",
  btnDetailsBorder: "btn_details_border",
  priceTagBg: "price_tag_bg",
  priceTagText: "price_tag_text",
  badgePopularBg: "badge_popular_bg",
  badgePopularText: "badge_popular_text",
  categoryBarBg: "category_bar_bg",
  categoryActiveBg: "category_active_bg",
  categoryActiveText: "category_active_text",
  categoryInactiveBg: "category_inactive_bg",
  categoryInactiveText: "category_inactive_text",
  columnsDesktop: "columns_desktop",
  columnsMobile: "columns_mobile",
  cardLayout: "card_layout",
  imageAspectRatio: "image_aspect_ratio",

  // Footer
  footerBg: "footer_bg",
  footerText: "footer_text",
  footerAccent: "footer_accent",
};

/** Actualiza la configuración de diseño del catálogo. */
export async function updateCatalogDesign(cambios) {
  const fila = {};
  Object.entries(cambios).forEach(([clave, valor]) => {
    fila[COLUMNAS_DESIGN[clave] || clave] = valor;
  });
  const { error } = await supabase.from("catalog_design").upsert({ id: 1, ...fila });
  if (error) throw error;
  invalidateCatalog();
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

/**
 * Valida o registra un cliente por su número de WhatsApp (único) en Supabase DB.
 * Soporta los campos: nombre, telefono, pedidos_count (o cant_pedidos_concretados), fecha_cumple (opcional).
 */
export async function getOrCreateCustomer(nombre, telefono, fechaCumple = null) {
  if (!telefono) return null;
  const cleanPhone = String(telefono).replace(/\D/g, "");
  const cleanNombre = (nombre || "").trim();
  const cleanCumple = fechaCumple ? String(fechaCumple).trim() : null;

  if (!isSupabaseConfigured) {
    return { nombre: cleanNombre, telefono: cleanPhone, pedidos_count: 0, fecha_cumple: cleanCumple };
  }

  try {
    // 1. Consultar si el cliente ya existe en la tabla 'clientes' de Supabase DB
    const { data: custData, error: custErr } = await supabase
      .from("clientes")
      .select("*")
      .eq("telefono", cleanPhone)
      .maybeSingle();

    if (!custErr && custData) {
      const currentCount = custData.pedidos_count ?? custData.cant_pedidos_concretados ?? 0;
      const updates = {};
      if (cleanNombre && custData.nombre !== cleanNombre) updates.nombre = cleanNombre;
      if (cleanCumple && custData.fecha_cumple !== cleanCumple) updates.fecha_cumple = cleanCumple;

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("clientes")
          .update({ ...updates, updated_at: new Date() })
          .eq("telefono", cleanPhone);
      }

      return {
        ...custData,
        nombre: cleanNombre || custData.nombre,
        telefono: cleanPhone,
        pedidos_count: currentCount,
        fecha_cumple: cleanCumple || custData.fecha_cumple || null,
      };
    }

    // 2. Si no existe en 'clientes', contar cuántos pedidos previos ha registrado en la tabla 'orders'
    const { data: pastOrders } = await supabase
      .from("orders")
      .select("id, nombre")
      .or(`telefono.eq.${cleanPhone},telefono.like.%${cleanPhone}%`);

    const initialCount = pastOrders ? pastOrders.length : 0;
    const pastName = (pastOrders && pastOrders[0] && pastOrders[0].nombre) ? pastOrders[0].nombre : cleanNombre;
    const finalNombre = cleanNombre || pastName;

    // 3. Ejecutar QUERY explícito de INSERCIÓN en la tabla 'clientes' de Supabase DB
    if (finalNombre) {
      const payload = {
        nombre: finalNombre,
        telefono: cleanPhone,
        pedidos_count: initialCount,
        cant_pedidos_concretados: initialCount,
        fecha_cumple: cleanCumple || null,
        created_at: new Date()
      };

      const { data: newCust, error: insertErr } = await supabase
        .from("clientes")
        .insert([payload])
        .select()
        .maybeSingle();

      if (!insertErr && newCust) {
        return {
          ...newCust,
          pedidos_count: newCust.pedidos_count ?? newCust.cant_pedidos_concretados ?? initialCount
        };
      }
    }

    return {
      nombre: finalNombre,
      telefono: cleanPhone,
      pedidos_count: initialCount,
      fecha_cumple: cleanCumple || null,
      hasOrders: initialCount > 0
    };
  } catch (err) {
    console.warn("Error en getOrCreateCustomer Supabase query:", err);
  }

  return { nombre: cleanNombre, telefono: cleanPhone, pedidos_count: 0, fecha_cumple: cleanCumple };
}

/**
 * Incrementa el contador de pedidos concretados en la tabla 'clientes' de Supabase DB al realizar una compra.
 */
export async function incrementCustomerOrderCount(telefono, nombre = "") {
  if (!telefono || !isSupabaseConfigured) return;
  const cleanPhone = String(telefono).replace(/\D/g, "");

  try {
    const cust = await getOrCreateCustomer(nombre, cleanPhone);
    const newCount = (cust?.pedidos_count ?? 0) + 1;

    await supabase
      .from("clientes")
      .update({
        pedidos_count: newCount,
        cant_pedidos_concretados: newCount,
        updated_at: new Date()
      })
      .eq("telefono", cleanPhone);
  } catch (err) {
    console.warn("Error incrementando compras en Supabase DB:", err);
  }
}


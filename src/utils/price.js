// ── Currency formatter (COP) ──────────────────────────────────────────────
export const formatCOP = (val) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(val);

// ── Price parser – handles number, "$15.000", "15000", "$19 K", etc. ──────
export const parsePrice = (priceVal) => {
  if (!priceVal) return 0;
  if (typeof priceVal === "number") return priceVal;

  const cleanNumber = priceVal.toString().replace(/[^\d.]/g, "");
  const number = parseFloat(cleanNumber);
  return isNaN(number) ? 0 : number;
};

// ── Unit price of a single cart item (base + options + toppings + adiciones + salsas) ──
export const calculateItemUnitPrice = (item) => {
  let basePrice = parsePrice(item.precio || item.price);

  if (item.customizations) {
    // Radio options (e.g. size, cheese type)
    Object.values(item.customizations.options || {}).forEach((opt) => {
      if (opt) basePrice += parsePrice(opt.precio || opt.price);
    });

    // Toppings legacy
    (item.customizations.toppings || []).forEach((top) => {
      if (typeof top === "object") {
        basePrice += parsePrice(top.precio || top.price);
      }
    });

    // Adiciones (object map: { [id]: { nombre, precio, ... } })
    Object.values(item.customizations.adiciones || {}).forEach((a) => {
      basePrice += parsePrice(a.precio);
    });

    // Salsas (object map: { [id]: { nombre, precio, ... } })
    Object.values(item.customizations.salsas || {}).forEach((s) => {
      basePrice += parsePrice(s.precio);
    });
  }

  return basePrice;
};

// ── Helpers de días ───────────────────────────────────────────────────────
const DIA_NUM_A_NOMBRE = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"];

/** Devuelve true si los beneficios del badge aplican hoy */
export const badgeBenefitsApplyToday = (badge) => {
  if (!badge) return false;
  const days = badge.apply_days;
  // Si no hay días configurados → aplica todos los días
  if (!Array.isArray(days) || days.length === 0) return true;
  const hoy = DIA_NUM_A_NOMBRE[new Date().getDay()];
  return days.includes(hoy);
};

// ── Full order summary from a cart array ──────────────────────────────────
// freeThreshold permite inyectar el umbral configurado en el panel admin
// (settings.freeDeliveryThreshold). Por defecto usa la constante local.
// dynamicFee: si se pasa, usa este valor en vez de valDelivery (domicilio dinámico)
// badge: insignia del cliente que puede otorgar descuento_percentage o free_delivery
export const calculateOrderSummary = (cart, valDelivery, freeThreshold, esDomi, dynamicFee = null, badge = null) => {
  // ── Verificar si los beneficios aplican hoy ──────────────────────────
  const beneficiosAplican = badgeBenefitsApplyToday(badge);
  const activeBadge = beneficiosAplican ? badge : null;

  // ── 2x1: por cada item de cantidad N, la mitad es gratis (precio / 2) ──
  const subtotal = cart.reduce((total, item) => {
    const unitPrice = calculateItemUnitPrice(item);
    let qty = item.quantity;
    let lineTotal = unitPrice * qty;

    if (activeBadge?.has_2x1 && qty >= 2) {
      // Cuántos pares hay → esos pares pagan solo uno
      const pares = Math.floor(qty / 2);
      const sueltos = qty % 2;
      lineTotal = unitPrice * (pares + sueltos);
    }

    return total + lineTotal;
  }, 0);

  // Descuento 2x1 para mostrar en resumen
  const subtotalSin2x1 = cart.reduce((t, i) => t + calculateItemUnitPrice(i) * i.quantity, 0);
  const descuento2x1 = activeBadge?.has_2x1 ? Math.round(subtotalSin2x1 - subtotal) : 0;

  // Si hay un fee dinámico (Mapbox), se usa ese; sino el fijo del admin
  let effectiveFee = dynamicFee != null ? dynamicFee : valDelivery;

  // Aplicar beneficios de insignia
  let descuentoBadge = 0;
  if (activeBadge) {
    if (activeBadge.free_delivery) {
      effectiveFee = 0;
    }
    if (activeBadge.discount_percentage > 0) {
      descuentoBadge = Math.round(subtotal * (activeBadge.discount_percentage / 100));
    }
  }

  const esGratis = activeBadge?.free_delivery || false;
  const totalNeto = subtotal - descuentoBadge + (esDomi ? effectiveFee : 0);
  const faltanteGratis = 0;

  return {
    subtotal: subtotalSin2x1,      // subtotal real sin beneficios (para mostrar)
    subtotalConBeneficios: subtotal, // subtotal después del 2x1
    esGratis,
    totalNeto,
    faltanteGratis,
    effectiveFee,
    descuentoBadge,
    descuento2x1,
    beneficiosAplican,
  };
};

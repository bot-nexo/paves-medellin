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


// ── Full order summary from a cart array ──────────────────────────────────
// freeThreshold permite inyectar el umbral configurado en el panel admin
// (settings.freeDeliveryThreshold). Por defecto usa la constante local.
// dynamicFee: si se pasa, usa este valor en vez de valDelivery (domicilio dinámico)
export const calculateOrderSummary = (cart, valDelivery, freeThreshold, esDomi, dynamicFee = null) => {
  const subtotal = cart.reduce((total, item) => {
    return total + calculateItemUnitPrice(item) * item.quantity;
  }, 0);

  // Si hay un fee dinámico (Mapbox), se usa ese; sino el fijo del admin
  const effectiveFee = dynamicFee != null ? dynamicFee : valDelivery;

  const esGratis = false;
  const totalNeto = subtotal + (esDomi ? effectiveFee : 0);
  const faltanteGratis = 0;

  return { subtotal, esGratis, totalNeto, faltanteGratis, effectiveFee };
};


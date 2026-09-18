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
import { currentPromo } from "../config/promos";

export const calculateOrderSummary = (cart, valDelivery, freeThreshold, esDomi) => {
  const subtotal = cart.reduce((total, item) => {
    return total + calculateItemUnitPrice(item) * item.quantity;
  }, 0);

  let discount = 0;

  // Lógica de Promoción Dinámica
  if (currentPromo && currentPromo.isActive && currentPromo.rules.type === "bundle") {
    // 1. Contar la cantidad total de productos base en el carrito (excluye adiciones puras si las hubiera, pero aquí todo item en cart es producto)
    const totalPromoQty = cart.reduce((acc, item) => acc + item.quantity, 0);

    // 2. Calcular precio base de todos los items en el carrito (solo precio base, sin customizaciones)
    const basePricesTotal = cart.reduce((acc, item) => {
      const basePrice = parsePrice(item.precio || item.price);
      return acc + (basePrice * item.quantity);
    }, 0);

    // 3. Aplicar regla del bundle (ej. 3x25000 + remanentes a 10000)
    const { bundleQty, bundlePrice, remainderPrice } = currentPromo.rules;
    const bundles = Math.floor(totalPromoQty / bundleQty);
    const remainders = totalPromoQty % bundleQty;

    const promoBaseTotal = (bundles * bundlePrice) + (remainders * remainderPrice);

    // 4. El descuento es la diferencia entre lo que costaban los items base originalmente y lo que cuestan con la promo
    if (basePricesTotal > promoBaseTotal) {
      discount = basePricesTotal - promoBaseTotal;
    }
  }

  const subtotalWithDiscount = Math.max(0, subtotal - discount);
  const esGratis = esDomi ? subtotalWithDiscount >= freeThreshold : subtotalWithDiscount;
  const totalNeto = esGratis ? subtotalWithDiscount : subtotalWithDiscount + valDelivery;
  const faltanteGratis = Math.max(0, freeThreshold - subtotalWithDiscount);

  return { subtotal, discount, esGratis, totalNeto, faltanteGratis, totalItems: cart.reduce((a, b) => a + b.quantity, 0) };
};

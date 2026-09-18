export const currentPromo = {
  isActive: true,
  id: "amor-amistad",
  name: "Amor y Amistad",
  tagline: "¡Celebra el amor con dulzura!",
  badgeText: "💝 Promo 3x$25k",
  description: "Lleva 3 postres por solo $25.000",
  // Logica de descuento
  rules: {
    type: "bundle",
    bundleQty: 3,
    bundlePrice: 25000,
    remainderPrice: 10000,
  },
  // Colores para tematizar dinamicamente
  theme: {
    primary: "#ff6b8a",
    secondary: "#e8475a",
    text: "#ffffff"
  }
};

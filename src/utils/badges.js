export const getCustomerBadge = (pedidosCount) => {
  const count = Number(pedidosCount) || 0;
  if (count <= 2) return { name: "Bronce", color: "#cd7f32", description: "Cliente Nuevo" };
  if (count <= 8) return { name: "Plata", color: "#c0c0c0", description: "Cliente Frecuente" };
  if (count <= 15) return { name: "Oro", color: "#ffd700", description: "Cliente Muy Frecuente" };
  return { name: "Platino", color: "#e5e4e2", description: "Cliente VIP" };
};

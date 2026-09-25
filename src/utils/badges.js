import imgBronce from "../assets/images/insig/InsBronce.jpeg";
import imgPlata from "../assets/images/insig/InsPlata.jpeg";
import imgOro from "../assets/images/insig/InsOro.jpeg";
import imgPlatino from "../assets/images/insig/InsPlatino.jpeg";

export const getCustomerBadge = (pedidosCount) => {
  const count = Number(pedidosCount) || 0;
  if (count <= 2) return { name: "Bronce", color: "#d97746", icon: "Medal", image: imgBronce, gradient: "linear-gradient(135deg, #a0522d, #cd7f32)", glow: "rgba(205, 127, 50, 0.4)", description: "Cliente Nuevo" };
  if (count <= 8) return { name: "Plata", color: "#e0e0e0", icon: "Award", image: imgPlata, gradient: "linear-gradient(135deg, #8a8a8a, #e0e0e0)", glow: "rgba(224, 224, 224, 0.4)", description: "Cliente Frecuente" };
  if (count <= 15) return { name: "Oro", color: "#ffdf00", icon: "Trophy", image: imgOro, gradient: "linear-gradient(135deg, #b8860b, #ffdf00)", glow: "rgba(255, 223, 0, 0.5)", description: "Cliente Muy Frecuente" };
  return { name: "Platino", color: "#e5e4e2", icon: "Crown", image: imgPlatino, gradient: "linear-gradient(135deg, #a9a9a9, #ffffff)", glow: "rgba(255, 255, 255, 0.6)", description: "Cliente VIP" };
};

// ── Imágenes reales del proyecto ────────────────────────────────────────
import logoImg from "../assets/images/logo.png";

import paveFrutosRojos from "../assets/images/Pave de klim con frutos rojos y queso.png";
import paveQueso from "../assets/images/Pavel de klim con queso.png";
import paveGuayaba from "../assets/images/Pavé de klim guayaba y queso.png";
import paveUvasTajin from "../assets/images/Pavé de klim y Uvas verdes con Tajín.png";
import paveFranui from "../assets/images/Pave de leche Klim y franui.png";
import paveClasico from "../assets/images/Pavé de leche  klim.png";
import paveQuipitos from "../assets/images/Pavé de leche klim y quipitos.png";
import paveFresas from "../assets/images/Pave de Leche Klim y Fresas.png";
import tortaChocolate from "../assets/images/Torta húmeda de chocolate.png";
import tortaNucita from "../assets/images/Torta de chocolate y fudge de nucita.png";
import tortaMilo from "../assets/images/Torta de chocolate y fudge de milo.png";
import quesilloPorcion from "../assets/images/Quesillo Venezolano.png";
import quesilloEntero from "../assets/images/Quesillo entero.png";
import tortaGrandeFresa from "../assets/images/Tortas húmeda de chocolate y fresas grande.png";
import tortaGrande from "../assets/images/Torta húmeda de chocolate grande.png";
import tortaTresLeches from "../assets/images/Torta tres leches y franui.png";
import pavePirulin from "../assets/images/Pave de Chocolate y Pirulin.png";

// ── Productos del menú ─────────────────────────────────────────────────
export const products = [
  // --- PAVÉS CON QUESO ---
  {
    id: 1,
    nombre: "Pavé de Klim con Frutos Rojos y Queso",
    category: "Con Queso",
    descripcion: "Es el pave de leche klim con topping de mermelada de frutos rojos y queso.",
    precio: 12000,
    imagen: paveFrutosRojos,
    destacado: true,
  },
  {
    id: 2,
    nombre: "Pavé de Klim con Queso",
    category: "Con Queso",
    descripcion: "Pavé de leche Klim de 8 Oz. Topping de leche Klim, queso y Lecherita.",
    precio: 12000,
    imagen: paveQueso,
  },
  {
    id: 3,
    nombre: "Pavé de Klim Guayaba y Queso",
    category: "Con Queso",
    descripcion: "Crema base de leche Klim con topping de bocadillo de guayaba y queso.",
    precio: 12000,
    imagen: paveGuayaba,
  },

  // --- NUEVOS ---
  {
    id: 4,
    nombre: "Pavé de Klim y Uvas Verdes con Tajín",
    category: "Pavés 8oz",
    descripcion: "Crema base de leche Klim, uvas verdes sin semilla y un toque de Tajín. Una propuesta bastante exótica recomendada para los amantes del Tajín.",
    precio: 12000,
    imagen: paveUvasTajin,
    destacado: true,
  },

  // --- TENDENCIA ---
  {
    id: 5,
    nombre: "Pavé de Leche Klim y Franuí",
    category: "Tendencia",
    descripcion: "Es el clásico Pavé de leche Klim con adición de chocolates Franuí.",
    precio: 17000,
    imagen: paveFranui,
    destacado: true,
  },

  // --- PAVÉS PEQUEÑOS (8 OZ) ---
  {
    id: 6,
    nombre: "Pavé de Leche Klim Clásico",
    category: "Pavés 8oz",
    descripcion: "Postre de origen brasileño, frio y cremoso. Elaborado con una crema con sabor a leche klim, acompañado de galleta salada, lo que aporta un equilibrio en su sabor. Topping Leche klim.",
    precio: 10000,
    imagen: paveClasico,
  },
  {
    id: 7,
    nombre: "Pavé de Leche Klim y Quipitos",
    category: "Pavés 8oz",
    descripcion: "Postre de origen brasileño, frio y cremoso. Elaborado con una crema con sabor a leche klim, acompañado de galleta salada, lo que aporta un equilibrio en su sabor. Topping Leche klim y quipitos.",
    precio: 11000,
    imagen: paveQuipitos,
  },
  {
    id: 8,
    nombre: "Pavé de Leche Klim y Fresas",
    category: "Pavés 8oz",
    descripcion: "Postre de origen brasileño, frio y cremoso. Elaborado con una crema con sabor a leche klim, acompañado de galleta salada, lo que aporta un equilibrio en su sabor. Topping Fresas naturales y leche condensada.",
    precio: 10000,
    imagen: paveFresas,
  },

  // --- TORTAS CUCHAREABLES ---
  {
    id: 9,
    nombre: "Torta Húmeda de Chocolate",
    category: "Cuchareables",
    descripcion: "Torta húmeda de chocolate, bañado en almíbar de cacao con capas de fudge de chocolate.",
    precio: 10000,
    imagen: tortaChocolate,
  },
  {
    id: 10,
    nombre: "Torta de Chocolate y Fudge de Nucita",
    category: "Cuchareables",
    descripcion: "Torta húmeda de chocolate, bañado en almíbar de cacao con capas de fudge sabor a nucita.",
    precio: 10000,
    imagen: tortaNucita,
  },
  {
    id: 11,
    nombre: "Torta de Chocolate y Fudge de Milo",
    category: "Cuchareables",
    descripcion: "Torta húmeda de chocolate, bañado en almíbar de cacao con capas de fudge sabor a milo.",
    precio: 10000,
    imagen: tortaMilo,
  },

  // --- QUESILLOS ---
  {
    id: 12,
    nombre: "Quesillo Venezolano (Porción)",
    category: "Quesillos",
    descripcion: "Porción individual de flan/quesillo tradicional bien cremoso.",
    precio: 10000,
    imagen: quesilloPorcion,
  },
  {
    id: 13,
    nombre: "Quesillo Entero (8 Porciones)",
    category: "Quesillos",
    descripcion: "Quesillo familiar rinde 8 porciones.",
    precio: 70000,
    imagen: quesilloEntero,
    nota: "LA PUEDES PEDIR CON 24 HORAS DE ANTICIPACIÓN.",
  },

  // --- TORTAS GRANDES / CUMPLEAÑOS ---
  {
    id: 14,
    nombre: "Torta Húmeda de Chocolate Grande con Fresas",
    category: "Cumpleaños",
    descripcion: "Capas de Torta humeda de chocolate con fudge de chocolate, topping: fresas naturales y oreo. LA PUEDES PEDIR CON CUATRO HORAS DE ANTICIPACIÓN.",
    precio: 65000,
    imagen: tortaGrandeFresa,
    nota: "LA PUEDES PEDIR CON 4 HORAS DE ANTICIPACIÓN.",
  },
  {
    id: 15,
    nombre: "Torta Húmeda de Chocolate Grande",
    category: "Cumpleaños",
    descripcion: "Capas de tortas húmedas de chocolate y fudge de chocolate. Topping: Galletas oreo troceadas.",
    precio: 65000,
    imagen: tortaGrande,
    nota: "LA PUEDES PEDIR CON 4 HORAS DE ANTICIPACIÓN.",
  },
  {
    id: 16,
    nombre: "Torta Tres Leches y Franuí",
    category: "Cumpleaños",
    descripcion: "Bizcocho bañado en 4 leches, relleno de fresas naturales. Cubierta de chocolate semi amargo y topping de Franui.",
    precio: 90000,
    imagen: tortaTresLeches,
    nota: "LA PUEDES PEDIR CON 24 HORAS DE ANTICIPACIÓN.",
  },

  // --- PAVÉ DE CHOCOLATE ---
  {
    id: 17,
    nombre: "Pavé de Chocolate y Pirulín",
    category: "Tendencia",
    descripcion: "Crema de chocolate Topping: Fudge de chocolate y Pirulin Troceado.",
    precio: 15000,
    imagen: pavePirulin,
  },
];

// Alias para compatibilidad
export const menuData = products;

// Mapa nombre → imagen local (asset empaquetado). Lo usa el dataSource para
// resolver productos que vienen de Supabase sin imagen_url definitiva aún.
export const localImagesByNombre = Object.fromEntries(
  products.map((p) => [p.nombre, p.imagen]),
);

// Categorías (fuente única de verdad, usada por Menu.jsx)
export const categories = [
  { id: "Todo", label: "✨ Todo" },
  { id: "Pavés 8oz", label: "🍨 Pavés Pqñ. 8oz" },
  { id: "Con Queso", label: "🧀 Con Queso" },
  { id: "Tendencia", label: "🔥 Tendencia" },
  { id: "Cuchareables", label: "🍫 Cuchareables" },
  { id: "Quesillos", label: "🍮 Quesillos" },
  { id: "Cumpleaños", label: "🎂 Cumpleaños" },
];

export const categoryIcons = {
  "Todo": "fa-list",
  "Pavés 8oz": "fa-ice-cream",
  "Con Queso": "fa-cheese",
  "Tendencia": "fa-fire",
  "Cuchareables": "fa-cookie",
  "Quesillos": "fa-custard",
  "Cumpleaños": "fa-cake-candles",
};

export const heroImages = [logoImg];

export const info = {
  name: "Pavés Medellín",
  address: "Cl. 101c #74-40, Pedregal, Medellín, Antioquia",
  mapsGoogle: "https://maps.app.goo.gl/jKWVmMneA4KPTjgo6",
  instagram: "https://www.instagram.com/pavemedellin_roselbiscolina?igsi=MXU3MGl0NnV1azJ5Yw==",
  facebook: "https://www.facebook.com/pavesmedellin/",
  tiktok: "https://www.tiktok.com/@pavesmedellin",
  phone: "573157978326",
  closed: "",
  day1: "Todos los días",
  hours1: "12:00 M - 08:00 PM",
};

export const VALOR_DOMICILIO_DEFAULT = 5000;
export const MINIMO_ENVIO_GRATIS_DEFAULT = 45000;

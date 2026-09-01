// ── Imágenes reales del proyecto ────────────────────────────────────────
import logoImg from "../assets/images/logo.jpg";

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
    descripcion: "Es el pavé de leche Klim con topping de mermelada de frutos rojos y queso rallado.",
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
    descripcion: "Crema base de leche Klim, uvas verdes sin semilla y un toque de Tajín.",
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
    descripcion: "Postre frío y cremoso de origen brasileño con base de Leche Klim.",
    precio: 10000,
    imagen: paveClasico,
  },
  {
    id: 7,
    nombre: "Pavé de Leche Klim y Quipitos",
    category: "Pavés 8oz",
    descripcion: "Postre cremoso de Leche Klim acompañado con Quipitos.",
    precio: 11000,
    imagen: paveQuipitos,
  },
  {
    id: 8,
    nombre: "Pavé de Leche Klim y Fresas",
    category: "Pavés 8oz",
    descripcion: "Postre cremoso de Leche Klim cubierto con trozos de fresa fresca.",
    precio: 10000,
    imagen: paveFresas,
  },

  // --- TORTAS CUCHAREABLES ---
  {
    id: 9,
    nombre: "Torta Húmeda de Chocolate",
    category: "Cuchareables",
    descripcion: "Torta húmeda bañada en almíbar de cacao con fudge de chocolate.",
    precio: 10000,
    imagen: tortaChocolate,
  },
  {
    id: 10,
    nombre: "Torta de Chocolate y Fudge de Nucita",
    category: "Cuchareables",
    descripcion: "Torta húmeda de chocolate con baño de cacao y fudge de Nucita.",
    precio: 10000,
    imagen: tortaNucita,
  },
  {
    id: 11,
    nombre: "Torta de Chocolate y Fudge de Milo",
    category: "Cuchareables",
    descripcion: "Torta húmeda de chocolate con fudge cremoso de Milo.",
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
    descripcion: "Quesillo familiar rinde 8 porciones. Pedirlo con 24 horas de anticipación.",
    precio: 70000,
    imagen: quesilloEntero,
  },

  // --- TORTAS GRANDES / CUMPLEAÑOS ---
  {
    id: 14,
    nombre: "Torta Húmeda de Chocolate Grande con Fresas",
    category: "Cumpleaños",
    descripcion: "Capas de torta húmeda de chocolate con fudge y fresas naturales.",
    precio: 65000,
    imagen: tortaGrandeFresa,
  },
  {
    id: 15,
    nombre: "Torta Húmeda de Chocolate Grande",
    category: "Cumpleaños",
    descripcion: "Capas de torta húmeda con abundante fudge de chocolate especial.",
    precio: 65000,
    imagen: tortaGrande,
  },
  {
    id: 16,
    nombre: "Torta Tres Leches y Franuí",
    category: "Cumpleaños",
    descripcion: "Bizcocho bañado en 4 leches, relleno de fresas y cubierto con Franuí.",
    precio: 90000,
    imagen: tortaTresLeches,
  },

  // --- PAVÉ DE CHOCOLATE ---
  {
    id: 17,
    nombre: "Pavé de Chocolate y Pirulín",
    category: "Tendencia",
    descripcion: "Crema de chocolate topped con fudge de chocolate y Pirulín troceado.",
    precio: 15000,
    imagen: pavePirulin,
  },
];

// Alias para compatibilidad
export const menuData = products;

// Categorías (fuente única de verdad, usada por Menu.jsx)
export const categories = [
  { id: "Todo", label: "✨ Todo" },
  { id: "Pavés 8oz", label: "🍨 Pavés 8oz" },
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
  phone: "573007256149",
  closed: "",
  day1: "Todos los días",
  hours1: "12:00 PM - 08:00 PM",
};

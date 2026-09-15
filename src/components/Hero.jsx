

// import React, { useState } from "react";
// import { ShoppingBag, Sparkles, Plus, Star, RefreshCw, Check } from "lucide-react";
// import logoImg from "../assets/images/logo.png";
// import "../css/Hero.css";

// const Hero = ({
//   products = [],
//   cartCount = 0,
//   onOpenCart,
//   onAddToCart,
//   selectedCategory = "Todos",
//   onSelectCategory
// }) => {
//   const [spotlightIdx, setSpotlightIdx] = useState(0);

//   // Categorías principales estructuradas
//   const categories = [
//     "Todos",
//     "Pavés 8oz",
//     "Con Queso",
//     "Tendencia",
//     "Postres Especiales"
//   ];

//   // Productos de antojo para la ruleta
//   const fallbackItems = [
//     {
//       id: "p1",
//       nombre: "Pavé Maracuyá Real",
//       categoria: "Pavés 8oz",
//       precio: 14900,
//       descripcion: "Crema suave de maracuyá concentrada sobre galleta crujiente artesanal.",
//       imagen: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
//       tag: "Más Vendido"
//     },
//     {
//       id: "p2",
//       nombre: "Pavé Nutella & Avellanas",
//       categoria: "Tendencia",
//       precio: 16500,
//       descripcion: "Cacao intenso, crema suave Gianduja y trozos de avellanas tostadas.",
//       imagen: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
//       tag: "Popular"
//     },
//     {
//       id: "p3",
//       nombre: "Pavé Frutos Rojos Gold",
//       categoria: "Postres Especiales",
//       precio: 15900,
//       descripcion: "Reducción de mora y frambuesa con crema suave helada de vainilla.",
//       imagen: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
//       tag: "Especial"
//     }
//   ];

//   const itemList = products.length > 0 ? products : fallbackItems;
//   const currentSpotlight = itemList[spotlightIdx % itemList.length] || itemList[0];

//   const formatCOP = (val) => {
//     if (!val) return "$0";
//     return new Intl.NumberFormat("es-CO", {
//       style: "currency",
//       currency: "COP",
//       maximumFractionDigits: 0
//     }).format(val);
//   };

//   const handleRandomWheel = () => {
//     const nextIdx = Math.floor(Math.random() * itemList.length);
//     setSpotlightIdx(nextIdx);
//   };

//   return (
//     <section className="hero-pwa">
//       {/* Header Superior Limpio */}
//       <header className="hero-pwa__header container">
//         <a href="#" className="hero-pwa__brand">
//           <img src={logoImg} alt="Pavés Medellín" className="hero-pwa__logo" />
//           <div className="hero-pwa__brand-info">
//             <span className="hero-pwa__brand-name">
//               Pavés <span className="hero-pwa__brand-city">Medellín</span>
//             </span>
//             <span className="hero-pwa__brand-status">
//               <span className="hero-pwa__dot" /> Domicilios activos
//             </span>
//           </div>
//         </a>

//         <button
//           className={`hero-pwa__cart-btn ${cartCount > 0 ? "has-items" : ""}`}
//           onClick={onOpenCart}
//           aria-label="Ver mi pedido"
//         >
//           <ShoppingBag size={18} />
//           <span className="hero-pwa__cart-text">Mi Pedido</span>
//           {cartCount > 0 && <span className="hero-pwa__cart-count">{cartCount}</span>}
//         </button>
//       </header>

//       {/* Titular con Contraste Garantizado */}
//       <div className="hero-pwa__headline container">
//         <h1 className="hero-pwa__title">
//           Pavés Cremosos <span className="hero-pwa__title-accent">llenos de sabor</span>
//         </h1>
//         <p className="hero-pwa__subtitle">
//           Postres artesanales congelados. Pide en segundos con entrega directa.
//         </p>
//       </div>

//       {/* Ruleta de Antojo & Tarjeta Unificada */}
//       <div className="hero-pwa__spotlight container">
//         <div className="hero-pwa__spotlight-bar">
//           <span className="hero-pwa__spotlight-label">
//             <Sparkles size={14} className="icon-gold" /> Destacado del día
//           </span>
//           <button className="hero-pwa__wheel-btn" onClick={handleRandomWheel}>
//             <RefreshCw size={13} /> Ruleta de Antojo
//           </button>
//         </div>

//         <div className="hero-pwa__card-unlocked">
//           <div className="hero-pwa__card-media">
//             <img
//               src={currentSpotlight.imagen || currentSpotlight.image}
//               alt={currentSpotlight.nombre || currentSpotlight.name}
//               className="hero-pwa__card-img"
//             />
//             {(currentSpotlight.tag || currentSpotlight.popular) && (
//               <span className="hero-pwa__tag">
//                 <Star size={12} fill="#fbbf24" /> {currentSpotlight.tag || "Popular"}
//               </span>
//             )}
//           </div>

//           <div className="hero-pwa__card-content">
//             <h2 className="hero-pwa__product-title">
//               {currentSpotlight.nombre || currentSpotlight.name}
//             </h2>
//             <p className="hero-pwa__product-desc">
//               {currentSpotlight.descripcion || currentSpotlight.description}
//             </p>

//             <div className="hero-pwa__action-row">
//               <span className="hero-pwa__product-price">
//                 {formatCOP(currentSpotlight.precio || currentSpotlight.price)}
//               </span>
//               <button
//                 className="hero-pwa__add-btn"
//                 onClick={() => onAddToCart && onAddToCart(currentSpotlight)}
//               >
//                 <Plus size={18} />
//                 <span>Agregar</span>
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Carrusel/Selector de Antojos */}
//         <div className="hero-pwa__selector-strip">
//           {itemList.slice(0, 5).map((item, idx) => {
//             const isActive = idx === spotlightIdx;
//             return (
//               <button
//                 key={item.id || idx}
//                 className={`hero-pwa__strip-item ${isActive ? "is-active" : ""}`}
//                 onClick={() => setSpotlightIdx(idx)}
//               >
//                 <img src={item.imagen || item.image} alt={item.nombre || item.name} />
//                 <span>{item.nombre || item.name}</span>
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* Navegación de Categorías */}
//       <nav className="hero-pwa__categories container">
//         <div className="hero-pwa__categories-track">
//           {categories.map((cat) => {
//             const active = (selectedCategory || "Todos") === cat;
//             return (
//               <button
//                 key={cat}
//                 className={`hero-pwa__cat-pill ${active ? "is-active" : ""}`}
//                 onClick={() => onSelectCategory && onSelectCategory(cat)}
//               >
//                 {active && <Check size={14} />}
//                 <span>{cat}</span>
//               </button>
//             );
//           })}
//         </div>
//       </nav>
//     </section>
//   );
// };

// export default Hero;

import React from "react";
import { ShoppingBag, Sparkles, Plus, Star, Check } from "lucide-react";
import logoImg from "../assets/images/logo.png";
import "../css/Hero.css";

const Hero = ({
  featuredProduct,
  products = [],
  cartCount = 0,
  onOpenCart,
  onAddToCart,
  selectedCategory = "Todos",
  onSelectCategory
}) => {
  // Categorías principales unificadas
  const categories = [
    "Todos",
    "Pavés 8oz",
    "Con Queso",
    "Tendencia",
    "Postres Especiales"
  ];

  // Producto destacado por defecto en caso de no recibir uno específico
  const fallbackFeatured = {
    id: "featured-1",
    nombre: "Pavé Maracuyá Real",
    precio: 14900,
    descripcion: "Cremosa combinación artesanal de maracuyá concentrado con galleta crujiente.",
    imagen: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
    tag: "Más Vendido"
  };

  const currentFeatured = featuredProduct || products[0] || fallbackFeatured;

  const formatCOP = (val) => {
    if (!val) return "$0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <section className="hero-clean-pwa">
      {/* Header Superior */}
      <header className="hero-clean-pwa__header container">
        <a href="#" className="hero-clean-pwa__brand">
          <img src={logoImg} alt="Pavés Medellín" className="hero-clean-pwa__logo" />
          <div className="hero-clean-pwa__brand-info">
            <span className="hero-clean-pwa__brand-name">
              Pavés <span className="hero-clean-pwa__brand-city">Medellín</span>
            </span>
            <span className="hero-clean-pwa__brand-status">
              <span className="hero-clean-pwa__dot" /> Domicilios activos
            </span>
          </div>
        </a>

        <button
          className="hero-clean-pwa__cart-btn"
          onClick={onOpenCart}
          aria-label="Ver mi pedido"
        >
          <ShoppingBag size={18} />
          <span>Mi Pedido</span>
          {cartCount > 0 && <span className="hero-clean-pwa__cart-badge">{cartCount}</span>}
        </button>
      </header>

      {/* Titular Principal de Alto Contraste */}
      <div className="hero-clean-pwa__intro container">
        <h1 className="hero-clean-pwa__title">
          Pavés Cremosos <span className="hero-clean-pwa__title-accent">llenos de sabor</span>
        </h1>
        <p className="hero-clean-pwa__subtitle">
          Postres artesanales congelados. Pide en segundos con entrega directa.
        </p>
      </div>

      {/* Tarjeta Fija: Destacado del Día (Sin carrusel) */}
      <div className="hero-clean-pwa__featured container">
        <div className="hero-clean-pwa__featured-header">
          <Sparkles size={14} className="icon-gold" />
          <span>Destacado del Día</span>
        </div>

        <div className="hero-clean-pwa__card">
          <div className="hero-clean-pwa__card-media">
            <img
              src={currentFeatured.imagen || currentFeatured.image}
              alt={currentFeatured.nombre || currentFeatured.name}
              className="hero-clean-pwa__card-img"
            />
            {(currentFeatured.tag || currentFeatured.popular) && (
              <span className="hero-clean-pwa__badge">
                <Star size={12} fill="#fbbf24" /> {currentFeatured.tag || "Popular"}
              </span>
            )}
          </div>

          <div className="hero-clean-pwa__card-content">
            <h2 className="hero-clean-pwa__product-title">
              {currentFeatured.nombre || currentFeatured.name}
            </h2>
            <p className="hero-clean-pwa__product-desc">
              {currentFeatured.descripcion || currentFeatured.description}
            </p>

            <div className="hero-clean-pwa__card-action">
              <span className="hero-clean-pwa__product-price">
                {formatCOP(currentFeatured.precio || currentFeatured.price)}
              </span>
              <button
                className="hero-clean-pwa__add-btn"
                onClick={() => onAddToCart && onAddToCart(currentFeatured)}
              >
                <Plus size={18} />
                <span>Agregar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fila Única de Categorías */}
      <nav className="hero-clean-pwa__categories container">
        <div className="hero-clean-pwa__categories-track">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                className={`hero-clean-pwa__cat-pill ${isActive ? "is-active" : ""}`}
                onClick={() => onSelectCategory && onSelectCategory(cat)}
              >
                {isActive && <Check size={14} />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </section>
  );
};

export default Hero;
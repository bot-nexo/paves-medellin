// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { ShoppingBag, Star, Plus, Sparkles } from "lucide-react";
// import logoImg from "../assets/images/logo.png";
// import useCatalog from "../hooks/useCatalog";
// import "../css/Hero.css";

// const Hero = ({
//   cartCount = 0,
//   onOpenCart,
// }) => {
//   const { products = [] } = useCatalog();
//   const [current, setCurrent] = useState(0);
//   const [isPaused, setIsPaused] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const intervalRef = useRef(null);
//   const progressRef = useRef(null);

//   const AUTOPLAY_DURATION = 7000;
//   const featured = products.length > 0 ? products : [];

//   const formatCOP = (val) => {
//     if (!val) return "$0";
//     return new Intl.NumberFormat("es-CO", {
//       style: "currency",
//       currency: "COP",
//       maximumFractionDigits: 0
//     }).format(val);
//   };

//   const next = useCallback(() => {
//     if (featured.length === 0) return;
//     setCurrent((prev) => (prev + 1) % featured.length);
//     setProgress(0);
//   }, [featured.length]);

//   useEffect(() => {
//     if (isPaused || featured.length === 0) {
//       clearTimeout(intervalRef.current);
//       clearInterval(progressRef.current);
//       return;
//     }

//     const start = Date.now();
//     progressRef.current = setInterval(() => {
//       const elapsed = Date.now() - start;
//       setProgress(Math.min((elapsed / AUTOPLAY_DURATION) * 100, 100));
//     }, 30);

//     intervalRef.current = setTimeout(() => {
//       next();
//     }, AUTOPLAY_DURATION);

//     return () => {
//       clearTimeout(intervalRef.current);
//       clearInterval(progressRef.current);
//     };
//   }, [current, isPaused, next, featured.length]);

//   // ─────────────────────────────────────────────
//   // Animaciones avanzadas (Opción 1)
//   // ─────────────────────────────────────────────
//   const slideVariants = {
//     initial: {
//       opacity: 0,
//       scale: 1.07
//     },
//     animate: {
//       opacity: 1,
//       scale: 1,
//       transition: {
//         duration: 1.05,
//         ease: [0.22, 1, 0.36, 1]
//       }
//     },
//     exit: {
//       opacity: 0,
//       scale: 0.97,
//       transition: {
//         duration: 0.65,
//         ease: [0.4, 0, 0.2, 1]
//       }
//     }
//   };

//   const contentVariants = {
//     initial: { opacity: 0 },
//     animate: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//         delayChildren: 0.28
//       }
//     }
//   };

//   const itemVariants = {
//     initial: { opacity: 0, y: 20 },
//     animate: {
//       opacity: 1,
//       y: 0,
//       transition: {
//         duration: 0.55,
//         ease: [0.22, 1, 0.36, 1]
//       }
//     }
//   };

//   if (featured.length === 0) {
//     return (
//       <section className="hero-full">
//         <header className="hero-full__header">
//           <div className="hero-full__brand">
//             <img src={logoImg} alt="Pavés Medellín" className="hero-full__logo" />
//             <div>
//               <h1 className="hero-full__name">
//                 Pavés <span>Medellín</span>
//               </h1>
//             </div>
//           </div>
//         </header>
//         <div className="hero-full__stage hero-full__stage--loading">
//           <div className="hero-full__loading">Cargando productos...</div>
//         </div>
//       </section>
//     );
//   }

//   const activeProduct = featured[current];
//   const activeCount = products.length;

//   return (
//     <section className="hero-full">
//       {/* Header */}
//       <header className="hero-full__header">
//         <div className="hero-full__brand">
//           <img src={logoImg} alt="Pavés Medellín" className="hero-full__logo" />
//           <div>
//             <h1 className="hero-full__name">
//               Pavés <span>Medellín</span>
//             </h1>
//             <div className="hero-full__meta">
//               <span className="hero-full__rating">
//                 <Star size={11} fill="currentColor" /> 4.9
//               </span>
//               <span className="hero-full__dot">·</span>
//               <span>{activeCount} productos activos</span>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Stage */}
//       <div
//         className="hero-full__stage"
//         onMouseEnter={() => setIsPaused(true)}
//         onMouseLeave={() => setIsPaused(false)}
//         onTouchStart={() => setIsPaused(true)}
//         onTouchEnd={() => setIsPaused(false)}
//       >
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={activeProduct.id}
//             className="hero-full__slide"
//             variants={slideVariants}
//             initial="initial"
//             animate="animate"
//             exit="exit"
//           >
//             <div className="hero-full__media">
//               <img
//                 src={activeProduct.imagen || activeProduct.image}
//                 alt={activeProduct.nombre || activeProduct.name}
//                 className="hero-full__img"
//               />
//               {/* Overlay mejorado para legibilidad */}
//               <div className="hero-full__overlay" />
//             </div>

//             {/* Contenido con stagger */}
//             <motion.div
//               className="hero-full__content"
//               variants={contentVariants}
//               initial="initial"
//               animate="animate"
//             >
//               <motion.div className="hero-full__badge" variants={itemVariants}>
//                 <Sparkles size={12} />
//                 {activeProduct.tag || "Destacado"}
//               </motion.div>

//               <motion.h2 className="hero-full__title" variants={itemVariants}>
//                 {activeProduct.nombre || activeProduct.name}
//               </motion.h2>

//               <motion.p className="hero-full__desc" variants={itemVariants}>
//                 {activeProduct.descripcion || activeProduct.description}
//               </motion.p>

//               <motion.div className="hero-full__actions" variants={itemVariants}>
//                 <div className="hero-full__price-block">
//                   <span className="hero-full__price">
//                     {formatCOP(activeProduct.precio || activeProduct.price)}
//                   </span>
//                   <div className="hero-full__rating-inline">
//                     <Star size={15} fill="#c9a227" color="#c9a227" />
//                     <span>{activeProduct.rating || 4.8}</span>
//                   </div>
//                 </div>
//               </motion.div>
//             </motion.div>
//           </motion.div>
//         </AnimatePresence>

//         {/* Progress */}
//         <div className="hero-full__progress">
//           <div
//             className="hero-full__progress-bar"
//             style={{ width: `${progress}%` }}
//           />
//         </div>
//       </div>

//       {/* Floating Cart */}
//       <button
//         className="hero-full__float-cart"
//         onClick={onOpenCart}
//         aria-label="Ver mi pedido"
//       >
//         <ShoppingBag size={20} />
//         <span>Mi Pedido</span>
//         {cartCount > 0 && (
//           <span className="hero-full__float-badge">{cartCount}</span>
//         )}
//       </button>
//     </section>
//   );
// };

// export default Hero;

import React, { useState, useEffect } from 'react';
import { Star, ShoppingBag, ChevronRight, Award } from 'lucide-react';
import './Hero.css';

// Datos por defecto si no vienen mediante props
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Arepa de Choclo con Queso',
    description: 'Tradicional arepa con abundante queso campesino fresco derretido.',
    price: '$8.500',
    tag: 'MÁS VENDIDO',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 2,
    name: 'Combo Tradicional',
    description: 'Arepa de choclo con queso + bebida artesanal fría a elección.',
    price: '$12.000',
    tag: 'RECOMENDADO',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 3,
    name: 'Arepa Especial con Tocineta',
    description: 'Sabor irresistible con el toque crocante de tocineta ahumada.',
    price: '$10.500',
    tag: 'NUEVO',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000'
  }
];

export const Hero = ({ 
  brandName = "Lemon Fire",
  brandSubtitle = "Sabor Artesanal",
  rating = "4.9",
  reviewsCount = "(120+)",
  products = DEFAULT_PRODUCTS,
  logoUrl = "/logo.png",
  cartCount = 0,
  onOpenCart = () => {},
  onSelectProduct = () => {}
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const displayProducts = products && products.length > 0 ? products : DEFAULT_PRODUCTS;

  // Rotación automática del carrusel con barra de progreso
  useEffect(() => {
    const duration = 5000; // 5 segundos por slide
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % displayProducts.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [displayProducts.length, currentIndex]);

  const currentItem = displayProducts[currentIndex] || displayProducts[0];

  return (
    <div className="hero-full">
      {/* ── HEADER SUPERIOR FLOTANTE (ESTILO GLASS) ── */}
      <header className="hero-full__header">
        <div className="hero-full__brand">
          <img 
            src={logoUrl} 
            alt={brandName} 
            className="hero-full__logo" 
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <h1 className="hero-full__name">
              {brandName} <span>{brandSubtitle}</span>
            </h1>
            <div className="hero-full__meta">
              <span className="hero-full__rating">
                <Star size={12} fill="currentColor" /> {rating}
              </span>
              <span className="hero-full__dot">•</span>
              <span>{reviewsCount} reseñas</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── ESCENARIO / CARRUSEL PRINCIPAL ── */}
      <main className="hero-full__stage">
        {displayProducts.map((item, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div 
              key={item.id || idx} 
              className={`hero-full__slide ${isActive ? 'hero-full__slide--active' : ''}`}
            >
              <div className="hero-full__media">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="hero-full__img"
                />
                <div className="hero-full__overlay" />
              </div>

              {/* Información y detalles del producto */}
              <div className="hero-full__content">
                {item.tag && (
                  <span className="hero-full__badge">
                    <Award size={12} /> {item.tag}
                  </span>
                )}
                <h2 className="hero-full__title">{item.name}</h2>
                <p className="hero-full__desc">{item.description}</p>

                <div className="hero-full__actions">
                  <div className="hero-full__price-block">
                    <span className="hero-full__price">{item.price}</span>
                  </div>
                  <button 
                    className="hero-full__btn-order"
                    onClick={() => onSelectProduct(item)}
                  >
                    Pedir ahora <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Línea de tiempo / Progreso del carrusel */}
        <div className="hero-full__progress">
          <div 
            className="hero-full__progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </main>

      {/* ── BOTÓN FLOTANTE DEL CARRITO ── */}
      <button className="hero-full__float-cart" onClick={onOpenCart}>
        <ShoppingBag size={20} />
        <span>Ver Pedido</span>
        {cartCount > 0 && (
          <span className="hero-full__float-badge">{cartCount}</span>
        )}
      </button>
    </div>
  );
};

export default Hero;
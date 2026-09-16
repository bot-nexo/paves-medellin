import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, ChevronDown } from "lucide-react";
import logoImg from "../assets/images/logo.png";
import useCatalog from "../hooks/useCatalog";
import { FaShoppingCart } from "react-icons/fa";
import { StoreIcon } from "lucide-react";
import "../css/Hero.css";

const Hero = ({
  cartCount = 0,
  onOpenCart,
  estadoNegocio,
}) => {
  const { products = [] } = useCatalog();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);

  const AUTOPLAY_DURATION = 7000;
  const featured = products.length > 0 ? products : [];

  const formatCOP = (val) => {
    if (!val) return "$0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(val);
  };

  const next = useCallback(() => {
    if (featured.length === 0) return;
    setCurrent((prev) => (prev + 1) % featured.length);
    setProgress(0);
  }, [featured.length]);


  useEffect(() => {
    console.log('estadoNegocio', estadoNegocio);
    if (isPaused || featured.length === 0) {
      clearTimeout(intervalRef.current);
      clearInterval(progressRef.current);
      return;
    }

    const start = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / AUTOPLAY_DURATION) * 100, 100));
    }, 30);

    intervalRef.current = setTimeout(() => {
      next();
    }, AUTOPLAY_DURATION);

    return () => {
      clearTimeout(intervalRef.current);
      clearInterval(progressRef.current);
    };
  }, [current, isPaused, next, featured.length]);

  const renderEstadoNegocio = () => {
  // 1. Estado Abierto
  if (estadoNegocio.abierto) {
    return (
      <span className="hero-full__badge hero-full__badge--open">
        <StoreIcon size={16} />
        <span className="badge__status-dot" />
        Abierto ahora
      </span>
    );
  }

  // 2. Cierre Manual / Eventualidad (fuerzaCierre)
  if (estadoNegocio.fuerzaCierre) {
    return (
      <span className="hero-full__badge hero-full__badge--closed-forced">
        <StoreIcon size={16} />
        Cerrado temporalmente por eventualidad
      </span>
    );
  }

  // 3. Cerrado por Horario Habitual
  return (
    <span className="hero-full__badge hero-full__badge--closed">
      <StoreIcon size={16} />
      <div className="badge__text-group">
        <span className="badge__title">Cerrado</span>
        {estadoNegocio.dateOpen && estadoNegocio.hourOpen && (
          <span className="badge__subtitle">
            • Abre el {estadoNegocio.dateOpen} a las {estadoNegocio.hourOpen}
          </span>
        )}
      </div>
    </span>
  );
};

// En tu JSX principal:
{renderEstadoNegocio()}

  // ─────────────────────────────────────────────
  // Animaciones avanzadas (Opción 1)
  // ─────────────────────────────────────────────
  const slideVariants = {
    initial: {
      opacity: 0,
      scale: 1.07
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.05,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      transition: {
        duration: 0.65,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const contentVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.28
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  if (featured.length === 0) {
    return (
      <section className="hero-full">
        <header className="hero-full__header">
          <div className="hero-full__brand">
            <img src={logoImg} alt="Pavés Medellín" className="hero-full__logo" />
            <div>
              <h1 className="hero-full__name">
                Pavés <span>Medellín</span>
              </h1>
            </div>
          </div>
        </header>
        <div className="hero-full__stage hero-full__stage--loading">
          <div className="hero-full__loading">Cargando productos...</div>
        </div>
      </section>
    );
  }

  const activeProduct = featured[current];
  const activeCount = products.length;

  //************************************ */
  return (
    <section className="hero-full">
      {/* Header */}
      <header className="hero-full__header">
        <div className="hero-full__brand">
          <img src={logoImg} alt="Pavés Medellín" onError={(e) => {
            e.target.style.display = 'none';
          }} className="hero-full__logo" />
          <div>
            <h1 className="hero-full__name">
              Pavés <span>Medellín</span>
            </h1>
            <div className="hero-full__meta">
              <span className="hero-full__rating">
                <Star size={11} fill="currentColor" /> 4.9
              </span>
              <span className="hero-full__dot">·</span>
              <span>{activeCount} productos</span>
            </div>
          </div>
        </div>

       {renderEstadoNegocio()}

        <a href="#menu" className="hero-full__cta">
          Ver Menú
          <ChevronDown size={15} />
        </a>
      </header>

      {/* Stage */}

      <div
        className="hero-full__stage"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProduct.id}
            className="hero-full__slide"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="hero-full__media">
              <img
                src={activeProduct.imagen || activeProduct.image}
                alt={activeProduct.nombre || activeProduct.name}
                className="hero-full__img"
              />
              {/* Overlay mejorado para legibilidad */}
              <div className="hero-full__overlay" />
            </div>

            {/* Contenido con stagger */}
            <motion.div
              className="hero-full__content"
              variants={contentVariants}
              initial="initial"
              animate="animate"
            >
              <motion.div className="hero-full__badge" variants={itemVariants}>
                <Sparkles size={12} />
                {activeProduct.tag || "Destacado"}
              </motion.div>

              <motion.h2 className="hero-full__title" variants={itemVariants}>
                {activeProduct.nombre || activeProduct.name}
              </motion.h2>

              <motion.p className="hero-full__desc" variants={itemVariants}>
                {activeProduct.descripcion || activeProduct.description}
              </motion.p>

              <motion.div className="hero-full__actions" variants={itemVariants}>
                <div className="hero-full__price-block">
                  <span className="hero-full__price">
                    {formatCOP(activeProduct.precio || activeProduct.price)}
                  </span>
                  <div className="hero-full__rating-inline">
                    <Star size={15} fill="#c9a227" color="#c9a227" />
                    <span>{activeProduct.rating || 4.8}</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Progress */}
        <div className="hero-full__progress">
          <div
            className="hero-full__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Floating Cart */}
      <button
        className="hero-full__float-cart"
        onClick={onOpenCart}
        aria-label="Ver mi pedido"
      >
        <FaShoppingCart size={20} />
        <span>Mi Pedido</span>
        {cartCount > 0 && (
          <span className="hero-full__float-badge">{cartCount}</span>
        )}
      </button>
    </section>
  );
};

export default Hero;
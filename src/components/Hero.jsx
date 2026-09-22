import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, ArrowRight, StoreIcon, Flame, Search, SlidersHorizontal, Heart } from "lucide-react";
import logoImg from "../assets/images/logo.png";
import useCatalog from "../hooks/useCatalog";
import { DEFAULT_CATALOG_DESIGN } from "../data/dataSource";
import { products as localProducts } from "../data/menu";
import "../css/Hero.css";

const Hero = ({
  cartCount = 0,
  onOpenCart,
  estadoNegocio,
  design = DEFAULT_CATALOG_DESIGN,
  products: propProducts,
  settings: propSettings,
  onAddToCart,
  searchQuery = "",
  onSearchChange,
}) => {
  const catalog = useCatalog();
  const products = propProducts !== undefined ? propProducts : catalog.products || [];
  const settings = propSettings !== undefined ? propSettings : catalog.settings || {};
  const d = design || DEFAULT_CATALOG_DESIGN;
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);

  const AUTOPLAY_DURATION = 6500;
  const featured = (products && products.length > 0) ? products : localProducts;

  const formatCOP = (val) => {
    if (!val) return "$0";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const next = useCallback(() => {
    if (featured.length === 0) return;
    setCurrent((prev) => (prev + 1) % featured.length);
    setProgress(0);
  }, [featured.length]);

  const goToSlide = (idx) => {
    setCurrent(idx);
    setProgress(0);
  };

  useEffect(() => {
    if (isPaused || featured.length === 0) {
      clearTimeout(intervalRef.current);
      clearInterval(progressRef.current);
      return;
    }

    const start = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / AUTOPLAY_DURATION) * 100, 100));
    }, 35);

    intervalRef.current = setTimeout(() => {
      next();
    }, AUTOPLAY_DURATION);

    return () => {
      clearTimeout(intervalRef.current);
      clearInterval(progressRef.current);
    };
  }, [current, isPaused, featured.length, next]);

  const slideVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.45, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  const renderEstadoNegocio = () => {
    if (!estadoNegocio) return null;

    if (estadoNegocio.abierto) {
      return (
        <div className="saborio-status-badge saborio-status-badge--open">
          <span className="saborio-status-dot" />
          <span>Abierto ahora</span>
        </div>
      );
    }

    if (estadoNegocio.fuerzaCierre) {
      return (
        <div className="saborio-status-badge saborio-status-badge--closed">
          <span className="saborio-status-dot saborio-status-dot--closed" />
          <span>Cerrado temporal</span>
        </div>
      );
    }

    return (
      <div className="saborio-status-badge saborio-status-badge--closed">
        <span className="saborio-status-dot saborio-status-dot--closed" />
        <span>Cerrado {estadoNegocio.openHour ? `· Abre ${estadoNegocio.openHour}` : ""}</span>
      </div>
    );
  };

  const activeProduct = featured[current] || {};

  const handleCtaClick = () => {
    if (onAddToCart && activeProduct?.id) {
      onAddToCart(activeProduct);
    } else {
      const menuEl = document.getElementById("menu");
      if (menuEl) menuEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchInput = (e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
    const menuEl = document.getElementById("menu");
    if (menuEl && window.scrollY < 200) {
      menuEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="saborio-hero-section">
      <div className="container">
        {/* ── Top Bar: Logo Oficial + Estado + Avatar ───────────────────────── */}
        <header className="saborio-top-bar">
          <div className="saborio-top-bar__left">
            <div className="saborio-logo-wrap">
              <img
                src={settings?.logo_url || logoImg}
                alt="Pavés Medellín"
                className="saborio-logo-img"
              />
              <div className="saborio-brand-info">
                <div className="saborio-brand-title">
                  <span className="saborio-brand-name">Pavés</span>
                  <span className="saborio-brand-city">Medellín</span>
                  <Flame size={16} className="saborio-brand-icon" />
                </div>
                <span className="saborio-brand-tagline">
                  EL VERDADERO SABOR BRASILEÑO
                </span>
              </div>
            </div>
          </div>

          <div className="saborio-top-bar__right">
            {renderEstadoNegocio()}
          </div>
        </header>

        {/* ── Barra de Búsqueda Flotante Estilo Saborio ─────────────────────── */}
        <div className="saborio-search-container">
          <div className="saborio-search-box">
            <Search size={18} className="saborio-search-icon" />
            <input
              type="text"
              className="saborio-search-input"
              placeholder="¿Qué antojo tienes hoy?"
              value={searchQuery}
              onChange={handleSearchInput}
              aria-label="Buscar postres"
            />
            <button
              type="button"
              className="saborio-filter-btn"
              onClick={() => {
                const menuEl = document.getElementById("menu");
                if (menuEl) menuEl.scrollIntoView({ behavior: "smooth" });
              }}
              title="Filtrar por categoría"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* ── Hero Card: Banner Principal de Impacto Estilo Saborio ─────────── */}
        {featured.length > 0 && (
          <div
            className="saborio-card-banner"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProduct.id || current}
                className="saborio-card-banner__inner"
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Lado Izquierdo: Contenido Tipográfico de Gran Impacto */}
                <div className="saborio-card-banner__content">
                  <div className="saborio-card-banner__badge">
                    <span>PROMO EXCLUSIVA</span>
                  </div>

                  <h2 className="saborio-card-banner__headline">
                    <span className="headline-light">SABORES</span>
                    <span className="headline-yellow">SIN LÍMITES</span>
                  </h2>

                  <p className="saborio-card-banner__subtitle">
                    {activeProduct.nombre
                      ? `Disfruta nuestro ${activeProduct.nombre} preparado artesanalmente con Leche Klim.`
                      : "Descubre combinaciones únicas, creadas para los que se atreven a más."}
                  </p>

                  <div className="saborio-card-banner__action">
                    <button
                      type="button"
                      className="saborio-cta-btn"
                      onClick={handleCtaClick}
                    >
                      <span>Ver la promo</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Lado Derecho: Imagen Gastronómica + Badge Flotante */}
                <div className="saborio-card-banner__visual">
                  <img
                    src={activeProduct.imagen || activeProduct.image}
                    alt={activeProduct.nombre || "Postre destacado"}
                    className="saborio-banner-product-img"
                  />
                  <div className="saborio-banner-glow" />

                  {/* Badge Flotante Circular Estilo Saborio */}
                  <div className="saborio-discount-badge">
                    <span className="discount-top">HASTA</span>
                    <span className="discount-main">20%</span>
                    <span className="discount-bottom">OFF</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots de Navegación Estilo Saborio / FoodVibe */}
            {featured.length > 1 && (
              <div className="saborio-dots-nav">
                {featured.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`saborio-dot ${current === idx ? "saborio-dot--active" : ""}`}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Ir a destacado ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Barra de progreso de autoplay continuo */}
            <div className="saborio-progress-track">
              <div
                className="saborio-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
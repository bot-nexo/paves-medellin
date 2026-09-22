import React, { useRef, useState, useEffect, useCallback } from "react";
import { Tag, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_CATALOG_DESIGN } from "../data/dataSource";
import "../css/Promociones.css";

const AUTOPLAY_TIME = 5500;

const Promociones = ({ design = DEFAULT_CATALOG_DESIGN }) => {
  const d = design || DEFAULT_CATALOG_DESIGN;
  const trackRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (d.showPromotions === false) return null;

  const items = d.promotionsItems && d.promotionsItems.length > 0
    ? d.promotionsItems
    : [];

  if (items.length === 0) return null;

  const cssVars = {
    "--promos-bg": d.promotionsBg && !d.promotionsBg.includes("fff") && !d.promotionsBg.includes("fdf") ? d.promotionsBg : "#120a06",
    "--promos-card-bg": d.promotionsCardBg && !d.promotionsCardBg.includes("fff") ? d.promotionsCardBg : "#180e09",
    "--promos-accent": d.promotionsAccent || "#ffcc00",
  };

  const checkScroll = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollToSlide = useCallback((index) => {
    if (!trackRef.current) return;
    const cards = trackRef.current.children;
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
      setCurrentIndex(index);
      setProgress(0);
    }
  }, []);

  const handleNext = useCallback(() => {
    const nextIdx = (currentIndex + 1) % items.length;
    scrollToSlide(nextIdx);
  }, [currentIndex, items.length, scrollToSlide]);

  const handlePrev = useCallback(() => {
    const prevIdx = (currentIndex - 1 + items.length) % items.length;
    scrollToSlide(prevIdx);
  }, [currentIndex, items.length, scrollToSlide]);

  // Autoplay tipo carrusel de destacados
  useEffect(() => {
    if (isPaused || items.length <= 1) return;

    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / AUTOPLAY_TIME) * 100, 100));
    }, 35);

    const autoplayTimer = setTimeout(() => {
      handleNext();
    }, AUTOPLAY_TIME);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(autoplayTimer);
    };
  }, [currentIndex, isPaused, items.length, handleNext]);

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el && el.removeEventListener("scroll", checkScroll);
  }, [items]);

  return (
    <section
      id="promociones"
      className="promotions-section"
      style={cssVars}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="container">
        {/* Cabecera compacta con controles de navegación */}
        <div className="promotions-header">
          <div className="promotions-header__left">
            <div className="promotions-badge">
              <Tag size={13} />
              <span>Ofertas Imperdibles</span>
            </div>
            <h2 className="promotions-title">
              {d.promotionsTitle || "Promociones Especiales"}
            </h2>
            {d.promotionsSubtitle && (
              <p className="promotions-subtitle">{d.promotionsSubtitle}</p>
            )}
          </div>

          <div className="carousel-nav-wrap">
            {/* Indicadores de puntos (dots) */}
            {items.length > 1 && (
              <div className="carousel-dots" aria-hidden="true">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`carousel-dot ${currentIndex === i ? "carousel-dot--active" : ""}`}
                    onClick={() => scrollToSlide(i)}
                    aria-label={`Ir a promoción ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {items.length > 1 && (
              <div className="carousel-nav-btns" aria-label="Navegación de promociones">
                <button
                  type="button"
                  className="carousel-nav-btn"
                  onClick={handlePrev}
                  aria-label="Promoción anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="carousel-nav-btn"
                  onClick={handleNext}
                  aria-label="Siguiente promoción"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carrusel Deslizable Compacto */}
        <div className="promotions-carousel-track" ref={trackRef}>
          {items.map((promo, idx) => (
            <article
              key={promo.id || `promo-${idx}`}
              className={`promo-card--compact ${currentIndex === idx ? "promo-card--active" : ""}`}
            >
              <div className="promo-card__media">
                <img
                  src={promo.imagen || "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80"}
                  alt={promo.titulo}
                  className="promo-card__img"
                  loading="lazy"
                />
                {promo.descuento && (
                  <span className="promo-card__discount-tag">
                    {promo.descuento}
                  </span>
                )}
              </div>

              <div className="promo-card__body">
                <div>
                  {promo.tag && <span className="promo-card__tag">{promo.tag}</span>}
                  <h3 className="promo-card__title">{promo.titulo}</h3>
                  <p className="promo-card__desc">{promo.descripcion}</p>
                </div>

                <a href="#menu" className="promo-card__cta">
                  <span>Aprovechar</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Barra de progreso de autoplay continuo (igual que Destacados) */}
      {items.length > 1 && (
        <div className="carousel-progress-track">
          <div
            className="carousel-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </section>
  );
};

export default Promociones;

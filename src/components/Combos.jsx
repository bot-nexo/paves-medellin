import React, { useRef, useState, useEffect, useCallback } from "react";
import { Gift, Plus, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { DEFAULT_CATALOG_DESIGN } from "../data/dataSource";
import { formatCOP } from "../utils/price";
import "../css/Combos.css";

const AUTOPLAY_TIME = 6000;

const Combos = ({ design = DEFAULT_CATALOG_DESIGN, onAddToCart }) => {
  const d = design || DEFAULT_CATALOG_DESIGN;
  const trackRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (d.showCombos === false) return null;

  const items = d.combosItems && d.combosItems.length > 0
    ? d.combosItems
    : [];

  if (items.length === 0) return null;

  const cssVars = {
    "--combos-bg": d.combosBg && !d.combosBg.includes("fbf") && !d.combosBg.includes("fff") && !d.combosBg.includes("fdf") ? d.combosBg : "#0f0906",
    "--combos-card-bg": d.combosCardBg && !d.combosCardBg.includes("fff") ? d.combosCardBg : "#180e09",
    "--combos-accent": d.combosAccent || "#d92b38",
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

  const handleAddCombo = (combo) => {
    if (!onAddToCart) return;
    const comboProduct = {
      id: combo.id || `combo-${combo.nombre}`,
      nombre: combo.nombre,
      precio: combo.precio,
      imagen: combo.imagen,
      descripcion: combo.descripcion,
      categoria: "Combos",
      customizations: {
        observaciones: combo.incluye ? `Incluye: ${combo.incluye.join(", ")}` : "",
      },
    };
    onAddToCart(comboProduct);
  };

  return (
    <section
      id="combos"
      className="combos-section"
      style={cssVars}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="container">
        {/* Cabecera compacta con controles de navegación */}
        <div className="combos-header">
          <div className="combos-header__left">
            <div className="combos-badge">
              <Gift size={13} />
              <span>Packs & Ahorro</span>
            </div>
            <h2 className="combos-title">
              {d.combosTitle || "Combos para Compartir"}
            </h2>
            {d.combosSubtitle && (
              <p className="combos-subtitle">{d.combosSubtitle}</p>
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
                    aria-label={`Ir a combo ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {items.length > 1 && (
              <div className="carousel-nav-btns" aria-label="Navegación de combos">
                <button
                  type="button"
                  className="carousel-nav-btn"
                  onClick={handlePrev}
                  aria-label="Combo anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="carousel-nav-btn"
                  onClick={handleNext}
                  aria-label="Siguiente combo"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carrusel Deslizable Compacto */}
        <div className="combos-carousel-track" ref={trackRef}>
          {items.map((combo, idx) => (
            <article
              key={combo.id || `combo-${idx}`}
              className={`combo-card--compact ${currentIndex === idx ? "combo-card--active" : ""}`}
            >
              <div className="combo-card__media">
                <img
                  src={combo.imagen || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80"}
                  alt={combo.nombre}
                  className="combo-card__img"
                  loading="lazy"
                />
                {combo.badge && (
                  <span className="combo-card__badge">
                    <Sparkles size={10} />
                    {combo.badge}
                  </span>
                )}
              </div>

              <div className="combo-card__body">
                <div>
                  <div className="combo-card__header">
                    <h3 className="combo-card__name">{combo.nombre}</h3>
                    <div className="combo-card__prices">
                      <span className="combo-card__price-current">
                        {formatCOP(combo.precio)}
                      </span>
                      {combo.precioOriginal && (
                        <span className="combo-card__price-original">
                          {formatCOP(combo.precioOriginal)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="combo-card__desc">{combo.descripcion}</p>

                  {combo.incluye && combo.incluye.length > 0 && (
                    <div className="combo-card__includes-compact">
                      {combo.incluye.slice(0, 2).map((inc, i) => (
                        <span key={i} className="combo-card__includes-tag">
                          ✓ {inc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="combo-card__btn-add"
                  onClick={() => handleAddCombo(combo)}
                >
                  <Plus size={14} />
                  <span>Agregar al Carrito</span>
                </button>
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

export default Combos;

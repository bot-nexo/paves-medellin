import { useState, useEffect, useMemo, useRef } from "react";
import MenuCard from "./MenuCard";
import { Flame, ArrowRight, Search, X } from "lucide-react";
import Promociones from "./Promociones";
import Combos from "./Combos";
import { DEFAULT_CATALOG_DESIGN } from "../data/dataSource";
import { formatCOP } from "../utils/price";
import "../css/Menu.css";

const Menu = ({
  data = [],
  categories = [],
  selectedProduct,
  setSelectedProduct,
  addToCart,
  design = DEFAULT_CATALOG_DESIGN,
  searchQuery = "",
  setSearchQuery,
}) => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const promoTimerRef = useRef(null);

  const d = design || DEFAULT_CATALOG_DESIGN;

  //*************************** */
  // Promociones relámpago dinámicas desde la BD (catalog_design.promotions_items)
  const flashPromotions = useMemo(() => {
    if (d.promotionsItems && Array.isArray(d.promotionsItems) && d.promotionsItems.length > 0) {
      return d.promotionsItems;
    }
    return [];
  }, [d.promotionsItems]);

  // Lógica condicional estricta para el Secondary Banner:
  // Si hay más de 1 promoción activa, activar autoplay del carrusel; si hay 1 sola, se muestra estática
  useEffect(() => {
    if (flashPromotions.length <= 1) return;

    promoTimerRef.current = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % flashPromotions.length);
    }, 5000);

    return () => {
      if (promoTimerRef.current) clearInterval(promoTimerRef.current);
    };
  }, [flashPromotions.length]);

  // Inyección de variables CSS dinámicas para modo oscuro permanente
  const cssVariables = useMemo(() => {
    return {
      "--menu-bg": d.bgColor || "#0d0805",
      "--card-bg": d.cardBg || "#160e0a",
      "--text-primary": d.textPrimary || "#fdfbf7",
      "--text-muted": d.textMuted || "#bda899",
      "--menu-font": d.fontFamily || "Montserrat, sans-serif",
      "--border-color": d.borderColor || "rgba(255, 255, 255, 0.08)",
      "--card-radius": d.cardRadius || "22px",
      "--btn-primary-bg": d.btnPrimaryBg || "#ffcc00",
      "--btn-primary-text": d.btnPrimaryText || "#120a06",
      "--price-tag-bg": d.priceTagBg || "#ffcc00",
      "--price-tag-text": d.priceTagText || "#140d09",
      "--category-bar-bg": d.categoryBarBg || "transparent",
      "--category-active-bg": d.categoryActiveBg || "#ffcc00",
      "--category-active-text": d.categoryActiveText || "#140d09",
      "--image-aspect-ratio": (d.imageAspectRatio || "16/11").replace("/", " / "),
    };
  }, [d]);

  // Mapeo de categorías con imágenes representativas dinámicas
  const categoryImages = useMemo(() => {
    const map = {};
    data.forEach((p) => {
      const cat = p.category || p.categoria;
      if (cat && !map[cat] && p.imagen) {
        map[cat] = p.imagen;
      }
    });
    return map;
  }, [data]);

  // Categorías de la BD integrando "Promociones especiales" y "Combos" como categorías estándar
  const navCategories = useMemo(() => {
    const list = [
      { id: "Todos", label: "Todos", emoji: "🌟" },
    ];

    // Categorías normales provenientes de Supabase
    categories
      .filter((c) => c.id !== "Todos" && c.id !== "Todo")
      .forEach((c) => {
        list.push({
          id: c.nombre || c.id,
          label: c.label || c.nombre || c.id,
          emoji: c.emoji || "🍰",
        });
      });

    // Integración obligatoria de "Promociones especiales" como categoría estándar
    const yaTienePromos = list.some((c) => c.id.toLowerCase().includes("promo") || c.id.toLowerCase().includes("oferta"));
    if (!yaTienePromos) {
      list.push({
        id: "Promociones especiales",
        label: "Promociones",
        emoji: "🏷️",
        isSpecialPromo: true,
      });
    }

    // Integración obligatoria de "Combos" como categoría estándar
    const yaTieneCombos = list.some((c) => c.id.toLowerCase().includes("combo"));
    if (!yaTieneCombos) {
      list.push({
        id: "Combos",
        label: "Combos",
        emoji: "🎁",
        isSpecialCombo: true,
      });
    }

    return list;
  }, [categories]);

  // Combos de la BD adaptados al shape de producto para cuando se seleccione la categoría Combos
  const dynamicComboProducts = useMemo(() => {
    if (!d.combosItems || !Array.isArray(d.combosItems)) return [];
    return d.combosItems.map((c, i) => ({
      id: c.id || `combo-${i}`,
      nombre: c.nombre,
      precio: c.precio,
      precioOriginal: c.precioOriginal,
      descuento: c.badge || "-15%",
      imagen: c.imagen,
      descripcion: c.descripcion || (c.incluye ? c.incluye.join(" · ") : "Combo especial."),
      category: "Combos",
      categoria: "Combos",
      destacado: true,
    }));
  }, [d.combosItems]);

  // Filtrado reactivo por categoría y buscador en vivo
  const filteredProducts = useMemo(() => {
    if (!data && dynamicComboProducts.length === 0) return [];

    let pool = [...data];

    // Si seleccionó la categoría Combos, sumar o priorizar los combos dinámicos
    if (activeCategory === "Combos") {
      const combosFromProducts = pool.filter((p) =>
        (p.category || p.categoria || "").toLowerCase().includes("combo")
      );
      return combosFromProducts.length > 0 ? combosFromProducts : dynamicComboProducts;
    }

    // Si seleccionó la categoría Promociones especiales, filtrar productos con descuento
    if (activeCategory === "Promociones especiales") {
      const promosFromProducts = pool.filter((p) => p.descuento || p.precioOriginal || p.destacado);
      return promosFromProducts.length > 0 ? promosFromProducts : pool.slice(0, 6);
    }

    // Filtro estándar por categoría
    if (activeCategory !== "Todos") {
      pool = pool.filter((item) => {
        const itemCategory = (item.category || item.categoria || "").trim().toLowerCase();
        const targetCategory = activeCategory.trim().toLowerCase();
        return itemCategory === targetCategory || itemCategory.includes(targetCategory);
      });
    }

    // Filtro en vivo del buscador superior
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      pool = pool.filter((item) => {
        const nombre = (item.nombre || item.name || "").toLowerCase();
        const desc = (item.descripcion || item.description || "").toLowerCase();
        return nombre.includes(query) || desc.includes(query);
      });
    }

    return pool;
  }, [activeCategory, searchQuery, data, dynamicComboProducts]);

  // Productos con descuento para la sección "Promociones del día"
  const dealProducts = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Priorizar los que tengan descuento o destacados
    const deals = data.filter((p) => p.descuento || p.destacado || p.precioOriginal);
    return deals.length > 0 ? deals : data.slice(0, 6);
  }, [data]);

  //*************************** */
  return (
    <section id="menu" className="menu-section bg-neutral-950 text-neutral-100" style={cssVariables}>
      <div className="container mx-auto px-4 max-w-5xl">

        {/* ── 0. Barra de Búsqueda Integrada al Menú ─ */}
        <div className="menu-search-wrapper">
          <div className="menu-search-box">
            <Search size={17} className="menu-search-icon" />
            <input
              id="menu-search-input"
              type="text"
              className="menu-search-input"
              placeholder="¿Qué antojo tienes hoy?"
              value={searchQuery}
              onChange={(e) => {
                if (setSearchQuery) setSearchQuery(e.target.value);
              }}
              aria-label="Buscar en el menú"
            />
            {searchQuery && (
              <button
                type="button"
                className="menu-search-clear"
                onClick={() => { if (setSearchQuery) setSearchQuery(""); }}
                aria-label="Limpiar búsqueda"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="menu-search-results-hint">
              {filteredProducts.length === 0
                ? "Sin resultados para "
                : `${filteredProducts.length} resultado${filteredProducts.length !== 1 ? "s" : ""} para `}
              <strong>"{searchQuery}"</strong>
            </p>
          )}
        </div>

        {/* ── 1. Sección de Categorías: "Explora por universo" (Saborio Style) ─ */}
        <div className="universe-section my-6">
          <div className="universe-header mb-4">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Explora por universo
            </h2>
            <p className="text-xs md:text-sm font-medium text-neutral-400">
              Elige tu mundo, nosotros lo llevamos a tu mesa.
            </p>
          </div>

          {/* Carrusel Horizontal de Categorías con Scroll Suave y Altura Homogénea */}
          <div className="overflow-x-auto scrollbar-none py-3 -mx-2 px-2">
            <div className="flex items-center gap-3 min-w-max pb-1">
              {navCategories.map((cat) => {
                const isActive = activeCategory === cat.id;
                const previewImg = categoryImages[cat.id] || (data[0] ? data[0].imagen : null);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`universe-card flex flex-col items-center justify-between p-2.5 rounded-2xl transition-all duration-200 w-[102px] min-w-[102px] max-w-[102px] h-[116px] min-h-[116px] flex-shrink-0 border ${isActive
                      ? "universe-card--active border-[#ffcc00] bg-gradient-to-b from-[#ffcc00]/15 to-neutral-900 shadow-[0_0_18px_rgba(255,204,0,0.35)]"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20"
                      }`}
                  >
                    {/* Orbe Circular con Resplandor de Fondo */}
                    <div className="universe-card__orb relative w-13 h-13 rounded-full flex items-center justify-center flex-shrink-0 my-auto">
                      <div
                        className={`universe-card__ring absolute inset-[-3px] rounded-full border transition-all duration-300 ${isActive
                          ? "border-[#ffcc00] shadow-[0_0_10px_#ffcc00]"
                          : "border-white/20"
                          }`}
                      />
                      <div className="universe-card__inner w-full h-full rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center">
                        {previewImg && !cat.isSpecialPromo && !cat.isSpecialCombo && cat.id !== "Todos" ? (
                          <img
                            src={previewImg}
                            alt={cat.label}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-xl">{cat.emoji || "🍰"}</span>
                        )}
                      </div>
                    </div>

                    {/* Título de la Categoría con altura fija para alineación 100% simétrica */}
                    <div className="h-[32px] w-full flex items-center justify-center text-center px-0.5">
                      <span className={`text-[11.5px] font-bold leading-tight line-clamp-2 ${isActive ? "text-[#ffcc00]" : "text-white"}`}>
                        {cat.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>


        {/* ── Banner Evento Especial (Flotante Top) ── */}
        {d.specialEvent?.active && (
          <div
            className="fixed top-5 left-1/2 z-[999] w-[92%] max-w-md text-center p-2.5 md:p-3 rounded-full shadow-2xl border overflow-hidden cursor-pointer"
            style={{
              background: d.specialEvent.bgColor || "#d92b38",
              color: d.specialEvent.textColor || "#ffffff",
              borderColor: `${d.specialEvent.textColor}30`,
              boxShadow: `0 10px 40px -5px ${(d.specialEvent.bgColor || "#d92b38")}90`,
              transform: "translateX(-50%)",
              animation: "floatBanner 3.5s ease-in-out infinite"
            }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <style>{`
              @keyframes floatBanner {
                0%, 100% { transform: translateX(-50%) translateY(0px); }
                50% { transform: translateX(-50%) translateY(-6px); }
              }
            `}</style>
            <div className="absolute inset-0 opacity-20  rounded-full" style={{ background: "linear-gradient(45deg, transparent 20%, white 50%, transparent 80%)", backgroundSize: "200% 200%", animation: "shimmer 3s infinite linear" }} />
            <h3 className="relative z-10 text-[0.8rem] md:text-[0.9rem] 
            tracking-widest uppercase m-0 leading-none drop-shadow-md">
              {d.specialEvent.texto}
            </h3>
          </div>
        )}

        {/* ── 2.5 Carruseles de Promos y Combos ── */}
        <Promociones
          design={design}
          onPromoClick={() => {
            setActiveCategory("Promociones especiales");
            const menuEl = document.getElementById("saborio-menu-tabs");
            if (menuEl) menuEl.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <Combos
          design={design}
          onComboClick={() => {
            setActiveCategory("Combos");
            const menuEl = document.getElementById("saborio-menu-tabs");
            if (menuEl) menuEl.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* ── 3. Sección "Promociones" (Centralizada en Menu.css) ── */}
        {activeCategory === "Todos" && !searchQuery && dealProducts.length > 0 && (
          <div className="daily-deals-section">
            <div className="daily-deals-header">
              <div className="daily-deals-title-wrap">
                <Flame size={20} className="text-[#ffcc00]" />
                <h2 className="daily-deals-title">
                  Promociones
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveCategory("Promociones especiales")}
                className="daily-deals-all-btn"
              >
                <span>Ver todas</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Scroll Horizontal de Tarjetas de Producto */}
            <div className="daily-deals-track-wrap">
              <div className="daily-deals-track">
                {dealProducts.map((product) => {
                  const calculatedDiscount = product.descuento || "-25%";
                  const currentPrice = formatCOP(product.precio ?? 0);
                  const originalPrice = product.precioOriginal
                    ? formatCOP(product.precioOriginal)
                    : formatCOP(Math.round((product.precio ?? 0) * 1.3));

                  return (
                    <article
                      key={product.id || product.nombre}
                      className="daily-deal-card"
                    >
                      {/* Imagen con Badge de Descuento Flotante */}
                      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-neutral-950 mb-5">
                        <img
                          src={product.imagen || "/images/placeholder.png"}
                          alt={product.nombre}
                          className="daily-deal-card__image w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#ffcc00] text-neutral-950 text-[11px] font-black shadow-md">
                          {calculatedDiscount}
                        </span>
                      </div>

                      {/* Info del Producto */}
                      <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">
                        {product.nombre}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-3 flex-1">
                        {product.descripcion || "Delicioso postre artesanal preparado con Leche Klim."}
                      </p>

                      {/* Precios y Botón Circular (+) */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-500 line-through">
                            {originalPrice}
                          </span>
                          <span className="text-base font-black text-[#ffcc00] leading-none">
                            {currentPrice}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="w-8 h-8 rounded-full bg-[#ffcc00] text-neutral-950 flex items-center justify-center font-black shadow-lg hover:scale-110 active:scale-95 transition-transform"
                          aria-label={`Agregar ${product.nombre}`}
                          title="Agregar al pedido"
                        >
                          <span className="text-lg leading-none">+</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 4. Catálogo Completo / Productos de la Categoría Seleccionada ── */}
        <div className="catalog-section">
          <div className="catalog-header">
            <div className="catalog-title-wrap">
              <h2 className="catalog-title">
                {activeCategory === "Todos"
                  ? "Todos los postres"
                  : activeCategory === "Promociones especiales"
                    ? "Ofertas y Promociones"
                    : activeCategory}
              </h2>
              <span className="catalog-badge">
                {filteredProducts.length}
              </span>
            </div>

            {activeCategory !== "Todos" && (
              <button
                type="button"
                onClick={() => {
                  if (setSearchQuery) setSearchQuery("");
                  setActiveCategory("Todos");
                }}
                className="catalog-reset-btn"
              >
                <span>Ver todos</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {/* Grid de Productos */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filteredProducts.map((product) => (
                <MenuCard
                  key={product.id || product.nombre}
                  product={product}
                  isDetailsOpen={selectedProduct?.id === product.id}
                  onToggleDetails={() =>
                    setSelectedProduct(
                      selectedProduct?.id === product.id ? null : product
                    )
                  }
                  onAddToCart={addToCart}
                  design={d}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <span className="text-4xl block mb-2">🔍</span>
              <h3 className="text-base font-bold text-white mb-1">
                No hay delicias en esta sección
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Explora nuestras otras categorías o restablece los filtros.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (setSearchQuery) setSearchQuery("");
                  setActiveCategory("Todos");
                }}
                className="px-5 py-2 rounded-full bg-[#ffcc00] text-neutral-950 text-xs font-extrabold"
              >
                Ver todos los postres
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default Menu;

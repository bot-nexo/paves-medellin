import { useState, useEffect, useMemo, useRef } from "react";
import MenuCard from "./MenuCard";
import { Flame, ArrowRight, Rocket } from "lucide-react";
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

  return (
    <section id="menu" className="menu-section bg-neutral-950 text-neutral-100" style={cssVariables}>
      <div className="container mx-auto px-4 max-w-5xl">

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

        {/* ── 2. Promos Relámpago: Secondary Banner ("Pide, disfruta, repite") ─ */}
        {flashPromotions.length > 0 && (
          <div className="saborio-secondary-banner-wrapper mt-3 mb-8 md:mt-5 md:mb-10">
            {flashPromotions.length === 1 ? (
              /* Tarjeta Estática a Ancho Completo (Lógica estricta cuando es 1 sola promo) */
              <div className="saborio-repeat-banner relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 pb-4 sm:pb-6 overflow-hidden border border-[#ffcc00]/30 bg-gradient-to-r from-neutral-900 via-neutral-900/95 to-neutral-950 shadow-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#ffcc00]/15 border border-[#ffcc00]/30 text-[#ffcc00] text-[10.5px] sm:text-xs font-black tracking-wider uppercase mb-2 sm:mb-3">
                  <Rocket size={12} className="text-[#ffcc00]" />
                  <span>{flashPromotions[0].tag || "ENVÍO ULTRA RÁPIDO"}</span>
                </div>

                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="max-w-md flex-1">
                    <h3 className="text-base sm:text-2xl font-black leading-tight tracking-tight uppercase">
                      <span className="text-white">PIDE, </span>
                      <span className="text-[#ffcc00]">DISFRUTA, REPITE</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                      {flashPromotions[0].descripcion || flashPromotions[0].titulo}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveCategory("Promociones especiales")}
                      className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-[#ffcc00] text-neutral-950 text-xs font-black shadow-lg hover:bg-[#ffe04d] transition-transform active:scale-95"
                    >
                      <span>Ver menú</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {flashPromotions[0].imagen && (
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 shadow-md bg-neutral-950">
                      <img
                        src={flashPromotions[0].imagen}
                        alt="Promo Relámpago"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Carrusel Dinámico (Lógica estricta cuando hay > 1 promo activa) */
              <div className="saborio-repeat-banner-carousel relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 pb-3 sm:pb-5 overflow-hidden border border-[#ffcc00]/30 bg-gradient-to-r from-neutral-900 via-neutral-900/95 to-neutral-950 shadow-2xl">
                {flashPromotions.map((promo, idx) => {
                  if (idx !== currentPromoIndex) return null;
                  return (
                    <div key={promo.id || idx} className="saborio-repeat-slide transition-opacity duration-300">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#ffcc00]/15 border border-[#ffcc00]/30 text-[#ffcc00] text-[10.5px] sm:text-xs font-black tracking-wider uppercase mb-2 sm:mb-3">
                        <Rocket size={12} className="text-[#ffcc00]" />
                        <span>{promo.tag || promo.descuento || "OFERTA ESPECIAL"}</span>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <div className="max-w-md flex-1">
                          <h3 className="text-base sm:text-2xl font-black leading-tight tracking-tight uppercase">
                            <span className="text-white">
                              {promo.titulo ? promo.titulo.split(" ")[0] : "PIDE,"}{" "}
                            </span>
                            <span className="text-[#ffcc00]">
                              {promo.titulo ? promo.titulo.split(" ").slice(1).join(" ") : "DISFRUTA, REPITE"}
                            </span>
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                            {promo.descripcion}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveCategory("Promociones especiales")}
                            className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-[#ffcc00] text-neutral-950 text-xs font-black shadow-lg hover:bg-[#ffe04d] transition-transform active:scale-95"
                          >
                            <span>Ver promo</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>

                        {promo.imagen && (
                          <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 shadow-md bg-neutral-950">
                            <img
                              src={promo.imagen}
                              alt={promo.titulo}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Dots del Carrusel de Promos Relámpago con margen protegido */}
                <div className="flex justify-center items-center gap-2 pt-3 pb-1">
                  {flashPromotions.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPromoIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${currentPromoIndex === i ? "w-6 bg-[#ffcc00]" : "w-1.5 bg-white/30"
                        }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

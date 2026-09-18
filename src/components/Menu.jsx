import { useState, useEffect, useMemo } from "react";
import MenuCard from "./MenuCard";
import { Sparkles } from "lucide-react";
import { DEFAULT_CATALOG_DESIGN } from "../data/dataSource";
import "../css/Menu.css";

const Menu = ({
  data = [],
  categories = [],
  selectedProduct,
  setSelectedProduct,
  addToCart,
  design = DEFAULT_CATALOG_DESIGN,
}) => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [filteredData, setFilteredData] = useState([]);

  const d = design || DEFAULT_CATALOG_DESIGN;

  // Inyección de variables CSS dinámicas a nivel del contenedor del menú
  const cssVariables = useMemo(() => {
    return {
      "--menu-bg": d.bgColor || "#fecdcd",
      "--card-bg": d.cardBg || "#fdfbf7",
      "--text-primary": d.textPrimary || "#3d2314",
      "--text-muted": d.textMuted || "#7a6353",
      "--menu-font": d.fontFamily || "Montserrat",
      "--border-color": d.borderColor || "rgba(61, 35, 20, 0.08)",
      "--card-radius": d.cardRadius || "20px",
      "--btn-primary-bg": d.btnPrimaryBg || "#d92b38",
      "--btn-primary-text": d.btnPrimaryText || "#ffffff",
      "--btn-details-bg": d.btnDetailsBg || "transparent",
      "--btn-details-text": d.btnDetailsText || "#3d2314",
      "--btn-details-border": d.btnDetailsBorder || "rgba(61, 35, 20, 0.12)",
      "--price-tag-bg": d.priceTagBg || "#3d2314",
      "--price-tag-text": d.priceTagText || "#ffffff",
      "--badge-popular-bg": d.badgePopularBg || "#d92b38",
      "--badge-popular-text": d.badgePopularText || "#ffffff",
      "--category-bar-bg": d.categoryBarBg || "rgba(255, 255, 255, 0.7)",
      "--category-active-bg": d.categoryActiveBg || "#d92b38",
      "--category-active-text": d.categoryActiveText || "#ffffff",
      "--category-inactive-bg": d.categoryInactiveBg || "transparent",
      "--category-inactive-text": d.categoryInactiveText || "#7a6353",
      "--header-badge-bg": d.headerBadgeBg || "rgba(255, 255, 255, 0.75)",
      "--header-badge-text": d.headerBadgeText || "#b4232e",
      "--image-aspect-ratio": (d.imageAspectRatio || "4/3").replace("/", " / "),
    };
  }, [d]);

  // Clases dinámicas de grilla
  const gridClasses = useMemo(() => {
    const classes = ["menu-grid"];
    if (d.columnsDesktop === "2") classes.push("menu-grid--col-2");
    else if (d.columnsDesktop === "3") classes.push("menu-grid--col-3");
    else if (d.columnsDesktop === "4") classes.push("menu-grid--col-4");

    if (d.columnsMobile === "2") classes.push("menu-grid--mobile-2");
    return classes.join(" ");
  }, [d.columnsDesktop, d.columnsMobile]);

  //************************************ */
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    if (activeCategory === "Todos") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) => {
        const itemCategory = (item.category || item.categoria || "").trim().toLowerCase();
        const targetCategory = activeCategory.trim().toLowerCase();
        return itemCategory === targetCategory || itemCategory.includes(targetCategory);
      });
      setFilteredData(filtered);
    }
  }, [activeCategory, data]);

  //*************************************** */
  return (
    <section id="menu" className="menu-section" style={cssVariables}>
      <div className="container">
        {/* Header */}
        <div className="menu-header">
          <div className="menu-badge">
            <Sparkles className="badge-icon" size={16} />
            <span>Nuestra Selección</span>
          </div>
          <h2 className="menu-title">Descubre Nuestros Pavés</h2>
          <p className="menu-slogan">
            Postres cremosos hechos con Leche Klim y los mejores toppings artesanales.
          </p>
        </div>

        {/* Category Filter */}
        <div className="category-filter-wrapper">
          <nav className="category-filter" aria-label="Filtro de categorías">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`filter-btn ${isActive ? "filter-btn--active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                  aria-pressed={isActive}
                >
                  {cat.icon && <span className="filter-btn__icon">{cat.icon}</span>}
                  <span className="filter-btn__label">{cat.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Product Grid */}
        {filteredData.length > 0 ? (
          <div className={gridClasses}>
            {filteredData.map((product) => (
              <MenuCard
                key={product.id || product.nombre || product.name}
                product={product}
                isDetailsOpen={selectedProduct?.id === product.id}
                onToggleDetails={() =>
                  setSelectedProduct(
                    selectedProduct?.id === product.id ? null : product,
                  )
                }
                onAddToCart={addToCart}
                design={d}
              />
            ))}
          </div>
        ) : (
          <div className="menu-empty">
            <p>No se encontraron postres en esta categoría por el momento.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Menu;

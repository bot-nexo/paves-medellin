import { useState, useEffect } from "react";
import MenuCard from "./MenuCard";
import { Sparkles } from "lucide-react";
import "../css/Menu.css";


const Menu = ({
  data = [],
  categories = [],
  selectedProduct,
  setSelectedProduct,
  addToCart,
}) => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [filteredData, setFilteredData] = useState([]);

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
    <section id="menu" className="menu-section">
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
          <div className="menu-grid">
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

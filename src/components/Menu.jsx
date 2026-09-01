import  { useState, useEffect } from "react";
import MenuCard from "./MenuCard";
import { Sparkles } from "lucide-react";
import '../css/Menu.css'

// Categorías sincronizadas exactamente con la estructura de datos
const categories = [
  { id: "Todo", label: "✨ Todo" },
  { id: "Pavés 8oz", label: "🍨 Pavés 8oz" },
  { id: "Con Queso", label: "🧀 Con Queso" },
  { id: "Tendencia", label: "🔥 Tendencia" },
  { id: "Cuchareables", label: "🍫 Cuchareables" },
  { id: "Quesillos", label: "🍮 Quesillos" },
  { id: "Cumpleaños", label: "🎂 Cumpleaños" },
];

const Menu = ({ data = [], selectedProduct, setSelectedProduct, addToCart }) => {
  const [activeCategory, setActiveCategory] = useState("Todo");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    if (activeCategory === "Todo") {
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

  return (
    <section id="menu" className="menu-section">
      <div className="container">
        {/* Encabezado */}
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

        {/* Filtro de Categorías */}
        <div className="category-filter-wrapper">
          <div className="category-filter">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`filter-btn ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Productos */}
        {filteredData.length > 0 ? (
          <div className="menu-grid">
            {filteredData.map((product) => (
              <MenuCard
                key={product.id || product.nombre || product.name}
                product={product}
                isFlipped={selectedProduct?.id === product.id}
                onFlip={setSelectedProduct}
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
import { Sparkles, Plus, CheckCircle2, Gift } from "lucide-react";
import { DEFAULT_CATALOG_DESIGN } from "../data/dataSource";
import { formatCOP } from "../utils/price";
import "../css/Combos.css";

const Combos = ({ design = DEFAULT_CATALOG_DESIGN, onAddToCart }) => {
  const d = design || DEFAULT_CATALOG_DESIGN;

  if (d.showCombos === false) return null;

  const items = d.combosItems && d.combosItems.length > 0
    ? d.combosItems
    : [];

  if (items.length === 0) return null;

  const cssVars = {
    "--combos-bg": d.combosBg || "#fbf8f3",
    "--combos-card-bg": d.combosCardBg || "#ffffff",
    "--combos-accent": d.combosAccent || "#d92b38",
  };

  const handleAddCombo = (combo) => {
    if (!onAddToCart) return;
    // Adaptamos el combo al formato de producto del carrito
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
    <section id="combos" className="combos-section" style={cssVars}>
      <div className="container">
        <div className="combos-header">
          <div className="combos-badge">
            <Gift size={15} />
            <span>Packs & Ahorro</span>
          </div>
          <h2 className="combos-title">
            {d.combosTitle || "Combos & Packs para Compartir"}
          </h2>
          <p className="combos-subtitle">
            {d.combosSubtitle || "Las combinaciones perfectas al mejor precio para tus momentos dulces"}
          </p>
        </div>

        <div className="combos-grid">
          {items.map((combo) => (
            <article key={combo.id || combo.nombre} className="combo-card">
              <div className="combo-card__media">
                <img
                  src={combo.imagen || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80"}
                  alt={combo.nombre}
                  className="combo-card__img"
                  loading="lazy"
                />
                {combo.badge && (
                  <span className="combo-card__badge">
                    <Sparkles size={11} />
                    {combo.badge}
                  </span>
                )}
              </div>

              <div className="combo-card__body">
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
                  <div className="combo-card__includes">
                    <span className="combo-card__includes-title">Incluye:</span>
                    <ul className="combo-card__includes-list">
                      {combo.incluye.map((inc, i) => (
                        <li key={i} className="combo-card__includes-item">
                          <CheckCircle2 size={13} color="var(--combos-accent, #d92b38)" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  className="combo-card__btn-add"
                  onClick={() => handleAddCombo(combo)}
                >
                  <Plus size={16} />
                  <span>Agregar Combo al Carrito</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Combos;

import { Plus, Eye, Sparkles, X } from "lucide-react";
import { formatCOP } from "../utils/price";
import "../css/MenuCard.css";

const MenuCard = ({
  product,
  isDetailsOpen,
  onToggleDetails,
  onAddToCart,
  design,
}) => {
  const formattedPrice = formatCOP(product.precio ?? 0);

  const imageSrc = product.imagen || "/images/placeholder.png";
  const titleText = product.nombre || "Postre";
  const descriptionText =
    product.descripcion ||
    "Delicioso postre artesanal preparado con crema y Leche Klim.";

  const layoutClass =
    design?.cardLayout === "horizontal" ? "menu-card--layout-horizontal" : "";
  const shadowClass = `menu-card--shadow-${design?.cardShadow || "md"}`;

  //*************************************** */
  return (
    <article
      className={`menu-card ${layoutClass} ${shadowClass} ${isDetailsOpen ? "menu-card--open" : ""}`}
      aria-expanded={isDetailsOpen}
    >
      <div className="menu-card__inner">
        {/* Imagen */}
        <div className="menu-card__media">
          <img
            src={imageSrc}
            alt={titleText}
            className="menu-card__image"
            loading="lazy"
          />
          <div className="menu-card__media-overlay" aria-hidden="true" />

          {product.destacado && (
            <span className="menu-card__badge">
              <Sparkles size={12} />
              Popular
            </span>
          )}

          <span className="menu-card__price-tag">{formattedPrice}</span>
        </div>

        {/* Contenido (Alineado con Flexbox) */}
        <div className="menu-card__content">
          <div className="menu-card__body">
            <h3 className="menu-card__title">{titleText}</h3>
            <p className="menu-card__description">{descriptionText}</p>

            {product.nota && (
              <span className="menu-card__nota">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {product.nota}
              </span>
            )}
          </div>

          <div className="menu-card__actions">
            <button
              type="button"
              className="menu-card__btn-details"
              onClick={onToggleDetails}
              aria-expanded={isDetailsOpen}
              aria-controls={`menu-card-details-${product.id}`}
            >
              <Eye size={16} />
              <span>{isDetailsOpen ? "Cerrar" : "Detalles"}</span>
            </button>
            <button
              type="button"
              className="menu-card__btn-add"
              onClick={() => onAddToCart(product)}
              aria-label={`Agregar ${titleText} al carrito`}
            >
              <Plus size={17} />
              <span>Agregar</span>
            </button>
          </div>
        </div>

        {/* Panel deslizante de detalles */}
        <div
          className="menu-card__panel"
          id={`menu-card-details-${product.id}`}
          aria-hidden={!isDetailsOpen}
        >
          <div className="menu-card__panel-header">
            <div className="menu-card__panel-title-wrap">
              <h4 className="menu-card__panel-title">Detalles</h4>
              {((product.adiciones?.length > 0) || (product.salsas?.length > 0)) && (
                <span className="menu-card__badge-tag">
                  ✨ Personalizable
                </span>
              )}
            </div>
            <button
              type="button"
              className="menu-card__panel-close"
              onClick={onToggleDetails}
              aria-label="Cerrar detalles"
            >
              <X size={16} />
            </button>
          </div>

          <div className="menu-card__panel-body">
            <p className="menu-card__panel-description">{descriptionText}</p>

            {product.toppings?.length > 0 && (
              <div className="menu-card__toppings-section">
                <span className="menu-card__toppings-title">Toppings incluidos:</span>
                <ul className="menu-card__toppings-list">
                  {product.toppings.map((top, idx) => (
                    <li key={idx} className="menu-card__topping-chip">
                      {top}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="menu-card__panel-footer">
            <button
              type="button"
              className="menu-card__btn-add-full"
              onClick={() => onAddToCart(product)}
            >
              <Plus size={17} />
              <span>Agregar &middot; {formattedPrice}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default MenuCard;
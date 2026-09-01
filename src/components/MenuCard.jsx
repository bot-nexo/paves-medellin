import React from "react";
import { Plus, Eye, Sparkles, ArrowLeft } from "lucide-react";
import "../css/MenuCard.css";

const MenuCard = ({ product, isFlipped, onFlip, onAddToCart }) => {
  const rawPrice = product.precio ?? product.price ?? 0;

  const formattedPrice = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(rawPrice);

  const imageSrc = product.imagen || product.image || "/images/placeholder.png";
  const titleText = product.nombre || product.name || product.title || "Postre";
  const descriptionText =
    product.descripcion ||
    product.description ||
    "Delicioso postre artesanal preparado con crema de Leche Klim.";

  return (
    <div className={`menu-card ${isFlipped ? "menu-card--flipped" : ""}`}>
      <div className="menu-card__inner">
        
        {/* --- CARA FRONTAL --- */}
        <div className="menu-card__front">
          {/* Imagen y Badge de Precio */}
          <div className="menu-card__image-container">
            <img
              src={imageSrc}
              alt={titleText}
              className="menu-card__image"
              loading="lazy"
            />
            <div className="menu-card__price-tag">{formattedPrice}</div>

            {product.destacado && (
              <span className="menu-card__badge">
                <Sparkles size={12} /> Popular
              </span>
            )}
          </div>

          {/* Información Frontal: Solo Título y Botones */}
          <div className="menu-card__content">
            <h3 className="menu-card__title">{titleText}</h3>

            <div className="menu-card__actions">
              <button
                className="menu-card__btn-details"
                onClick={() => onFlip(isFlipped ? null : product)}
                type="button"
              >
                <Eye size={16} />
                <span>Detalles</span>
              </button>

              <button
                className="menu-card__btn-add"
                onClick={() => onAddToCart(product)}
                type="button"
                aria-label={`Agregar ${titleText} al carrito`}
              >
                <Plus size={18} />
                <span>Agregar</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- CARA TRASERA --- */}
        <div className="menu-card__back">
          {/* Imagen en la cara trasera */}
          <div className="menu-card__image-container menu-card__image-container--back">
            <img
              src={imageSrc}
              alt={titleText}
              className="menu-card__image"
              loading="lazy"
            />
            <button
              className="menu-card__btn-back-icon"
              onClick={() => onFlip(null)}
              type="button"
              title="Volver al frente"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          {/* Información Trasera: Descripción, Toppings y Botones */}
          <div className="menu-card__back-content">
            <div className="menu-card__back-info">
              <h4 className="menu-card__back-title">{titleText}</h4>
              <p className="menu-card__back-text">{descriptionText}</p>

              {product.toppings && product.toppings.length > 0 && (
                <div className="menu-card__toppings">
                  <span className="menu-card__toppings-title">Toppings incluidos:</span>
                  <ul>
                    {product.toppings.map((top, idx) => (
                      <li key={idx}>• {top}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="menu-card__back-actions">
              <button
                className="menu-card__btn-add-full"
                type="button"
                onClick={() => {
                  onAddToCart(product);
                  onFlip(null);
                }}
              >
                <Plus size={18} />
                <span>Agregar ({formattedPrice})</span>
              </button>

              <button
                className="menu-card__btn-back"
                type="button"
                onClick={() => onFlip(null)}
              >
                Volver al frente
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MenuCard;
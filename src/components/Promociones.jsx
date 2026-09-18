import { Sparkles, ArrowRight, Tag } from "lucide-react";
import { DEFAULT_CATALOG_DESIGN } from "../data/dataSource";
import "../css/Promociones.css";

const Promociones = ({ design = DEFAULT_CATALOG_DESIGN }) => {
  const d = design || DEFAULT_CATALOG_DESIGN;

  if (d.showPromotions === false) return null;

  const items = d.promotionsItems && d.promotionsItems.length > 0
    ? d.promotionsItems
    : [];

  if (items.length === 0) return null;

  const cssVars = {
    "--promos-bg": d.promotionsBg || "#fff5f5",
    "--promos-card-bg": d.promotionsCardBg || "#ffffff",
    "--promos-accent": d.promotionsAccent || "#d92b38",
  };

  return (
    <section id="promociones" className="promotions-section" style={cssVars}>
      <div className="container">
        <div className="promotions-header">
          <div className="promotions-badge">
            <Tag size={15} />
            <span>Ofertas Imperdibles</span>
          </div>
          <h2 className="promotions-title">
            {d.promotionsTitle || "Promociones & Especiales"}
          </h2>
          <p className="promotions-subtitle">
            {d.promotionsSubtitle || "Aprovecha nuestras ofertas por tiempo limitado en tus postres favoritos"}
          </p>
        </div>

        <div className="promotions-grid">
          {items.map((promo) => (
            <article key={promo.id || promo.titulo} className="promo-card">
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
                {promo.tag && <span className="promo-card__tag">{promo.tag}</span>}
                <h3 className="promo-card__title">{promo.titulo}</h3>
                <p className="promo-card__desc">{promo.descripcion}</p>

                <a href="#menu" className="promo-card__cta">
                  <span>Pedir Ahora</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Promociones;

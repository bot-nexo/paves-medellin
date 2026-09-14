import { ShoppingBag } from "lucide-react";
import logoImg from "../assets/images/logo.png";
import { estaAbiertoSegunHorario } from "../utils/horario";
import "../css/Hero.css";

const Hero = ({ cartCount, onOpenCart, settings }) => {
  const estado = estaAbiertoSegunHorario(settings);
  return (
    <section className="hero">
      {/* Top Bar — Logo + Cart */}
      <div className="hero__topbar container">
        <a href="#" className="hero__brand">
          <img src={logoImg} alt="Pavés Medellín" className="hero__logo" />
          <span className="hero__brand-name">
            Pavés <span className="hero__brand-accent">Medellín</span>
          </span>
        </a>

        <button
          className={"hero__cart-btn" + (cartCount > 0 ? " hero__cart-btn--active" : "")}
          onClick={onOpenCart}
          title={"Ver carrito con " + cartCount + " productos"}
        >
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="hero__cart-badge">{cartCount}</span>
          )}
          <span className="hero__cart-text">Mi Pedido</span>
        </button>
      </div>

      {/* Hero Content */}
      <div className="hero__container container">
        <div className="hero__content">
          <div className="hero__badge">
            <span>✨ Postres Artesanales en Medellín</span>
          </div>

          {/* Estado del negocio: abierto según horario o cerrado (agenda pedidos) */}
          <div
            className={
              "hero__estado " + (estado.abierto ? "hero__estado--abierto" : "hero__estado--cerrado")
            }
          >
            <span className="hero__estado-dot" />
            <span>
              {estado.abierto ? "Abierto ahora" : "Cerrado — agéndanos tu pedido"}
              {estado.horarioTexto ? ` · ${estado.horarioTexto}` : ""}
            </span>
          </div>

          <h1 className="hero__title">
            Pavés Cremosos{" "}
            <span className="hero__highlight">llenos de sabor</span>
          </h1>

          <p className="hero__slogan">
            El verdadero sabor brasileño en formato personal. Descubre nuestras
            combinaciones con Leche Klim, queso, frutas frescas y toppings únicos.
          </p>

          <div className="hero__actions">
            <a href="#menu" className="hero__btn">
              <ShoppingBag size={20} />
              <span>Ver Menú</span>
            </a>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-number">17+</span>
              <span className="hero__stat-label">Sabores Únicos</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">100%</span>
              <span className="hero__stat-label">Artesanal</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <span className="hero__stat-number">★ 5.0</span>
              <span className="hero__stat-label">Opiniones</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

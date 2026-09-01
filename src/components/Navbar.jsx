import React from "react";
import { FlameIcon, ShoppingBag, UtensilsCrossed, PhoneCall } from "lucide-react";
import "../css/Navbar.css";

const Navbar = ({ scrolled, cartCount, onOpenCart }) => {
  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__container">
        {/* Marca / Logo */}
        <div className="navbar__brand">
          <a href="#" className="navbar__logo-link">
            <div className="navbar__logo-icon">
              <FlameIcon className="icon-flame" />
            </div>
            <span className="navbar__brand-name">
              Paves <span className="highlight">Medellin</span>
            </span>
          </a>
        </div>

        {/* Menú de Navegación y Acciones */}
        <div className="navbar__actions">
          <nav className="navbar__nav" aria-label="Navegación principal">
            <ul className="navbar__links">
              <li>
                <a href="#menu" className="navbar__link">
                  <UtensilsCrossed className="navbar__link-icon" />
                  <span>Menú</span>
                </a>
              </li>
              <li>
                <a href="#contacto" className="navbar__link">
                  <PhoneCall className="navbar__link-icon" />
                  <span>Contacto</span>
                </a>
              </li>
            </ul>
          </nav>

          {/* Botón de Carrito */}
          <button
            className={`navbar__cart-btn ${cartCount > 0 ? "navbar__cart-btn--has-items" : ""}`}
            onClick={onOpenCart}
            aria-label={`Ver carrito con ${cartCount} productos`}
          >
            <div className="navbar__cart-icon-wrapper">
              <ShoppingBag className="navbar__cart-icon" />
              {cartCount > 0 && (
                <span className="navbar__cart-badge" key={cartCount}>
                  {cartCount}
                </span>
              )}
            </div>
            <span className="navbar__cart-text">Mi Pedido</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
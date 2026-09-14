import logoImg from "../assets/images/logo.jpg";
import { info } from "../data/menu";
import { MapPin, Clock, Phone, Instagram, Facebook, ExternalLink } from "lucide-react";
import "../css/Footer.css";

// settings viene del dataSource vía useCatalog (editable desde el panel admin).
// Fallback a la info estática si no se pasa (robustez).
const Footer = ({ settings = info }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-modern">
      {/* Top accent line */}
      <div className="footer-accent-line" />

      <div className="container">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <a href="#" className="footer-logo-link">
              <img src={logoImg} alt="Pavés Medellín" className="footer-logo-img" />
              <div className="footer-logo-text">
                <span className="footer-brand-name">
                  Pavés <span className="footer-brand-accent">Medellín</span>
                </span>
                <span className="footer-brand-tagline">Postres Artesanales</span>
              </div>
            </a>
            <p className="footer-brand-desc">
              El verdadero sabor brasileño en formato personal. Postres cremosos hechos
              con Leche Klim y los mejores ingredientes artesanales.
            </p>
            <div className="footer-social">
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              {settings.tiktok && (
                <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="footer-social-link footer-social-tiktok" aria-label="TikTok">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.18v-3.45a4.85 4.85 0 01-5.58-2.7V6.69h5.58z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col__title">Navegación</h4>
            <ul className="footer-links">
              <li><a href="#menu">Menú</a></li>
              <li><a href="#contacto">Contacto</a></li>
              <li><a href={settings.mapsGoogle || "#contacto"} target="_blank" rel="noopener noreferrer">
                Cómo Llegar <ExternalLink size={12} />
              </a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-col">
            <h4 className="footer-col__title">Contacto</h4>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <MapPin size={16} />
                <span>{settings.address}</span>
              </li>
              <li className="footer-contact-item">
                <Clock size={16} />
                <div>
                  <strong>{settings.day1}</strong>
                  <span>{settings.hours1}</span>
                </div>
              </li>
            </ul>
          </div>


        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom__left">
            <span>© {currentYear} Pavés Medellín. Todos los derechos reservados.</span>
          </div>
          <div className="footer-bottom__right">
            <span className="footer-dev-tag">
              Desarrollado por{" "}
              <a href="https://www.nexodevstudio.com" target="_blank" rel="noopener noreferrer">
                NexodevStudio
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

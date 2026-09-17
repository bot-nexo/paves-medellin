import logoImg from "../assets/images/logo.png";
import { info } from "../data/menu";
import { MapPin, Clock, ExternalLink } from "lucide-react";
import { FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
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
              <img src={settings?.logo_url || logoImg} alt="Pavés Medellín" className="footer-logo-img" />
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
              <a href={settings.instagram} title="Siguenos en Instagram" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                <FaInstagram size={18} />
              </a>
              <a href={settings.facebook} title="Siguenos en Facebook" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
                <FaFacebook size={18} />
              </a>
              {settings.tiktok && (
                <a href={settings.tiktok} title="Siguenos en TikTok" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="TikTok">
                  <FaTiktok size={18} />
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

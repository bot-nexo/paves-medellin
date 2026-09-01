import React from "react";
import { Sparkles, ArrowRight, ShoppingBag } from "lucide-react";
import '../css/Hero.css';

const Hero = ({ heroImages, currentSlide }) => {
  return (
    <section className="hero">
      {/* Carrusel de Fondo */}
      <div className="hero__carousel">
        {heroImages && heroImages.length > 0 ? (
          heroImages.map((img, idx) => (
            <div
              key={idx}
              className={`hero__slide ${idx === currentSlide ? "hero__slide--active" : ""}`}
              style={{ backgroundImage: `url(${img})` }}
            ></div>
          ))
        ) : (
          <div className="hero__slide hero__slide--active hero__slide--placeholder" />
        )}
        {/* Capa de contraste suave para resaltar el texto */}
        <div className="hero__overlay"></div>
      </div>

      {/* Contenido Principal */}
      <div className="hero__container container">
        <div className="hero__content" data-aos="fade-up">
          {/* Badge Distintivo */}
          <div className="hero__badge">
            <Sparkles className="hero__badge-icon" />
            <span>Postres Artesanales en Medellín</span>
          </div>

          {/* Título Principal */}
          <h1 className="hero__title">
            Pavés Cremosos <br />
            <span className="highlight">llenos de sabor</span>
          </h1>

          {/* Eslogan / Subtítulo */}
          <p className="hero__slogan">
            El verdadero sabor brasileño en formato personal. Descubre nuestras
            combinaciones con Leche Klim, queso, frutas frescas y toppings únicos.
          </p>

          {/* Botones de Acción (UX Móvil) */}
          <div className="hero__actions">
            <a href="#menu" className="hero__btn hero__btn--primary">
              <ShoppingBag className="btn-icon" />
              <span>Ver Menú</span>
            </a>

            <a
              href="https://wa.me/573157978326?text=Hola!%20Quiero%20hacer%20un%20pedido"
              target="_blank"
              rel="noreferrer"
              className="hero__btn hero__btn--secondary"
            >
              <span>Pedir por WhatsApp</span>
              <ArrowRight className="btn-icon" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
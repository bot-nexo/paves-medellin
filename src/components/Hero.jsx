import { useState, useEffect } from "react";
import { Sparkles, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import "../css/Hero.css";
import { products } from "../data/menu";
import { formatCOP } from "../utils/price";

const featured = products.filter((p) => p.destacado);

const Hero = ({ onAddToCart }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const goPrev = () => setCurrent((c) => (c - 1 + featured.length) % featured.length);
  const goNext = () => setCurrent((c) => (c + 1) % featured.length);

  return (
    <section className="hero">
      <div className="hero__container container">
        <div className="hero__content" data-aos="fade-up">
          <div className="hero__badge">
            <Sparkles className="hero__badge-icon" />
            <span>Postres Artesanales en Medellin</span>
          </div>

          <h1 className="hero__title">
            Paves Cremosos <br />
            <span className="highlight">llenos de sabor</span>
          </h1>

          <p className="hero__slogan">
            El verdadero sabor brasileño en formato personal. Descubre nuestras
            combinaciones con Leche Klim, queso, frutas frescas y toppings unicos.
          </p>

          <div className="hero__actions">
            <a href="#menu" className="hero__btn hero__btn--primary">
              <ShoppingBag className="btn-icon" />
              <span>Ver Menu</span>
            </a>
          </div>
        </div>

        <div className="hero__products-carousel" data-aos="fade-up" data-aos-delay="200">
          <button className="carousel-arrow carousel-arrow--left" onClick={goPrev} type="button">
            <ChevronLeft size={20} />
          </button>

          <div className="carousel-viewport">
            <div className="carousel-track" style={{ transform: "translateX(-" + (current * 100) + "%)" }}>
              {featured.map((product) => (
                <div className="carousel-slide" key={product.id}>
                  <div className="featured-card">
                    <div className="featured-card__image">
                      <img src={product.imagen} alt={product.nombre} loading="lazy" />
                      <span className="featured-card__badge">
                        <Sparkles size={12} /> Popular
                      </span>
                    </div>
                    <div className="featured-card__info">
                      <h3 className="featured-card__name">{product.nombre}</h3>
                      <p className="featured-card__desc">{product.descripcion}</p>
                      <div className="featured-card__bottom">
                        <span className="featured-card__price">{formatCOP(product.precio)}</span>
                        <button className="featured-card__btn" onClick={() => onAddToCart(product)} type="button">
                          <ShoppingBag size={16} /> Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="carousel-arrow carousel-arrow--right" onClick={goNext} type="button">
            <ChevronRight size={20} />
          </button>

          <div className="carousel-dots">
            {featured.map((_, idx) => (
              <button
                key={idx}
                className={"carousel-dot" + (idx === current ? " active" : "")}
                onClick={() => setCurrent(idx)}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

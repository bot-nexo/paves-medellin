const Footer = ({ whatsappNumber }) => {
  const message =
    "Hola, vengo de la página web y me gustaría hacer un pedido";
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p>
            &copy; 2026 Todos los derechos reservados.
          </p>
          <p className="developer-tag">
            Desarrollado por{" "}
            <a
              // href="https://wa.me/573207643590?text=Hola%20JuandaCode,%20estoy%20interesado%20en%20una%20página%20web"
              href="https://juanda7426.github.io/Juanda-Code/"
              target="_blank"
              rel="noopener noreferrer"
            >
              JuandaCode
            </a>
          </p>
        </div>
      </div>
      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
      >
        <i className="fab fa-whatsapp"></i>
      </a>
    </footer>
  );
};

export default Footer;

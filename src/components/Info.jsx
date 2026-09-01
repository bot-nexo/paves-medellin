const Info = ({ info }) => {
  const address = info.address;
  const googleMapsUrl = info.mapsGoogle;
  const wazeUrl = info.mapsWaze;

  //********************* */
  return (
    <section id="contacto" className="info-section">
      <div className="container">
        <div className="info-grid">
          <div className="info-item" data-aos="fade-right">
            <h3>
              <i className="fas fa-map-marker-alt"></i> Encuéntranos
            </h3>
            <p>{address}</p>
            <div className="map-buttons">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-map google"
              >
                <i className="fab fa-google"></i> Google Maps
              </a>
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-map waze"
              >
                <i className="fab fa-waze"></i> Waze
              </a>
            </div>
          </div>
          <div className="info-item" data-aos="fade-up">
            <h3>
              <i className="fas fa-clock"></i> Horarios
            </h3>
            <ul className="hours-list">
              <li>
                <span>{info.closed}</span> Cerrado
              </li>
              <li>
                <span>{info.day1}</span> {info.hours1}
              </li>
              <li>
                <span>{info.day2}</span> {info.hours2}
              </li>
            </ul>
          </div>
          <div className="info-item" data-aos="fade-left">
            <h3>
              <i className="fas fa-share-alt"></i> Síguenos
            </h3>
            <div className="social-links">
              <a
                href={info.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a href={info.facebook} target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook"></i>
              </a>
              <a href={info.tiktok} target="_blank" rel="noopener noreferrer">
                <i className="fab fa-tiktok"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Info;

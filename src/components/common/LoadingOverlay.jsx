
import { useState, useEffect } from "react";
import "./LoadingOverlay.css";

/**
 * @param {string} text - Texto descriptivo opcional.
 * @param {number} minTime - Tiempo mínimo en milisegundos para mostrar el loader (por defecto 2s).
 */
const LoadingOverlay = ({
  text = "Cargando...",
  minTime = 1000
}) => {
  const logoSrc = "/favicon.ico";
  const [mostrar, setMostrar] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMostrar(false);
    }, minTime);

    return () => clearTimeout(timer); // Limpia el temporizador si el componente se desmonta antes
  }, [minTime]);

  if (!mostrar) return null;

  //********************************** */
  return (
    <div id="pm-loader" className="pm-loader-wrapper">
      <div className="pm-backdrop">
        <div className="pm-nebula pm-nebula-gold"></div>
        <div className="pm-nebula pm-nebula-pink"></div>
      </div>

      <div className="pm-center">
        <div className="pm-rings-container">
          <div className="pm-conic-ring"></div>
          <div className="pm-pulse-ring"></div>
          <div className="pm-orbit-satellite"></div>
        </div>

        <div className="pm-emblem-wrap">
          <div className="pm-sheen-layer"></div>

          <img src={logoSrc} alt="" className="pm-badge-img" />
          <div class="pm-glint pm-glint-1">✦</div>
          <div class="pm-glint pm-glint-2">✦</div>
        </div>

        <div class="pm-brand-info">
          <h1 class="pm-title">PAVÉS MEDELLÍN</h1>
        </div>

        <div class="pm-progress-container">
          <div class="pm-track">
            <div class="pm-fill"></div>
          </div>
          <div class="pm-status-row">
            <span class="pm-status-label">{text}
              <span class="pm-dots-indicator"><span>•</span><span>•</span><span>•</span><span>•</span></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;


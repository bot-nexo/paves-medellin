import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const CustomizationModal = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  adiciones,
  bebidas,
}) => {
  const [selectedAdiciones, setSelectedAdiciones] = useState([]);
  const [selectedSalsas, setSelectedSalsas] = useState(["Todo"]);
  const [observaciones, setObservaciones] = useState("");
  const [productOption, setProductOption] = useState("");

  // Update state when modal opens or product changes (especially for editing)
  useEffect(() => {
    if (isOpen && product) {
      console.log("product", product);
      console.log("adiciones", adiciones);
      console.log("bebidas", bebidas);
      const tempAd = adiciones.filter((ad) => ad.category === product.name);
      const tempBeb = bebidas.filter((ad) => ad.category === product.name);
      console.log("tempAd", tempAd);
      console.log("tempBeb", tempBeb);
      if (product.customizations) {
        // We are editing
        setSelectedAdiciones(product.customizations.adiciones || []);
        setSelectedSalsas(product.customizations.salsas || ["Todo"]);
        setObservaciones(product.customizations.observaciones || "");
        setProductOption(product.customizations.option || "");
      } else {
        // New item
        setSelectedAdiciones([]);
        setSelectedSalsas(["Todo"]);
        setObservaciones("");
        setProductOption("");
      }
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  //********************* */
  const handleToggleAdicion = (adicion) => {
    setSelectedAdiciones((prev) =>
      prev.find((a) => a.id === adicion.id)
        ? prev.filter((a) => a.id !== adicion.id)
        : [...prev, adicion],
    );
  };

  const handleToggleSalsa = (salsa) => {
    if (salsa === "Todo") {
      setSelectedSalsas(["Todo"]);
      return;
    }
    if (salsa === "Sin salsas") {
      setSelectedSalsas(["Sin salsas"]);
      return;
    }

    setSelectedSalsas((prev) => {
      const filtered = prev.filter((s) => s !== "Todo" && s !== "Sin salsas");
      return filtered.includes(salsa)
        ? filtered.filter((s) => s !== salsa)
        : [...filtered, salsa];
    });
  };

  const handleConfirm = () => {
    if (product.options && !productOption) {
      Swal.fire({
        title: "¡Atención!",
        text: `Por favor elige una opción de: ${product.options.title}`,
        icon: "warning",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }

    onConfirm(product, {
      adiciones: selectedAdiciones,
      salsas: selectedSalsas,
      observaciones: observaciones,
      option: productOption,
    });
    // Reset state for next time
    setSelectedAdiciones([]);
    setSelectedSalsas(["Todo"]);
    setObservaciones("");
    setProductOption("");
    onClose();
  };

  //********************* */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-modal-header">
          <div className="header-info">
            <h3>{product.name}</h3>
            <p className="product-base-desc">{product.description}</p>
          </div>
        </div>

        <div className="custom-modal-body">
          {/* Section for mandatory options (e.g. Meat Choice) */}
          {product.options && (
            <div className="custom-section compact">
              <h4>{product.options.title} *</h4>
              <div className="tags-container">
                {product.options.map((c) => (
                  <button
                    key={c}
                    className={`tag-btn choice-btn ${productOption === c ? "active" : ""}`}
                    onClick={() => setProductOption(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.category === "hamburguesas" && (
            <>
              <div className="custom-section">
                <h4>Adiciones</h4>
                <div className="options-grid">
                  {adiciones.map((ad) => (
                    <label
                      key={ad.id}
                      className={`option-card ${selectedAdiciones.find((a) => a.id === ad.id) ? "active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        onChange={() => handleToggleAdicion(ad)}
                        checked={
                          !!selectedAdiciones.find((a) => a.id === ad.id)
                        }
                      />
                      <div className="option-info">
                        <span className="option-name">{ad.name}</span>
                        <span className="option-price">+{ad.price}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* <div className="custom-section">
                <h4>Salsas / Vegetales</h4>
                <div className="tags-container">
                  {salsasOptions.map((s) => (
                    <button
                      key={s}
                      className={`tag-btn ${selectedSalsas.includes(s) ? "active" : ""}`}
                      onClick={() => handleToggleSalsa(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div> */}
            </>
          )}

          <div className="custom-section">
            <h4>
              {product.category === "bebidas"
                ? "Notas"
                : "Observaciones especiales"}
            </h4>
            <textarea
              placeholder={
                product.category === "bebidas"
                  ? "Ej: Muy fría, con pitillo..."
                  : "Ej: Término de la carne, sin algún ingrediente específico..."
              }
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </div>
        </div>

        <div className="custom-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-confirm-add" onClick={handleConfirm}>
            {product.customizations ? "Guardar Cambios" : "Agregar al Carrito"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;

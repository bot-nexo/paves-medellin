import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { X, Check } from "lucide-react";
import "../css/CustomizationModal.css";

const CustomizationModal = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  // Estados para las selecciones de toppings, adiciones u opciones
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (isOpen && product) {
      if (product.customizations) {
        // Modo Edición
        setSelectedOptions(product.customizations.options || {});
        setSelectedToppings(product.customizations.toppings || []);
        setObservaciones(product.customizations.observaciones || "");
      } else {
        // Modo Nuevo Item (Resetear)
        setSelectedOptions({});
        setSelectedToppings([]);
        setObservaciones("");
      }
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Extraer nombre, descripción y precio con fallbacks
  const productName = product.nombre || product.name || "Postre";
  const productDescription = product.descripcion || product.description || "";
  const basePrice = product.precio ?? product.price ?? 0;

  // Formateador de precios en COP
  const formatCOP = (val) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

  // Manejar selección tipo Radio (Opciones únicas)
  const handleSelectRadioOption = (groupName, item) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupName]: item,
    }));
  };

  // Manejar selección tipo Checkbox (Toppings/Adiciones múltiples)
  const handleToggleTopping = (topping) => {
    const toppingName = typeof topping === "string" ? topping : topping.nombre || topping.name;

    setSelectedToppings((prev) => {
      const exists = prev.some((t) => (typeof t === "string" ? t === toppingName : t.nombre === toppingName || t.name === toppingName));
      if (exists) {
        return prev.filter((t) => (typeof t === "string" ? t !== toppingName : t.nombre !== toppingName && t.name !== toppingName));
      } else {
        return [...prev, topping];
      }
    });
  };

  // Calcular precio total incluyendo adiciones
  const calculateTotalPrice = () => {
    let extra = 0;

    // Sumar opciones tipo radio
    Object.values(selectedOptions).forEach((opt) => {
      extra += (opt.precio || opt.price || 0);
    });

    // Sumar toppings/adiciones
    selectedToppings.forEach((top) => {
      if (typeof top === "object") {
        extra += (top.precio || top.price || 0);
      }
    });

    return basePrice + extra;
  };

  const handleConfirm = () => {
    // Validar selecciones obligatorias si existen en el producto
    const productOptions = product.options || {};
    for (const groupName in productOptions) {
      if (groupName !== "adiciones" && groupName !== "toppings" && !selectedOptions[groupName]) {
        Swal.fire({
          title: "¡Atención!",
          text: `Por favor elige una opción de: ${groupName.toUpperCase()}`,
          icon: "warning",
          confirmButtonColor: "#3D2314",
        });
        return;
      }
    }

    // Confirmar y pasar producto personalizado
    onConfirm(product, {
      options: selectedOptions,
      toppings: selectedToppings,
      observaciones: observaciones,
      precioCalculado: calculateTotalPrice(),
    });

    onClose();
  };

  const productOptions = product.options || {};
  const productToppings = product.toppings || productOptions.adiciones || productOptions.toppings || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Cabecera */}
        <div className="custom-modal-header">
          <div className="header-info">
            <h3>{productName}</h3>
            <p className="product-base-desc">{productDescription}</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="custom-modal-body">
          {/* 1. SECCIONES DE OPCIONES ÚNICAS (Si aplica) */}
          {Object.keys(productOptions).map((groupName) => {
            if (groupName === "adiciones" || groupName === "toppings") return null;

            const items = productOptions[groupName];
            return (
              <div key={groupName} className="custom-section">
                <h4 style={{ textTransform: "capitalize" }}>{groupName} *</h4>
                <div className="options-grid">
                  {items.map((item) => {
                    const itemName = item.nombre || item.name;
                    const itemPrice = item.precio || item.price || 0;
                    const isSelected = selectedOptions[groupName]?.id === item.id;

                    return (
                      <label
                        key={item.id || itemName}
                        className={`option-card ${isSelected ? "active" : ""}`}
                      >
                        <input
                          type="radio"
                          name={groupName}
                          onChange={() => handleSelectRadioOption(groupName, item)}
                          checked={isSelected}
                        />
                        <div className="option-info">
                          <span className="option-name">{itemName}</span>
                          {itemPrice > 0 && (
                            <span className="option-price">+{formatCOP(itemPrice)}</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 2. SECCIÓN DE TOPPINGS Y ADICIONES MÚLTIPLES */}
          {productToppings.length > 0 && (
            <div className="custom-section">
              <h4>Toppings & Adiciones Extra</h4>
              <div className="options-grid">
                {productToppings.map((topping, idx) => {
                  const toppingName = typeof topping === "string" ? topping : topping.nombre || topping.name;
                  const toppingPrice = typeof topping === "object" ? topping.precio || topping.price || 0 : 0;

                  const isChecked = selectedToppings.some((t) =>
                    typeof t === "string" ? t === toppingName : t.nombre === toppingName || t.name === toppingName
                  );

                  return (
                    <label
                      key={idx}
                      className={`option-card ${isChecked ? "active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        onChange={() => handleToggleTopping(topping)}
                        checked={isChecked}
                      />
                      <div className="option-info">
                        <span className="option-name">{toppingName}</span>
                        {toppingPrice > 0 && (
                          <span className="option-price">+{formatCOP(toppingPrice)}</span>
                        )}
                      </div>
                      {isChecked && <Check size={16} className="check-icon" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. OBSERVACIONES Y NOTAS */}
          <div className="custom-section">
            <h4>Observaciones especiales</h4>
            <textarea
              placeholder="Ej: Sin queso rallado, extra lecherita, enviar bien frío..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="custom-modal-footer">
          <button className="btn-cancel" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="btn-confirm-add" onClick={handleConfirm} type="button">
            {product.customizations ? "Guardar Cambios" : `Agregar (${formatCOP(calculateTotalPrice())})`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomizationModal;
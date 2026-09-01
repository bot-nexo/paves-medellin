import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const CheckoutModal = ({ isOpen, onClose, onConfirm, cart }) => {
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    unidad: "",
    apto: "",
    pago: "Efectivo",
    observaciones: "",
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper seguro para limpiar "$19 K" o "1.5 K" -> valor numérico real
  const parsePrice = (priceStr) => {
    if (!priceStr || priceStr === "0" || priceStr === 0) return 0;
    if (typeof priceStr === "number") return priceStr * 1000;

    const cleanNumber = priceStr.replace(/[^\d.]/g, "");
    const number = parseFloat(cleanNumber);

    return isNaN(number) ? 0 : number * 1000;
  };

  // CORRECCIÓN 1: Cálculo dinámico del total general para el Checkout
  const total = cart.reduce((acc, item) => {
    let itemPrice = parsePrice(item.price);

    if (item.customizations) {
      // Sumar precios de las opciones (huevos, carnes, términos, etc.)
      Object.keys(item.customizations.options || {}).forEach((groupName) => {
        const selection = item.customizations.options[groupName];
        if (selection) itemPrice += parsePrice(selection.price);
      });

      // Sumar precio de la bebida
      if (item.customizations.bebida) {
        itemPrice += parsePrice(item.customizations.bebida.price);
      }
    }

    return acc + itemPrice * item.quantity;
  }, 0);

  // CORRECCIÓN 2: Calcular el precio total de una tarjeta de producto individual
  const calculateItemSubtotal = (item) => {
    let itemPrice = parsePrice(item.price);

    if (item.customizations) {
      Object.keys(item.customizations.options || {}).forEach((groupName) => {
        const selection = item.customizations.options[groupName];
        if (selection) itemPrice += parsePrice(selection.price);
      });

      if (item.customizations.bebida) {
        itemPrice += parsePrice(item.customizations.bebida.price);
      }
    }

    return (itemPrice * item.quantity) / 1000;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (
      !formData.nombre ||
      !formData.telefono ||
      !formData.direccion ||
      !formData.apto ||
      !formData.pago
    ) {
      Swal.fire({
        title: "Campos incompletos",
        text: "Por favor completa todos los campos obligatorios para la entrega.",
        icon: "error",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }
    setStep(2);
  };

  const handleSubmit = () => {
    onConfirm(formData);
    setStep(1);
    setFormData({
      nombre: "",
      telefono: "",
      direccion: "",
      unidad: "",
      apto: "",
      pago: "Efectivo",
      observaciones: "",
    });
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="checkout-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="custom-modal-header">
          <h3>{step === 1 ? "Datos de Entrega" : "Confirmar Pedido"}</h3>
          <p className="step-indicator">Paso {step} de 2</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext} className="checkout-form">
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="¿A quién entregamos?"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Teléfono *</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Tu contacto"
                  required
                />
              </div>
              <div className="form-group">
                <label>Medio de Pago *</label>
                <select
                  name="pago"
                  value={formData.pago}
                  onChange={handleChange}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia (Bancolombia/Nequi)">
                    Transferencia
                  </option>
                  <option value="Datáfono">Datáfono</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Dirección Exacta *</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Calle, Carrera, Barrio..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Unidad / Edificio</label>
                <input
                  type="text"
                  name="unidad"
                  value={formData.unidad}
                  onChange={handleChange}
                  placeholder="Nombre (si aplica)"
                />
              </div>
              <div className="form-group">
                <label>Apto / Casa / Piso *</label>
                <input
                  type="text"
                  name="apto"
                  value={formData.apto}
                  onChange={handleChange}
                  placeholder="Ej: Apto 502"
                  required
                />
              </div>
            </div>

            <div className="form-row-txt ">
              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  rows={3}
                  value={formData.observaciones}
                  onChange={handleChange}
                  placeholder="Ej: Entrega en la portería"
                />
              </div>
            </div>

            <div className="checkout-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-confirm-order">
                Revisar Pedido <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </form>
        ) : (
          <div className="order-summary-step">
            <div className="summary-section">
              <h4>¿La información es correcta?</h4>
              <div className="summary-card delivery-info">
                <p>
                  <strong>Entregar a:</strong> {formData.nombre}
                </p>
                <p>
                  <strong>Teléfono:</strong> {formData.telefono}
                </p>
                <p>
                  <strong>Dirección:</strong> {formData.direccion}
                  {formData.unidad && `, ${formData.unidad}`}
                  {`, ${formData.apto}`}
                </p>
                <p>
                  <strong>Pago:</strong> {formData.pago}
                </p>
                {formData.observaciones && (
                  <p>
                    <strong>Nota:</strong> {formData.observaciones}
                  </p>
                )}
              </div>
            </div>

            <div className="summary-section">
              <h4>Tu Pedido</h4>
              <div className="summary-card order-items-summary">
                {cart.map((item, idx) => (
                  <div key={idx} className="summary-item">
                    <span className="qty">{item.quantity}x</span>
                    <div className="name-container" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <span className="name">{item.name}</span>
                      {item.customizations && (
                        <small style={{ color: "#777", fontSize: "0.8rem", lineHeight: "1.2" }}>
                          {Object.keys(item.customizations.options || {}).map(k => item.customizations.options[k]?.name).filter(Boolean).join(", ")}
                          {item.customizations.bebida && ` + Bebida: ${item.customizations.bebida.name}${item.customizations.bebida.sabor ? ` (${item.customizations.bebida.sabor})` : ""}`}
                        </small>
                      )}
                    </div>
                    {/* CORRECCIÓN 3: Desglose de precio unitario usando el helper */}
                    <span className="price">
                      ${calculateItemSubtotal(item).toLocaleString()} K
                    </span>
                  </div>
                ))}
                {(() => {
                  // Configuración de tu negocio en Andes
                  const VALOR_DOMICILIO = 2500; // $2.5 K
                  const MINIMO_ENVIO_GRATIS = 40000; // $40 K

                  // total viene del reduce que ya corregimos (es el valor total de los platos)
                  const esGratis = total >= MINIMO_ENVIO_GRATIS;
                  const totalNetoAPagar = esGratis ? total : total + VALOR_DOMICILIO;

                  return (
                    <div className="summary-total-container" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>

                      {/* Desglose de cuentas claras */}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "#555" }}>
                        <span>Subtotal platos:</span>
                        <span>${(total / 1000).toLocaleString()} K</span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "#555" }}>
                        <span>Domicilio:</span>
                        <span style={{ color: esGratis ? "#137333" : "var(--primary)", fontWeight: "600" }}>
                          {esGratis ? "GRATIS" : `$${(VALOR_DOMICILIO / 1000).toLocaleString()} K`}
                        </span>
                      </div>

                      <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "4px 0" }} />

                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "1.1rem", color: "var(--dark)" }}>
                        <span>Total a Pagar:</span>
                        <span>${(totalNetoAPagar / 1000).toLocaleString()} K</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="checkout-footer">
              <button type="button" className="btn-cancel" onClick={handleBack}>
                <i className="fas fa-arrow-left"></i> Editar Datos
              </button>
              <button
                type="button"
                className="btn-confirm-order final-confirm"
                onClick={handleSubmit}
              >
                <i className="fab fa-whatsapp"></i> Enviar Pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
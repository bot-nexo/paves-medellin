import React, { useState } from "react";
import { User, Phone, Sparkles, Calendar, ArrowRight, X } from "lucide-react";
import "../css/CustomerIdentifyModal.css";

const CustomerIdentifyModal = ({ isOpen, onClose, onSaveCustomer, currentCustomer = null }) => {
  const [nombre, setNombre] = useState(currentCustomer?.nombre || "");
  const [telefono, setTelefono] = useState(currentCustomer?.telefono || "");
  const [fechaCumple, setFechaCumple] = useState(currentCustomer?.fecha_cumple || "");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanNombre = nombre.trim();
    const cleanPhone = telefono.replace(/\D/g, "");

    if (!cleanNombre) {
      setErrorMsg("Por favor ingresa tu nombre completo.");
      return;
    }

    if (!cleanPhone || cleanPhone.length < 7) {
      setErrorMsg("Por favor ingresa un número de celular / WhatsApp válido.");
      return;
    }

    onSaveCustomer({ nombre: cleanNombre, telefono: cleanPhone, fecha_cumple: fechaCumple || null });
  };

  return (
    <div className="customer-modal-backdrop" onClick={onClose}>
      <div className="customer-modal-card" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button
            type="button"
            className="customer-modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        )}

        <div className="customer-modal-header">
          <div className="customer-modal-icon-badge">
            <Sparkles size={24} className="text-[#ffcc00]" />
          </div>
          <h2 className="customer-modal-title">
            ¡Bienvenido a Pavés Medellín! 🍰
          </h2>
          <p className="customer-modal-subtitle">
            Ingresa tu nombre y WhatsApp para consultar tu historial, pedidos acumulados e insignias en tiempo real desde la base de datos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="customer-modal-form">
          {errorMsg && <div className="customer-modal-error">{errorMsg}</div>}

          <div className="customer-field-group">
            <label className="customer-field-label">Nombre Completo *</label>
            <div className="customer-input-wrap">
              <User size={18} className="customer-input-icon" />
              <input
                type="text"
                className="customer-input"
                placeholder="Ej. Juan Carlos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          </div>

          <div className="customer-field-group">
            <label className="customer-field-label">Teléfono Celular / WhatsApp *</label>
            <div className="customer-input-wrap">
              <Phone size={18} className="customer-input-icon" />
              <input
                type="tel"
                className="customer-input"
                placeholder="Ej. 3001234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <span className="customer-field-hint">
              🔒 Tu número de WhatsApp es tu identificador único en la BD real.
            </span>
          </div>

          <div className="customer-field-group">
            <label className="customer-field-label">Fecha de Cumpleaños (Opcional) 🎂</label>
            <div className="customer-input-wrap">
              <Calendar size={18} className="customer-input-icon" />
              <input
                type="date"
                className="customer-input"
                value={fechaCumple}
                onChange={(e) => setFechaCumple(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="customer-submit-btn">
            <span>Validar e Ingresar</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="customer-skip-btn"
          >
            Ver menú como invitado (Sin registrarme)
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerIdentifyModal;

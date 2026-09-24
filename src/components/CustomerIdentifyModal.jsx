import React, { useState, useEffect } from "react";
import { User, Phone, Sparkles, Calendar, ArrowRight, ArrowLeft, X, CheckCircle2, Loader2 } from "lucide-react";
import "../css/CustomerIdentifyModal.css";
import { findCustomerByPhone } from "../data/dataSource";

const CustomerIdentifyModal = ({ isOpen, onClose, onSaveCustomer, currentCustomer = null }) => {
  const [step, setStep] = useState(1);
  const [telefono, setTelefono] = useState(currentCustomer?.telefono || "");
  const [nombre, setNombre] = useState(currentCustomer?.nombre || "");
  const [fechaCumple, setFechaCumple] = useState(currentCustomer?.fecha_cumple || "");
  const [isChecking, setIsChecking] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg("");
      setWelcomeName("");
      setIsChecking(false);
      setTelefono(currentCustomer?.telefono || "");
      setNombre(currentCustomer?.nombre || "");
      setFechaCumple(currentCustomer?.fecha_cumple || "");
    }
  }, [isOpen, currentCustomer]);

  if (!isOpen) return null;

  // Paso 1: Validar únicamente el teléfono en Supabase DB
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanPhone = telefono.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 7) {
      setErrorMsg("Por favor ingresa un número de celular / WhatsApp válido.");
      return;
    }

    setIsChecking(true);
    try {
      const dbCust = await findCustomerByPhone(cleanPhone);
      setIsChecking(false);

      if (dbCust) {
        // EL CLIENTE YA EXISTE EN LA BD -> Ingresa derecho automáticamente
        setWelcomeName(dbCust.nombre || "Cliente");
        const fullCust = {
          nombre: dbCust.nombre,
          telefono: dbCust.telefono || cleanPhone,
          fecha_cumple: dbCust.fecha_cumple || null,
          pedidos_count: dbCust.pedidos_count ?? dbCust.cant_pedidos_concretados ?? 0,
        };

        // Guardar cliente e ingresar al menú sin pedir más datos
        setTimeout(() => {
          onSaveCustomer(fullCust);
        }, 500);
      } else {
        // EL CLIENTE NO EXISTE -> Pasar a Paso 2 para solicitar Nombre y Cumpleaños
        setStep(2);
      }
    } catch (err) {
      console.warn("Error buscando cliente:", err);
      setIsChecking(false);
      setStep(2);
    }
  };

  // Paso 2: Registrar nuevo cliente con Nombre y Cumpleaños
  const handleRegisterNewCustomer = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanNombre = nombre.trim();
    const cleanPhone = telefono.replace(/\D/g, "");

    if (!cleanNombre) {
      setErrorMsg("Por favor ingresa tu nombre completo para continuar.");
      return;
    }

    onSaveCustomer({
      nombre: cleanNombre,
      telefono: cleanPhone,
      fecha_cumple: fechaCumple || null,
    });
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
            {step === 1 ? "¡Bienvenido a Pavés Medellín! 🍰" : "¡Es tu primera vez con nosotros! 🎉"}
          </h2>
          <p className="customer-modal-subtitle">
            {step === 1
              ? "Ingresa tu número de WhatsApp para consultar tu perfil o ingresar al menú."
              : "No encontramos registros previos con este número. Completa tu nombre para crear tu perfil."}
          </p>
        </div>

        {welcomeName ? (
          <div className="customer-welcome-banner">
            <CheckCircle2 size={24} color="#10b981" />
            <div>
              <h4>¡Hola, {welcomeName}!</h4>
              <p>Te identificamos con éxito. Ingresando al menú...</p>
            </div>
          </div>
        ) : step === 1 ? (
          /* ── PASO 1: SOLICITAR SOLO TELÉFONO ───────────────────────────── */
          <form onSubmit={handleVerifyPhone} className="customer-modal-form">
            {errorMsg && <div className="customer-modal-error">{errorMsg}</div>}

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
                  autoFocus
                />
              </div>
              <span className="customer-field-hint">
                🔒 Tu número de WhatsApp es tu identificador único en la BD.
              </span>
            </div>

            <button type="submit" className="customer-submit-btn" disabled={isChecking}>
              {isChecking ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Validando en la BD...</span>
                </>
              ) : (
                <>
                  <span>Validar e Ingresar</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button type="button" onClick={onClose} className="customer-skip-btn">
              Ver menú como invitado (Sin registrarme)
            </button>
          </form>
        ) : (
          /* ── PASO 2: SOLICITAR NOMBRE Y CUMPLEAÑOS (NUEVO CLIENTE) ─────── */
          <form onSubmit={handleRegisterNewCustomer} className="customer-modal-form">
            {errorMsg && <div className="customer-modal-error">{errorMsg}</div>}

            <div className="customer-phone-pill">
              <Phone size={14} />
              <span>{telefono}</span>
              <button type="button" onClick={() => setStep(1)} className="customer-phone-change-btn">
                Cambiar
              </button>
            </div>

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
                  autoFocus
                />
              </div>
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
              <span>Completar Registro e Ingresar</span>
              <Sparkles size={16} />
            </button>

            <button type="button" onClick={() => setStep(1)} className="customer-skip-btn">
              <ArrowLeft size={14} style={{ display: "inline", marginRight: "4px" }} />
              Volver atrás
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerIdentifyModal;

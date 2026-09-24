import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  X,
  User,
  Phone,
  CreditCard,
  MapPin,
  Building,
  Home,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Send,
  Clock,
  Store,
  Check
} from "lucide-react";
import { FaMotorcycle, FaWhatsapp } from "react-icons/fa";
import "../css/CheckoutModal.css";
import {
  formatCOP,
  calculateItemUnitPrice,
  calculateOrderSummary,
} from "../utils/price";
import { info as infoLocal, VALOR_DOMICILIO_DEFAULT } from "../data/menu";
import { getPaymentMethods } from "../data/dataSource";

// settings llega del dataSource vía useCatalog (App.jsx); fee/umbral configurables
const CheckoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  cart = [],
  settings = infoLocal,
  design = {},
  estadoNegocio = null,
}) => {
  const [step, setStep] = useState(1);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    tipoEntrega: settings.offersDelivery !== false ? "domicilio" 
                 : settings.offersLocal !== false ? "local" 
                 : "recogida",
    direccion: "",
    unidad: "",
    apto: "",
    pago: "",
    observaciones: "",
  });

  useEffect(() => {
    if (isOpen) {
      getPaymentMethods().then(methods => {
        setPaymentMethods(methods);
        if (methods.length > 0 && !methods.find(m => m.nombre === formData.pago)) {
          setFormData(prev => ({ ...prev, pago: methods[0].nombre }));
        } else if (methods.length === 0) {
          setFormData(prev => ({ ...prev, pago: "" }));
        }
      });
    }
  }, [isOpen]);

  const esDomicilio = formData.tipoEntrega === "domicilio";
  const esLocal = formData.tipoEntrega === "local";
  const textoModalidad = esDomicilio ? 'Domicilio' : esLocal ? 'Local' : 'Recoger en tienda';

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      try {
        const savedCust = sessionStorage.getItem("paves_customer_info") || localStorage.getItem("paves_customer_info");
        if (savedCust) {
          const cust = JSON.parse(savedCust);
          setFormData((prev) => ({
            ...prev,
            nombre: prev.nombre || cust.nombre || "",
            telefono: prev.telefono || cust.telefono || "",
          }));
        }
      } catch {
        /* noop */
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const {
    subtotal: totalProductos,
    esGratis,
    totalNeto: totalNetoAPagar,
  } = calculateOrderSummary(cart, settings?.deliveryFee, settings?.freeDeliveryThreshold, esDomicilio);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (paymentMethods.length === 0) {
      Swal.fire({
        title: "Sin métodos de pago",
        text: "No se puede continuar con la compra porque no hay métodos de pago configurados. Por favor intenta más tarde o contacta al negocio.",
        icon: "warning",
        confirmButtonColor: "#ffcc00",
        customClass: { popup: "saborio-swal-dark" }
      });
      return;
    }

    const faltantes =
      !formData.nombre.trim() ||
      !formData.telefono.trim() ||
      !formData.pago ||
      (esDomicilio && (!formData.direccion.trim() || !formData.apto.trim()));
    if (faltantes) {
      Swal.fire({
        title: "Campos incompletos",
        text: esDomicilio
          ? "Por favor completa los campos obligatorios para continuar."
          : "Nombre, teléfono y medio de pago son obligatorios.",
        icon: "warning",
        confirmButtonColor: "#3D2314",
      });
      return;
    }
    setStep(2);
  };

  const handleSubmit = () => {
    onConfirm({ ...formData, observaciones: formData.observaciones || "" });
    setStep(1);
    setFormData((prev) => ({
      nombre: "",
      telefono: "",
      tipoEntrega: prev.tipoEntrega,
      direccion: "",
      unidad: "",
      apto: "",
      pago: "Efectivo",
      observaciones: "",
    }));
  };

  return (
    <div className="checkout-overlay" onClick={onClose} style={{ 
      "--color-primario": design?.color_primario || "#ffcc00",
      "--color-fondo": design?.color_fondo || "#171717",
      "--color-texto": design?.color_texto || "#f5f5f5"
    }}>
      <div className="checkout-container" onClick={(e) => e.stopPropagation()}>
        
        {/* -- ENCABEZADO -- */}
        <div className="checkout-top-bar">
          <div className="checkout-top-title">
            <span className="brand-name">PAVÉS</span>
            <h3>Finalizar Pedido</h3>
          </div>
          
          <div className="checkout-stepper">
            <div className={`step ${step >= 1 ? "active" : ""}`}>
              <span className="step-num">{step > 1 ? <Check size={12} /> : "1"}</span> 
              <span className="step-text">Datos & Pago</span>
            </div>
            <div className="step-divider"></div>
            <div className={`step ${step >= 2 ? "active" : ""}`}>
              <span className="step-num">2</span> 
              <span className="step-text">Confirmación</span>
            </div>
          </div>

          <button className="btn-close-checkout" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {/* -- CONTENIDO DIVIDIDO -- */}
        <div className="checkout-layout">
          
          {/* COLUMNA IZQUIERDA: Formularios / Confirmación */}
          <div className="checkout-left-panel">
            {estadoNegocio && !estadoNegocio.abierto && (
              <div className="checkout-aviso-cerrado">
                <Clock size={16} />
                <span>
                  <strong>Estamos cerrados ahora</strong>
                  {estadoNegocio.horarioTexto ? ` (${estadoNegocio.horarioTexto})` : ""}. Tu pedido se agendará.
                </span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNext} className="checkout-form">
                <div className="form-section-title">
                  <span className="section-num">1</span>
                  <h4>¿Dónde entregamos tu pedido?</h4>
                </div>
                
                <div className="form-grid">
                  {(settings.offersDelivery !== false || settings.offersPickup !== false || settings.offersLocal !== false) && (
                    <div className="form-group full-width">
                      <div className="entrega-options">
                        {settings.offersDelivery !== false && (
                          <button
                            type="button"
                            className={`entrega-option ${esDomicilio ? "entrega-option--activa" : ""}`}
                            onClick={() => setFormData((p) => ({ ...p, tipoEntrega: "domicilio" }))}
                          >
                            <FaMotorcycle size={18} />
                            <span>Domicilio</span>
                          </button>
                        )}
                        {settings.offersPickup !== false && (
                          <button
                            type="button"
                            className={`entrega-option ${formData.tipoEntrega === "recogida" ? "entrega-option--activa" : ""}`}
                            onClick={() => setFormData((p) => ({ ...p, tipoEntrega: "recogida" }))}
                          >
                            <Store size={18} />
                            <span>Recoger</span>
                          </button>
                        )}
                        {settings.offersLocal !== false && (
                          <button
                            type="button"
                            className={`entrega-option ${esLocal ? "entrega-option--activa" : ""}`}
                            onClick={() => setFormData((p) => ({ ...p, tipoEntrega: "local" }))}
                          >
                            <User size={18} />
                            <span>Local</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label>Nombre y Apellido *</label>
                    <div className="input-with-icon">
                      <User size={16} className="input-icon" />
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Carolina Restrepo" required />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Teléfono Celular / WhatsApp *</label>
                    <div className="input-with-icon">
                      <Phone size={16} className="input-icon" />
                      <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 310 123 4567" required />
                    </div>
                    <small className="input-hint"><FaWhatsapp style={{display: "inline", marginRight: "4px"}} color="#25D366" />Te contactaremos a este número para confirmar tu entrega.</small>
                  </div>

                  {esDomicilio && (
                    <>
                      <div className="form-group full-width">
                        <label>Dirección Principal *</label>
                        <div className="input-with-icon">
                          <MapPin size={16} className="input-icon" />
                          <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Ej: Carrera 50 # 49 - 20, Barrio San Pedro" required />
                        </div>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group half-width">
                          <label>Unidad / Edificio (opcional)</label>
                          <div className="input-with-icon">
                            <Building size={16} className="input-icon" />
                            <input type="text" name="unidad" value={formData.unidad} onChange={handleChange} placeholder="Ej: Edificio Los Pinos" />
                          </div>
                        </div>
                        <div className="form-group half-width">
                          <label>Apto / Casa / Piso *</label>
                          <div className="input-with-icon">
                            <Home size={16} className="input-icon" />
                            <input type="text" name="apto" value={formData.apto} onChange={handleChange} placeholder="Ej: Apto 302" required />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group full-width">
                    <label>Indicaciones para el repartidor (opcional)</label>
                    <div className="input-with-icon textarea-icon">
                      <MessageSquare size={16} className="input-icon" />
                      <textarea name="observaciones" rows={2} value={formData.observaciones} onChange={handleChange} placeholder="Ej: Dejar en portería, timbrar dos veces..." />
                    </div>
                  </div>
                </div>

                <div className="form-section-title" style={{ marginTop: "2rem" }}>
                  <span className="section-num">2</span>
                  <h4>Método de Pago *</h4>
                </div>

                <div className="payment-options">
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map(method => (
                      <label key={method.id} className={`payment-card ${formData.pago === method.nombre ? "selected" : ""}`}>
                        <input type="radio" name="pago" value={method.nombre} checked={formData.pago === method.nombre} onChange={handleChange} required />
                        <div className="payment-icon-bg">
                          {method.icono === "Phone" ? <Phone size={20} /> : <CreditCard size={20} />}
                        </div>
                        <strong>{method.nombre}</strong>
                        {method.descripcion && <span>{method.descripcion}</span>}
                        {formData.pago === method.nombre && <CheckCircle size={16} className="check-icon" />}
                      </label>
                    ))
                  ) : (
                    <div className="checkout-aviso-cerrado" style={{ backgroundColor: "rgba(255, 60, 60, 0.1)", color: "#ff4d4d", margin: 0 }}>
                      <span>Actualmente no hay métodos de pago configurados.</span>
                    </div>
                  )}
                </div>

                <div className="checkout-footer form-actions">
                  <button type="button" className="btn-volver" onClick={onClose}>
                    <ArrowLeft size={16} /> Volver al Menú
                  </button>
                  <button type="submit" className="btn-continuar">
                    Revisar y Confirmar <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="checkout-confirmation-panel">
                <div className="confirm-banner">
                  <div className="confirm-icon-bg"><Check size={24} color="#fff" /></div>
                  <div className="confirm-banner-text">
                    <h4>¡Casi listo! Revisa tus datos de entrega</h4>
                    <p>Verifica que todo esté correcto antes de enviar tu pedido por WhatsApp.</p>
                  </div>
                </div>

                <div className="confirm-details-card">
                  <div className="confirm-detail-row">
                    <span className="detail-label"><User size={14} /> DESTINATARIO</span>
                    <strong className="detail-value">{formData.nombre}</strong>
                  </div>
                  
                  <div className="confirm-detail-row">
                    <span className="detail-label"><Phone size={14} /> CELULAR WHATSAPP</span>
                    <strong className="detail-value">{formData.telefono}</strong>
                  </div>

                  <div className="confirm-detail-row">
                    <span className="detail-label"><MapPin size={14} /> DIRECCIÓN DE ENTREGA</span>
                    <strong className="detail-value">
                      {esDomicilio ? `${formData.direccion}${formData.unidad ? `, ${formData.unidad}` : ''}, ${formData.apto}` : textoModalidad}
                    </strong>
                  </div>

                  <div className="confirm-detail-row">
                    <span className="detail-label"><CreditCard size={14} /> MEDIO DE PAGO</span>
                    <span className="payment-badge">{formData.pago}</span>
                  </div>
                </div>

                <div className="modify-section">
                  <span className="modify-text">¿Deseas cambiar algo en la entrega o el medio de pago?</span>
                  <button type="button" className="btn-modify" onClick={() => setStep(1)}>
                    Modificar datos
                  </button>
                </div>

                <div className="checkout-footer confirm-actions">
                  <button type="button" className="btn-volver" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} /> Volver a editar
                  </button>
                  <button type="button" className="btn-whatsapp-send" onClick={handleSubmit}>
                    <FaWhatsapp size={18} /> Enviar Pedido a WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: Resumen del Pedido */}
          <div className="checkout-right-panel">
            <div className="resumen-header">
              <h4>Resumen del Pedido</h4>
              <span className="items-count">{cart.reduce((acc, i) => acc + i.quantity, 0)} items</span>
            </div>

            <div className="resumen-items-list">
              {cart.map((item, idx) => {
                const itemUnitPrice = calculateItemUnitPrice(item);
                const itemSubtotal = itemUnitPrice * item.quantity;
                const itemName = item.nombre || "Postre";
                
                const customOptions = item.customizations ? [
                  ...Object.values(item.customizations.options || {}).map((o) => o?.nombre).filter(Boolean),
                  ...(item.customizations.toppings || []).map((t) => (typeof t === "string" ? t : t.nombre)).filter(Boolean),
                  ...Object.values(item.customizations.adiciones || {}).map((a) => a.nombre).filter(Boolean),
                  ...Object.values(item.customizations.salsas || {}).map((s) => s.nombre).filter(Boolean),
                ] : [];

                return (
                  <div key={idx} className="resumen-item">
                    <div className="resumen-item-qty">{item.quantity}x</div>
                    <div className="resumen-item-details">
                      <div className="resumen-item-title-price">
                        <span className="resumen-item-name">{itemName}</span>
                        <span className="resumen-item-price">{formatCOP(itemSubtotal)}</span>
                      </div>
                      {customOptions.length > 0 && (
                        <div className="resumen-item-customs">
                          {customOptions.map((opt, i) => (
                            <span key={i} className="resumen-custom-badge">{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="resumen-totals">
              <div className="totals-row">
                <span className="totals-label">Subtotal productos:</span>
                <span className="totals-value">{formatCOP(totalProductos)}</span>
              </div>
              <div className="totals-row">
                <span className="totals-label">Domicilio:</span>
                {!esDomicilio ? (
                  <span className="totals-value free">No aplica</span>
                ) : (
                  <span className={`totals-value ${esGratis ? "free" : ""}`}>
                    {esGratis ? "GRATIS" : formatCOP(settings.deliveryFee ?? VALOR_DOMICILIO_DEFAULT)}
                  </span>
                )}
              </div>
              
              <div className="totals-divider"></div>
              
              <div className="totals-row grand-total">
                <span className="totals-label">Total a Pagar:</span>
                <span className="totals-value highlighted">{formatCOP(totalNetoAPagar)}</span>
              </div>
            </div>

            <div className="resumen-guarantees">
              <div className="guarantee-item">
                <Clock size={12} color="#8a6652" />
                <span>Preparado al instante</span>
              </div>
              <div className="guarantee-item">
                <CheckCircle size={12} color="#8a6652" />
                <span>Pedido seguro por WhatsApp</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

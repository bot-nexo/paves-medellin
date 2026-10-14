import React, { useState, useEffect, useRef } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { FaMotorcycle } from "react-icons/fa";
import "../css/CheckoutModal.css";
import {
  formatCOP,
  calculateItemUnitPrice,
  calculateOrderSummary,
} from "../utils/price";
import { LuClipboardList, LuHandPlatter } from "react-icons/lu";

// settings llega del dataSource vía useCatalog (App.jsx); fee/umbral configurables
const CheckoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  cart = [],
  settings = {},
  estadoNegocio = null,
}) => {
  const [step, setStep] = useState(1);
  const bodyRef = useRef(null);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    tipoEntrega: settings.offersDelivery !== false ? "domicilio"
      : settings.offersLocal !== false ? "local"
        : "recogida",
    direccion: "",
    unidad: "",
    apto: "",
    pago: "Transferencia",
    observaciones: "",
  });

  const esDomicilio = formData.tipoEntrega === "domicilio";
  const esLocal = formData.tipoEntrega === "local";
  const textoModalidad = esDomicilio ? 'Domicilio' : esLocal ? 'Local' : 'Recoger en tienda';

  // Si Mapbox NO está activo/configurado, el domicilio se cotiza y paga por aparte (no en la app)
  const isDynamicDelivery = Boolean(
    settings?.dynamicDeliveryEnabled && settings?.storeLat && settings?.storeLng
  );
  const domicilioEsAparte = esDomicilio && !isDynamicDelivery;
  const [aceptoDomicilioSeparado, setAceptoDomicilioSeparado] = useState(false);

  //**************************************** */
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAceptoDomicilioSeparado(false);
      setTimeout(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setAceptoDomicilioSeparado(false);
  }, [formData.tipoEntrega]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step, formData.tipoEntrega]);

  if (!isOpen) return null;

  const {
    subtotal: totalProductos,
    esGratis,
    totalNeto: totalNetoAPagar,
  } = calculateOrderSummary(cart, 0, Infinity, esDomicilio);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
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
    if (domicilioEsAparte && !aceptoDomicilioSeparado) {
      Swal.fire({
        title: "Confirmación requerida",
        text: "Por favor marca la casilla indicando que aceptas que el valor del domicilio se cotiza y se paga por separado.",
        icon: "warning",
        confirmButtonColor: "#3D2314",
      });
      return;
    }

    let alertHtml = "";

    if (estadoNegocio && !estadoNegocio.abierto) {
      if (estadoNegocio.fuerzaCierre) {
        alertHtml += `<div style="text-align: left; margin-bottom: 15px; background: #fffbeb; padding: 10px 12px; border-radius: 8px; border: 1px solid #fde68a;">
          <h4 style="color: #b45309; margin-bottom: 4px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
            ⚠️ Cerrado temporalmente por eventualidad
          </h4>
          <p style="margin: 0; font-size: 0.9rem; color: #78350f; line-height: 1.4;">
            El negocio se encuentra pausado temporalmente por una eventualidad. Tu pedido se enviará agendado y se preparará con prioridad tan pronto reanudemos el servicio.
          </p>
        </div>`;
      } else {
        alertHtml += `<div style="text-align: left; margin-bottom: 15px; background: #fff5f5; padding: 10px 12px; border-radius: 8px; border: 1px solid #fed7d7;">
          <h4 style="color: #c53030; margin-bottom: 4px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
            ⏰ Fuera de horario de atención
          </h4>
          <p style="margin: 0; font-size: 0.9rem; color: #742a2a; line-height: 1.4;">
            Nos encontramos fuera del horario habitual${estadoNegocio.horarioTexto ? ` (${estadoNegocio.horarioTexto})` : ""}. Tu pedido se enviará agendado y se preparará al abrir en orden de llegada.
          </p>
        </div>`;
      }
    }

    if (domicilioEsAparte) {
      alertHtml += `<div style="text-align: left; margin-bottom: 15px; background: #fffbeb; padding: 11px 13px; border-radius: 8px; border: 1.5px solid #fde68a;">
        <h4 style="color: #b45309; margin-bottom: 5px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
          🛵 Domicilio NO incluido (Se paga aparte)
        </h4>
        <p style="margin: 0; font-size: 0.92rem; color: #78350f; line-height: 1.45;">
          El total mostrado corresponde <strong>únicamente a tus productos</strong>. El valor del domicilio <strong>NO es gratis</strong>; se cotizará según tu ubicación y deberás pagarlo por aparte.
        </p>
      </div>`;
    } else if (esDomicilio) {
      alertHtml += `<div style="text-align: left; margin-bottom: 15px;">
        <h4 style="color: #3d2314; margin-bottom: 5px; font-weight: 800;">🛵 Sobre tu Domicilio</h4>
        <p style="margin: 0; font-size: 0.95rem; color: #555; line-height: 1.4;">El valor del domicilio te lo cotizaremos y te lo haremos saber lo más pronto posible por WhatsApp.</p>
      </div>`;
    }

    if (formData.pago.includes("Transferencia")) {
      alertHtml += `<div style="text-align: left;">
        <h4 style="color: #3d2314; margin-bottom: 5px; font-weight: 800;">💳 Sobre tu Pago</h4>
        <p style="margin: 0; font-size: 0.95rem; color: #555; line-height: 1.4;">Recuerda que debes transferir a nuestras cuentas y enviarnos el comprobante por WhatsApp para hacer efectivo tu pedido.</p>
      </div>`;
    }

    if (alertHtml !== "") {
      Swal.fire({
        title: "¡Información Importante!",
        html: alertHtml,
        icon: "info",
        confirmButtonText: "Entendido, enviar pedido",
        confirmButtonColor: "#3D2314",
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          procesarPedido();
        }
      });
    } else {
      procesarPedido();
    }
  };

  const procesarPedido = () => {
    // tipoEntrega y observaciones viajan con los datos (quedan en la BD del pedido)
    onConfirm({ ...formData, observaciones: formData.observaciones || "" });
    setStep(1);
    setFormData((prev) => ({
      nombre: "",
      telefono: "",
      tipoEntrega: prev.tipoEntrega,
      direccion: "",
      unidad: "",
      apto: "",
      pago: prev.pago,
      observaciones: "",
    }));
  };

  //******************************** */
  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-container" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <div>
            <h3>{step === 1 ? "Datos de Entrega" : "Confirmar Pedido"}</h3>
            <p className="checkout-subtitle">Paso {step} de 2</p>
          </div>
          <button className="btn-close-checkout" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <div className="checkout-progress-bar">
          <div className={`progress-step ${step >= 1 ? "active" : ""}`} />
          <div className={`progress-step ${step >= 2 ? "active" : ""}`} />
        </div>

        {/* Aviso dinámico según el estado del negocio */}
        {estadoNegocio && !estadoNegocio.abierto && (
          <div className={`checkout-aviso-cerrado ${estadoNegocio.fuerzaCierre ? "checkout-aviso-cerrado--eventualidad" : ""}`}>
            {estadoNegocio.fuerzaCierre ? (
              <>
                <AlertTriangle size={18} />
                <div>
                  <strong style={{ display: "block", marginBottom: "2px" }}>
                    Cerrado temporalmente por eventualidad
                  </strong>
                  <span>
                    El servicio está pausado temporalmente por una eventualidad. Tu pedido quedará agendado y se preparará con prioridad tan pronto reanudemos la atención.
                  </span>
                </div>
              </>
            ) : (
              <>
                <Clock size={18} />
                <div>
                  <strong style={{ display: "block", marginBottom: "2px" }}>
                    Estamos cerrados ahora (Fuera de horario)
                  </strong>
                  <span>
                    {estadoNegocio.horarioTexto ? `Horario: ${estadoNegocio.horarioTexto}. ` : ""}
                    Tu pedido se agenda y se preparará en orden de llegada al abrir{estadoNegocio.openHour ? ` (${estadoNegocio.openHour})` : ""}.
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNext} className="checkout-body" ref={bodyRef}>
            <div className="form-grid">
              {/* Modo de entrega (según lo configurado en el panel) */}
              {(settings.offersDelivery !== false || settings.offersPickup !== false || settings.offersLocal !== false) && (
                <div className="form-group full-width">
                  <label>¿Cómo lo recibes? *</label>
                  <div className="entrega-options">
                    {settings.offersDelivery !== false && (
                      <button
                        type="button"
                        className={`entrega-option ${esDomicilio ? "entrega-option--activa" : ""}`}
                        onClick={() => setFormData((p) => ({ ...p, tipoEntrega: "domicilio" }))}
                      >
                        <FaMotorcycle size={18} />
                        <span>Domicilio</span>
                        <small>{domicilioEsAparte ? "Se cotiza y paga aparte" : "El valor se cotizará por interno"}</small>
                      </button>
                    )}
                    {settings.offersPickup !== false && (
                      <button
                        type="button"
                        className={`entrega-option ${formData.tipoEntrega === "recogida" ? "entrega-option--activa" : ""}`}
                        onClick={() => setFormData((p) => ({ ...p, tipoEntrega: "recogida" }))}
                      >
                        <LuHandPlatter size={18} />
                        <span>Recoger en tienda</span>
                        <small>Sin costo de domicilio</small>
                      </button>
                    )}
                    {settings.offersLocal !== false && (
                      <button
                        type="button"
                        className={`entrega-option ${esLocal ? "entrega-option--activa" : ""}`}
                        onClick={() => setFormData((p) => ({ ...p, tipoEntrega: "local" }))}
                      >
                        <Store size={18} />
                        <span>Comer en el local</span>
                        <small>Sin recargo</small>
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="form-group full-width">
                <label><User size={15} /> Nombre Completo *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="¿A quién entregamos?" required />
              </div>
              <div className="form-group">
                <label><Phone size={15} /> Teléfono *</label>
                <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="300 000 0000" required />
              </div>
              <div className="form-group">
                <label><CreditCard size={15} /> Medio de Pago *</label>
                <select name="pago" value={formData.pago} onChange={handleChange}>
                  {/* <option value="Efectivo">Efectivo</option> */}
                  {/* <option value="Transferencia (Bancolombia/Nequi)">Transferencia (Bancolombia/Nequi)</option> */}
                  <option value="Transferencia">Transferencia</option>
                  {/* <option value="Datáfono">Datáfono a domicilio</option> */}
                </select>
                {formData.pago.includes("Transferencia") && settings.bankAccounts && settings.bankAccounts.length > 0 && (
                  <span style={{ fontSize: "0.75rem", color: "#d92b38", marginTop: "2px", fontStyle: "italic", lineHeight: "1.2" }}>
                    * Las cuentas bancarias se mostrarán en el siguiente paso.
                  </span>
                )}
              </div>
              {esDomicilio && (
                <>
                  {domicilioEsAparte ? (
                    <div className="form-group full-width checkout-alerta-domicilio-separado">
                      <div className="checkout-alerta-domicilio-header">
                        <FaMotorcycle size={16} />
                        <span>⚠️ El domicilio NO está incluido ni es gratis</span>
                      </div>
                      <p>
                        El valor del domicilio <strong>se cotiza según tu dirección y se paga por separado</strong>. El total que calcula la app corresponde únicamente a los productos.
                      </p>
                    </div>
                  ) : (
                    <div className="form-group full-width" style={{ backgroundColor: "#fff9e6", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #ffd54f" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#d97706", fontWeight: "700", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                        <FaMotorcycle size={14} /> Cotización de Domicilio
                      </div>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#92400e", lineHeight: "1.3" }}>
                        Te cotizaremos el valor de tu domicilio por WhatsApp. <strong style={{ fontStyle: "italic" }}>El total que ves aquí no lo incluye.</strong>
                      </p>
                    </div>
                  )}
                  <div className="form-group full-width">
                    <label><MapPin size={15} /> Dirección Exacta *</label>
                    <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Calle, Carrera, Barrio..." required />
                  </div>
                  <div className="form-group">
                    <label><Building size={15} /> Unidad / Edificio</label>
                    <input type="text" name="unidad" value={formData.unidad} onChange={handleChange} placeholder="Nombre (si aplica)" />
                  </div>
                  <div className="form-group">
                    <label><Home size={15} /> Apto / Casa / Piso *</label>
                    <input type="text" name="apto" value={formData.apto} onChange={handleChange} placeholder="Ej: Apto 502" required />
                  </div>
                </>
              )}
              <div className="form-group full-width">
                <label><MessageSquare size={15} /> Observaciones</label>
                <textarea name="observaciones" rows={2} value={formData.observaciones} onChange={handleChange} placeholder="Ej: Dejar en portería, timbrar dos veces..." />
              </div>
            </div>
            <div className="checkout-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-primary">Revisar Pedido <ArrowRight size={16} /></button>
            </div>
          </form>
        ) : (
          <div className="checkout-body summary-body" ref={bodyRef}>
            <div className="summary-card">
              <div className="card-header">
                <CheckCircle size={18} className="icon-success" />
                <h4>Datos de Entrega</h4>
              </div>
              <div className="card-content">
                <p><strong>Destinatario:</strong> {formData.nombre}</p>
                <p><strong>Teléfono:</strong> {formData.telefono}</p>
                <p>
                  <strong>Modalidad:</strong> {textoModalidad}
                </p>
                {esDomicilio && (
                  <p><strong>Dirección:</strong> {formData.direccion}{formData.unidad && `, ${formData.unidad}`}{`, ${formData.apto}`}</p>
                )}
                <p><strong>Método de pago:</strong> {formData.pago}</p>
                {formData.pago.includes("Transferencia") && settings.bankAccounts && settings.bankAccounts.length > 0 && (
                  <div className="checkout-aviso-transferencia" style={{ padding: "0.85rem", marginTop: "1rem" }}>
                    <div className="checkout-aviso-transferencia-header" style={{ marginBottom: "0.5rem" }}>
                      <CreditCard size={15} className="checkout-aviso-transferencia-icon" />
                      <span>Cuentas para transferencia:</span>
                    </div>
                    <ul className="checkout-aviso-transferencia-list" style={{ marginBottom: "0.5rem" }}>
                      {settings.bankAccounts.map((acc, i) => (
                        <li key={i} style={{ 
                          padding: "0.6rem 0.8rem", 
                          display: "flex", 
                          flexDirection: "column", 
                          alignItems: "flex-start", 
                          gap: "0.1rem",
                          background: "#fff",
                          border: "1px solid rgba(61, 35, 20, 0.1)",
                          borderRadius: "8px"
                        }}>
                          <span style={{ fontSize: "0.75rem", color: "#6b5244", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.02em" }}>
                            {acc.bankName}
                          </span>
                          <span style={{ fontSize: "1rem", fontWeight: "800", color: "#3d2314", letterSpacing: "0.05em", wordBreak: "break-all" }}>
                            {acc.accountNumber}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p style={{ fontSize: "0.8rem" }}>No olvides enviar el comprobante por WhatsApp.</p>
                  </div>
                )}
                {formData.observaciones && <p className="note" style={{ marginTop: "8px" }}><strong>Nota:</strong> &quot;{formData.observaciones}&quot;</p>}
              </div>
            </div>

            <div className="summary-card">
              <div className="card-header">
                <LuClipboardList
                  size={18} className="icon-success" />
                <h4>Resumen de Productos</h4>
              </div>
              <div className="card-content items-list">
                {cart.map((item, idx) => {
                  const itemUnitPrice = calculateItemUnitPrice(item);
                  const itemSubtotal = itemUnitPrice * item.quantity;
                  const itemName = item.nombre || "Postre";
                  return (
                    <div key={idx} className="summary-item">
                      <div className="item-qty-badge">{item.quantity}x</div>
                      <div className="item-details">
                        <span className="item-name">{itemName}</span>
                        {item.customizations && (
                          <span className="item-options">
                            {[
                              ...Object.values(item.customizations.options || {})
                                .map((o) => o?.nombre)
                                .filter(Boolean),
                              ...(item.customizations.toppings || [])
                                .map((t) => (typeof t === "string" ? t : t.nombre))
                                .filter(Boolean),
                              ...Object.values(item.customizations.adiciones || {})
                                .map((a) => a.nombre)
                                .filter(Boolean),
                              ...Object.values(item.customizations.salsas || {})
                                .map((s) => s.nombre)
                                .filter(Boolean),
                            ].join(", ")}
                          </span>
                        )}
                      </div>
                      <span className="item-subtotal">{formatCOP(itemSubtotal)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="summary-totals">
                <div className="total-row"><span>Subtotal productos:</span><span>{formatCOP(totalProductos)}</span></div>
                {!esDomicilio ? (
                  <div className="total-row"><span>Domicilio:</span><span className="text-free">No aplica</span></div>
                ) : domicilioEsAparte ? (
                  <div className="total-row total-row-domicilio-aparte">
                    <span>Domicilio:</span>
                    <span className="badge-domicilio-aparte">Se cotiza y paga aparte (NO incluido)</span>
                  </div>
                ) : (
                  <div className="total-row"><span>Domicilio:</span><span className="text-free" style={{ color: "#d92b38" }}>Por cotizar</span></div>
                )}
                <div className="divider" />
                <div className="total-row grand-total">
                  <span>{domicilioEsAparte ? "Total Productos (Sin Domicilio):" : "Total a Pagar:"}</span>
                  <span>{formatCOP(totalNetoAPagar)}</span>
                </div>
                {domicilioEsAparte && (
                  <p className="checkout-nota-subtotal-domi">
                    * El valor del envío NO está incluido. Se cotiza según tu dirección y se cancela por separado.
                  </p>
                )}
              </div>
            </div>

            {domicilioEsAparte && (
              <div className="checkout-checkbox-domicilio-card">
                <label className="checkout-checkbox-domicilio-label">
                  <input
                    type="checkbox"
                    checked={aceptoDomicilioSeparado}
                    onChange={(e) => setAceptoDomicilioSeparado(e.target.checked)}
                  />
                  <span>
                    <strong>He leído y acepto:</strong> El valor del domicilio <u>NO está incluido</u> en este cobro, <u>NO es gratis</u> y se cotiza/paga por separado según mi dirección.
                  </span>
                </label>
              </div>
            )}

            <div className="checkout-footer">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}><ArrowLeft size={16} /> Modificar Datos</button>
              <button type="button" className="btn-whatsapp" onClick={handleSubmit}><Send size={16} /> Enviar Pedido</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;

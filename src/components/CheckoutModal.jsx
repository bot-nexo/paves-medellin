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
  Truck,
  Send,
} from "lucide-react";
import "../css/CheckoutModal.css";
import {
  formatCOP,
  calculateItemUnitPrice,
  calculateOrderSummary,
} from "../utils/price";

const CheckoutModal = ({ isOpen, onClose, onConfirm, cart = [] }) => {
  const [step, setStep] = useState(1);
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

  const {
    subtotal: totalProductos,
    esGratis,
    totalNeto: totalNetoAPagar,
  } = calculateOrderSummary(cart);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (
      !formData.nombre.trim() ||
      !formData.telefono.trim() ||
      !formData.direccion.trim() ||
      !formData.apto.trim() ||
      !formData.pago
    ) {
      Swal.fire({
        title: "Campos incompletos",
        text: "Por favor completa los campos obligatorios para continuar.",
        icon: "warning",
        confirmButtonColor: "#3D2314",
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

        {step === 1 ? (
          <form onSubmit={handleNext} className="checkout-body">
            <div className="form-grid">
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
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia (Bancolombia/Nequi)">Transferencia (Bancolombia/Nequi)</option>
                  <option value="Datáfono">Datáfono a domicilio</option>
                </select>
              </div>
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
          <div className="checkout-body summary-body">
            <div className="summary-card">
              <div className="card-header">
                <CheckCircle size={18} className="icon-success" />
                <h4>Datos de Entrega</h4>
              </div>
              <div className="card-content">
                <p><strong>Destinatario:</strong> {formData.nombre}</p>
                <p><strong>Teléfono:</strong> {formData.telefono}</p>
                <p><strong>Dirección:</strong> {formData.direccion}{formData.unidad && `, ${formData.unidad}`}{`, ${formData.apto}`}</p>
                <p><strong>Método de pago:</strong> {formData.pago}</p>
                {formData.observaciones && <p className="note"><strong>Nota:</strong> &quot;{formData.observaciones}&quot;</p>}
              </div>
            </div>

            <div className="summary-card">
              <div className="card-header">
                <Truck size={18} className="icon-primary" />
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
                            {Object.values(item.customizations.options || {}).map((o) => o?.nombre).filter(Boolean).join(", ")}
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
                <div className="total-row"><span>Domicilio:</span><span className={esGratis ? "text-free" : ""}>{esGratis ? "GRATIS" : formatCOP(3500)}</span></div>
                <div className="divider" />
                <div className="total-row grand-total"><span>Total a Pagar:</span><span>{formatCOP(totalNetoAPagar)}</span></div>
              </div>
            </div>

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

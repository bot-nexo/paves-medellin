
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Pencil,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { FaMotorcycle, FaShoppingCart } from "react-icons/fa";
import {
  formatCOP,
  calculateItemUnitPrice,
  calculateOrderSummary,
} from "../utils/price";
import { currentPromo } from "../config/promos";
import "../css/CartModal.css";

// settings llega del dataSource vía useCatalog (App.jsx); fee/umbral configurables
const CartModal = ({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemove,
  onEdit,
  onAddOneMore,
  onCheckout,
  settings,
}) => {
  if (!isOpen) return null;

  const { subtotal: totalPlatos, discount, esGratis, totalNeto, faltanteGratis, totalItems } =
    calculateOrderSummary(cart, settings?.deliveryFee, settings?.freeDeliveryThreshold, true);

  // Logic for promo upselling
  let promoUpsellMessage = null;
  if (currentPromo && currentPromo.isActive && totalItems > 0) {
    const remainder = totalItems % currentPromo.rules.bundleQty;
    if (remainder > 0) {
      const missing = currentPromo.rules.bundleQty - remainder;
      promoUpsellMessage = `¡Estás a ${missing} producto${missing > 1 ? "s" : ""} de llevarte el combo ${currentPromo.name} por ${formatCOP(currentPromo.rules.bundlePrice)}! 💝`;
    } else {
      promoUpsellMessage = `¡Tienes activa la promo ${currentPromo.name}! 🎉`;
    }
  }

  //******************************************* */
  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-title">
            <FaShoppingCart size={22} className="cart-icon" />
            <h2>Tu Pedido</h2>
            <span className="cart-badge-count">
              {cart.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          </div>
          <button className="close-cart" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {/* Empty Cart */}
        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingBag size={48} />
            </div>
            <h3>Tu carrito esta vacio</h3>
            <p>Explora nuestro menu y antojadate de un delicioso pave!</p>
            <button
              className="cart-btn-primary"
              onClick={() => {
                onClose();
                setTimeout(() => {
                  const menuSection = document.getElementById("menu");
                  if (menuSection) {
                    menuSection.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100);
              }}
            >
              Ver Menu
            </button>
          </div>
        ) : (
          <>
            {/* Promo Upselling Alert */}
            {promoUpsellMessage && (
              <div className="promo-upsell-alert" style={{
                background: `linear-gradient(135deg, ${currentPromo.theme.primary}20, ${currentPromo.theme.secondary}15)`,
                border: `1px solid ${currentPromo.theme.primary}50`,
                padding: "0.8rem",
                margin: "1rem 1.5rem 0",
                borderRadius: "12px",
                color: currentPromo.theme.primary,
                fontWeight: "700",
                fontSize: "0.85rem",
                textAlign: "center",
                boxShadow: `0 4px 15px ${currentPromo.theme.primary}20`
              }}>
                {promoUpsellMessage}
              </div>
            )}

            {/* Product List */}
            <div className="cart-items">
              {cart.map((item, index) => {
                const itemUnitPrice = calculateItemUnitPrice(item);
                const itemTotalPrice = itemUnitPrice * item.quantity;
                const itemName = item.nombre || "Postre";

                // ¿El ítem tiene adiciones o salsas seleccionadas?
                const tieneAdiciones =
                  item.customizations?.adiciones &&
                  Object.keys(item.customizations.adiciones).length > 0;
                const tieneSalsas =
                  item.customizations?.salsas &&
                  Object.keys(item.customizations.salsas).length > 0;
                const esPersonalizado = tieneAdiciones || tieneSalsas;

                return (
                  <div
                    key={item.customizationKey || index}
                    className="cart-item"
                  >
                    <div className="item-info">
                      <div className="item-title-price">
                        <h4>{itemName}</h4>
                        <span className="item-price">
                          {formatCOP(itemTotalPrice)}
                        </span>
                      </div>

                      {item.customizations && (
                        <div className="item-customs">
                          {Object.keys(item.customizations.options || {}).map(
                            (groupName) => {
                              const selection =
                                item.customizations.options[groupName];
                              return selection ? (
                                <p key={groupName} className="custom-detail">
                                  <span className="custom-label">
                                    {groupName}:
                                  </span>{" "}
                                  {selection.nombre}
                                </p>
                              ) : null;
                            },
                          )}

                          {item.customizations.toppings &&
                            item.customizations.toppings.length > 0 && (
                              <p className="custom-detail">
                                <span className="custom-label">Toppings:</span>{" "}
                                {item.customizations.toppings
                                  .map((t) => (typeof t === "string" ? t : t.nombre))
                                  .join(", ")}
                              </p>
                            )}

                          {item.customizations.adiciones &&
                            Object.keys(item.customizations.adiciones).length > 0 && (
                              <p className="custom-detail">
                                <span className="custom-label">Adiciones:</span>{" "}
                                {Object.values(item.customizations.adiciones)
                                  .map((a) => a.nombre)
                                  .join(", ")}
                              </p>
                            )}

                          {item.customizations.salsas &&
                            Object.keys(item.customizations.salsas).length > 0 && (
                              <p className="custom-detail">
                                <span className="custom-label">Salsas:</span>{" "}
                                {Object.values(item.customizations.salsas)
                                  .map((s) => s.nombre)
                                  .join(", ")}
                              </p>
                            )}

                          {item.customizations.observaciones && (
                            <p className="custom-detail note">
                              {item.customizations.observaciones}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="item-controls">
                      <div className="quantity-selector">
                        <button
                          onClick={() => {
                            if (item.quantity === 1) {
                              onRemove(item.customizationKey);
                            } else {
                              onUpdateQuantity(item.customizationKey, -1);
                            }
                          }}
                          className="qty-btn"
                          type="button"
                          title={item.quantity === 1 ? "Eliminar" : "Reducir cantidad"}
                        >
                          {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          onClick={() =>
                            esPersonalizado
                              ? onAddOneMore(item)
                              : onUpdateQuantity(item.customizationKey, 1)
                          }
                          className={`qty-btn${esPersonalizado ? " qty-btn--custom" : ""}`}
                          type="button"
                          title={esPersonalizado ? "Agregar otro (elige adiciones)" : "Agregar uno más"}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="item-actions-extra">
                        <button
                          onClick={() => onEdit(item)}
                          className="action-icon-btn edit"
                          title="Editar producto"
                          type="button"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onRemove(item.customizationKey)}
                          className="action-icon-btn remove"
                          title="Eliminar"
                          type="button"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with Summary */}
            <div className="cart-footer">
              {settings.offersDelivery !== false && (
                <div
                  className={`delivery-badge ${esGratis ? "free" : "pending"}`}
                >
                  <FaMotorcycle size={18} />
                  <span>
                    {esGratis
                      ? "¡Si pides a domicilio, el envío es GRATIS! 🎉"
                      : `Si pides a domicilio, agrega ${formatCOP(faltanteGratis)} más para envío GRATIS`}
                  </span>
                </div>
              )}

              <div className="cart-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal:</span>
                  <span>{formatCOP(totalPlatos)}</span>
                </div>
                {discount > 0 && (
                  <div className="breakdown-row" style={{ color: currentPromo.theme.primary, fontWeight: '700' }}>
                    <span>Descuento {currentPromo.name}:</span>
                    <span>-{formatCOP(discount)}</span>
                  </div>
                )}
                <div className="divider"></div>
                <div className="breakdown-row total">
                  <span>Total Neto:</span>
                  <span>{formatCOP(totalPlatos - discount)}</span>
                </div>
              </div>

              <div className="cart-actions">
                <button className="btn-back" onClick={onClose} type="button">
                  <ArrowLeft size={16} /> Seguir pidiendo
                </button>
                {settings.isActive === false ? (
                  <button className="btn-checkout" type="button" disabled style={{ backgroundColor: "#999", cursor: "not-allowed" }}>
                    En Mantenimiento <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    className="btn-checkout"
                    onClick={onCheckout}
                    type="button"
                  >
                    Datos de entrega <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;

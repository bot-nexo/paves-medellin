const CartModal = ({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemove,
  onEdit,
  onCheckout,
}) => {
  if (!isOpen) return null;

  // Helper seguro para limpiar "$19 K" o "1.5 K" -> valor numérico real con decimales
  const parsePrice = (priceStr) => {
    if (!priceStr || priceStr === "0" || priceStr === 0) return 0;
    if (typeof priceStr === "number") return priceStr * 1000;

    const cleanNumber = priceStr.replace(/[^\d.]/g, "");
    const number = parseFloat(cleanNumber);

    return isNaN(number) ? 0 : number * 1000;
  };

  // Cálculo del total de los platos
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
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

      return total + itemPrice * item.quantity;
    }, 0);
  };

  const getItemPrice = (item) => {
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

    return `$${(itemPrice / 1000).toLocaleString()} K`;
  };

  const totalPlatos = calculateTotal();

  // CONFIGURACIÓN DEL DOMICILIO
  const VALOR_DOMICILIO = 2500; // $2.5 K
  const MINIMO_ENVIO_GRATIS = 40000; // $40 K
  const esGratis = totalPlatos >= MINIMO_ENVIO_GRATIS;
  const totalNeto = esGratis ? totalPlatos : totalPlatos + VALOR_DOMICILIO;

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Tu Pedido</h2>
          <button className="close-cart" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <i className="fas fa-shopping-basket"></i>
            <p>Tu carrito está vacío</p>
            <button
              className="cart-btn"
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
              Ver Menú
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item, index) => (
                <div key={item.customizationKey || index} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <span className="item-price">{getItemPrice(item)}</span>

                    {item.customizations && (
                      <div className="item-customs">
                        {Object.keys(item.customizations.options || {}).map((groupName) => {
                          const selection = item.customizations.options[groupName];
                          return selection ? (
                            <p key={groupName} className="custom-detail">
                              <span style={{ textTransform: "capitalize", fontWeight: "600" }}>{groupName}:</span> {selection.name}
                            </p>
                          ) : null;
                        })}

                        {item.customizations.bebida && (
                          <p className="custom-detail" style={{ color: "var(--primary)", fontWeight: "bold" }}>
                            Bebida: {item.customizations.bebida.name}
                            {item.customizations.bebida.sabor ? ` (${item.customizations.bebida.sabor})` : ""}
                          </p>
                        )}

                        {item.customizations.observaciones && (
                          <p className="custom-detail note">
                            "{item.customizations.observaciones}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="item-controls">
                    <button
                      onClick={() => onUpdateQuantity(item.customizationKey, -1)}
                      className="qty-btn"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.customizationKey, 1)}
                      className="qty-btn"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                    <div className="item-actions-extra">
                      <button
                        onClick={() => onEdit(item)}
                        className="edit-btn"
                        title="Editar preparación"
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button
                        onClick={() => onRemove(item.customizationKey)}
                        className="remove-btn"
                        title="Eliminar"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

              {/* NUEVA UBICACIÓN DE LA ALERTA INTERACTIVA */}
              <div className="delivery-badge" style={{
                backgroundColor: esGratis ? "#e6f4ea" : "#fff3cd",
                color: esGratis ? "#137333" : "#664d03",
                padding: "10px 12px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                textAlign: "center",
                fontWeight: "500",
                width: "100%",
                boxSizing: "border-box"
              }}>
                {esGratis
                  ? "🛵 ¡Genial! Tu domicilio es GRATIS"
                  : `🛵 Domicilio GRATIS por compras mayores a $40 K (Añade $${((MINIMO_ENVIO_GRATIS - totalPlatos) / 1000).toString().replace('.', ',')} K para domicilio gratis)`
                }
              </div>

              {/* DESGLOSE EN EL CARRITO */}
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "#555", marginBottom: "4px" }}>
                  <span>Subtotal platos:</span>
                  <span>${(totalPlatos / 1000).toString().replace('.', ',')} K</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", color: "#555", marginBottom: "4px" }}>
                  <span>Domicilio estimado:</span>
                  <span style={{ color: esGratis ? "#137333" : "var(--primary)", fontWeight: "600" }}>
                    {esGratis ? "GRATIS" : `$${(VALOR_DOMICILIO / 1000).toString().replace('.', ',')} K`}
                  </span>
                </div>
                <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "6px 0" }} />
              </div>

              <div className="total-section" style={{ width: "100%", marginTop: "0" }}>
                <span>Total Estimado:</span>
                <span className="total-amount">
                  ${(totalNeto / 1000).toString().replace('.', ',')} K
                </span>
              </div>

              <button className="btn-back" onClick={onClose}>
                <i className="fas fa-hand-point-left"></i> Seguir Comprando
              </button>
              <button className="btn-checkout" onClick={onCheckout}>
                <i className="fas fa-hand-point-right"></i> Siguiente: Datos entrega
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;
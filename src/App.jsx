import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import AOS from "aos";
import Swal from "sweetalert2";
import "aos/dist/aos.css";
import "./css/estadoNegocio.css";

import Hero from "./components/Hero";
import Menu from "./components/Menu";
import Footer from "./components/Footer";
import CartModal from "./components/CartModal";
import CustomizationModal from "./components/CustomizationModal";
import CheckoutModal from "./components/CheckoutModal";
import { AdminRoutes } from "./admin/AppRoutes";

import useCart from "./hooks/useCart";
import useCatalog from "./hooks/useCatalog";
import { createOrder } from "./data/dataSource";
import { estaAbiertoSegunHorario } from "./utils/horario";
import {
  calculateItemUnitPrice,
  calculateOrderSummary
} from "./utils/price";

const App = () => {
  // Catálogo dinámico (Supabase ↔ local): productos, categorías y settings
  const { categories, products, settings, isLoading } = useCatalog();
  const {
    cart,
    cartCount,
    isCartOpen,
    isCustomizing,
    isCheckoutOpen,
    productToCustomize,
    closeCustomizationModal,
    openCart,
    closeCart,
    openCheckout,
    closeCheckout,
    addToCart,
    editCartItem,
    addOneMore,
    confirmCustomization,
    removeItemByStoreKey,
    updateQuantity,
    setCart,
    setIsCheckoutOpen,
  } = useCart();

  const [selectedProduct, setSelectedProduct] = useState(null);


  // WhatsApp y costos ahora vienen de settings (panel admin).
  const whatsappNumber = settings.phone || "";

  // Estado del negocio: abierto/cerrado según horario + cierre de emergencia
  const estadoNegocio = estaAbiertoSegunHorario(settings);

  // Actualiza el <title> del documento con la razón social de la BD
  useEffect(() => {
    if (settings?.razon_social) {
      document.title = `${settings.razon_social} | Menú`;
    }
  }, [settings?.razon_social]);

  useEffect(() => {
    AOS.init({ duration: 1600, once: true, offset: 100 });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [selectedProduct]);


  const sendOrderToWhatsApp = async (deliveryData) => {
    if (cart.length === 0) return;

    // 1) Persistir el pedido en la BD (no bloquea: si falla, seguimos a WhatsApp)
    const esDomicilio = deliveryData.tipoEntrega === "domicilio";
    const summary = calculateOrderSummary(cart, settings.deliveryFee ?? 0, settings.freeDeliveryThreshold ?? 0, esDomicilio);
    const deliveryFee = (!esDomicilio || summary.esGratis)
      ? 0
      : (settings.deliveryFee ?? 0);

    const saved = await createOrder(deliveryData, cart, {
      subtotal: summary.subtotal,
      deliveryFee,
      total: summary.totalNeto,
    });

    // 2) Armar el mensaje de WhatsApp (idéntico al actual + nº de pedido si existe)
    let message = "*NUEVO PEDIDO *";
    if (saved.numero) message += "\n*Nº " + saved.numero + "*";
    message += "\n";

    // Fuera de horario o cierre de emergencia: el pedido queda AGENDADO y se
    // prepara al abrir, en orden de llegada (el cliente lo debe saber)
    if (!estadoNegocio.abierto) {
      message += "⚠️ *PEDIDO AGENDADO* (negocio cerrado ahora)\n";
      if (estadoNegocio.horarioTexto) {
        message += "Horario: " + estadoNegocio.horarioTexto + "\n";
      }
      message += "Se preparará al abrir, en orden de llegada.\n\n";
    }
    if (deliveryData.tipoEntrega === "recogida") {
      message += "🏪 *MODALIDAD: RECOGER EN TIENDA*\n\n";
    } else if (deliveryData.tipoEntrega === "local") {
      message += "🍽️ *MODALIDAD: COMER EN EL LOCAL*\n\n";
    } else {
      message += "🛵 *MODALIDAD: DOMICILIO*\n\n";
    }
    message += "--------------------------------\n\n";
    message += "*DATOS DEL CLIENTE*\n";
    message += "• *Nombre:* " + deliveryData.nombre + "\n";
    message += "• *Telefono:* " + deliveryData.telefono + "\n";
    
    if (esDomicilio) {
      message += "• *Direccion:* " + deliveryData.direccion + "\n";
      if (deliveryData.unidad) message += "• *Unidad:* " + deliveryData.unidad + "\n";
      if (deliveryData.apto) message += "• *Apto/Piso:* " + deliveryData.apto + "\n";
    }
    
    message += "• *Pago:* " + deliveryData.pago + "\n";
    if (deliveryData.pago.includes("Transferencia") && settings.bankAccounts && settings.bankAccounts.length > 0) {
      settings.bankAccounts.forEach(acc => {
        message += "   _Bco: " + acc.bankName + " N° " + acc.accountNumber + "_\n";
      });
      message += "   _👉 *POR FAVOR ENVÍA EL COMPROBANTE AQUÍ*_ \n";
    }
    message += "\n*DETALLE DEL PEDIDO*\n";

    let total = 0;

    cart.forEach((item) => {
      const itemPrice = calculateItemUnitPrice(item);
      message += "• *" + item.quantity + "x " + item.nombre.trim() + "*\n";

      if (item.customizations) {
        Object.keys(item.customizations.options || {}).forEach((groupName) => {
          const selection = item.customizations.options[groupName];
          if (selection) {
            message += "   _" + groupName.toUpperCase() + ": " + (selection.nombre || selection.name) + "_\n";
          }
        });
        if (item.customizations.bebida) {
          const b = item.customizations.bebida;
          const saborText = b.sabor ? " (" + b.sabor + ")" : "";
          message += "   _BEBIDA: " + b.name + saborText + "_\n";
        }
        if (item.customizations.toppings && item.customizations.toppings.length > 0) {
          const toppingsText = item.customizations.toppings.map(t => typeof t === "object" ? t.nombre || t.name : t).join(", ");
          message += "   _Toppings: " + toppingsText + "_\n";
        }
        if (item.customizations.adiciones && Object.keys(item.customizations.adiciones).length > 0) {
          const adicionesText = Object.values(item.customizations.adiciones).map(a => a.nombre).join(", ");
          message += "   _Adiciones: " + adicionesText + "_\n";
        }
        if (item.customizations.salsas && Object.keys(item.customizations.salsas).length > 0) {
          const salsasText = Object.values(item.customizations.salsas).map(s => s.nombre).join(", ");
          message += "   _Salsas: " + salsasText + "_\n";
        }
        if (item.customizations.observaciones) {
          message += "   _Nota: " + item.customizations.observaciones + "_\n";
        }
      }

      const subtotal = itemPrice * item.quantity;
      total += subtotal;
      message += "   Subtotal: $" + (subtotal / 1000).toLocaleString() + " K\n\n";
    });

    const esGratis = !esDomicilio || summary.esGratis;
    const totalPagar = summary.subtotal - summary.discount;

    message += "--------------------------------\n";
    message += "   Subtotal platos: $" + (total / 1000).toLocaleString() + " K\n";
    message +=
      "   Domicilio: " +
      (!esDomicilio ? "No aplica" : "Por cotizar") +
      "\n";
    message += "--------------------------------\n";
    message += "*TOTAL A PAGAR: $" + (total / 1000).toLocaleString() + " K* " + (esDomicilio ? "(Sin incluir domicilio)" : "") + "\n";
    message += "\n_Pedido generado desde la web_";

    window.open(
      "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message),
      "_blank",
    );

    Swal.fire({
      title: " Pedido Enviado!",
      text: "Tu pedido ha sido enviado correctamente a WhatsApp.",
      icon: "success",
      confirmButtonColor: "#3D2314",
    });

    setCart([]);
    setIsCheckoutOpen(false);
    closeCart();
  };

  //***************************** */
  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#1e1008", color: "#f5c842", flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(245,200,66,0.3)", borderTopColor: "#f5c842", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ fontWeight: "700", letterSpacing: "0.05em" }}>Cargando nuestro menú...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Panel de administración (privado) */}
      {import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && (
        <Route path="/admin/*" element={<AdminRoutes />} />
      )}

      {/* Tienda y catálogo público */}
      <Route
        path="/*"
        element={
          <div className="app-wrapper">
            {settings.isActive === false && (
              <div style={{ backgroundColor: "#d32f2f", color: "white", textAlign: "center", padding: "10px", fontWeight: "bold", fontSize: "0.9rem", zIndex: 1000, position: "relative" }}>
                Estamos en mantenimiento o actualización. Pronto volveremos a recibir pedidos.
              </div>
            )}
            <Hero cartCount={cartCount} onOpenCart={openCart} estadoNegocio={estadoNegocio} />

            <Menu
              data={products}
              categories={categories}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              addToCart={addToCart}
            />

            <Footer settings={settings} />

            <CartModal
              cart={cart}
              isOpen={isCartOpen}
              onClose={closeCart}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItemByStoreKey}
              onEdit={editCartItem}
              onAddOneMore={addOneMore}
              onCheckout={openCheckout}
              settings={settings}
            />

            <CustomizationModal
              product={productToCustomize}
              isOpen={isCustomizing}
              onClose={closeCustomizationModal}
              onConfirm={confirmCustomization}
            />

            <CheckoutModal
              isOpen={isCheckoutOpen}
              onClose={closeCheckout}
              onConfirm={sendOrderToWhatsApp}
              cart={cart}
              settings={settings}
              estadoNegocio={estadoNegocio}
            />
          </div>
        }
      />
    </Routes>
  );
};

export default App;

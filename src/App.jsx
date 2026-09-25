import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import AOS from "aos";
import Swal from "sweetalert2";
import "aos/dist/aos.css";
import "./css/estadoNegocio.css";

import Hero from "./components/Hero";
import Menu from "./components/Menu";
import Footer from "./components/Footer";
import BottomNavigation from "./components/BottomNavigation";
import CartModal from "./components/CartModal";
import CustomizationModal from "./components/CustomizationModal";
import CakeScheduleModal from "./components/CakeScheduleModal";
import CheckoutModal from "./components/CheckoutModal";
import CustomerIdentifyModal from "./components/CustomerIdentifyModal";
import ArmaTuPaveModal from "./components/ArmaTuPaveModal";
import RatingModal from "./components/RatingModal";
import { AdminRoutes } from "./admin/AppRoutes";
import { info, VALOR_DOMICILIO_DEFAULT, MINIMO_ENVIO_GRATIS_DEFAULT } from "./data/menu";

import useCart from "./hooks/useCart";
import useCatalog from "./hooks/useCatalog";
import { createOrder, getOrCreateCustomer, incrementCustomerOrderCount } from "./data/dataSource";
import { getCustomerBadge } from "./utils/badges";
import { estaAbiertoSegunHorario } from "./utils/horario";
import {
  calculateItemUnitPrice,
  calculateOrderSummary
} from "./utils/price";

const App = () => {
  // Catálogo dinámico (Supabase ↔ local): productos, categorías, settings y diseño
  const { categories, products, settings, design } = useCatalog();
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
    isArmaModalOpen,
    setIsArmaModalOpen,
    armaEditItem,
    setArmaEditItem,
  } = useCart();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Estado del cliente (identificación por nombre y teléfono cel)
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = sessionStorage.getItem("paves_customer_info") || localStorage.getItem("paves_customer_info");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Al cerrar o salir de la página del menú, eliminar la info del cliente de storage para garantizar la seguridad de los datos
  useEffect(() => {
    const handleClearCustomerStorage = () => {
      try {
        localStorage.removeItem("paves_customer_info");
        sessionStorage.removeItem("paves_customer_info");
      } catch {
        /* noop */
      }
    };
    window.addEventListener("beforeunload", handleClearCustomerStorage);
    window.addEventListener("pagehide", handleClearCustomerStorage);

    return () => {
      window.removeEventListener("beforeunload", handleClearCustomerStorage);
      window.removeEventListener("pagehide", handleClearCustomerStorage);
    };
  }, []);

  useEffect(() => {
    const handleOpenRating = () => {
      if (!customer || !customer.telefono) {
        setIsCustomerModalOpen(true);
      } else {
        setIsRatingOpen(true);
      }
    };
    window.addEventListener("open-rating", handleOpenRating);
    return () => window.removeEventListener("open-rating", handleOpenRating);
  }, [customer]);

  useEffect(() => {
    // Si al ingresar a la tienda el cliente aún no se ha identificado, abrir el modal automáticamente
    if (!customer || !customer.telefono) {
      setIsCustomerModalOpen(true);
    }
  }, []);

  const handleSaveCustomer = async (customerData) => {
    try {
      // Validar o registrar cliente en la BD de Supabase real
      const dbCust = await getOrCreateCustomer(
        customerData.nombre,
        customerData.telefono,
        customerData.fecha_cumple
      );

      const mergedCustomer = {
        ...customerData,
        pedidos_count: dbCust?.pedidos_count ?? 0,
        fecha_cumple: dbCust?.fecha_cumple || customerData.fecha_cumple || null
      };

      // Guardar en sessionStorage para que sea volátil (se borra al cerrar la pestaña) y limpiar localStorage
      sessionStorage.setItem("paves_customer_info", JSON.stringify(mergedCustomer));
      localStorage.removeItem("paves_customer_info");

      setCustomer(mergedCustomer);
      setIsCustomerModalOpen(false);
    } catch (e) {
      console.warn("Error al guardar cliente en BD real:", e);
    }
  };


  // WhatsApp y costos ahora vienen de settings (panel admin). Fallback a info local.
  const whatsappNumber = settings.phone || info.phone;

  // Estado del negocio: abierto/cerrado según horario + cierre de emergencia
  const estadoNegocio = estaAbiertoSegunHorario(settings);

  useEffect(() => {
    window.scrollTo(0, 0);
    AOS.init({ duration: 1600, once: true, offset: 100 });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [selectedProduct]);


  const sendOrderToWhatsApp = async (deliveryData) => {
    if (cart.length === 0) return;

    // 1) Persistir el pedido en la BD (no bloquea: si falla, seguimos a WhatsApp)
    const esDomicilio = deliveryData.tipoEntrega === "domicilio";
    const feeBase = settings.deliveryFee ?? VALOR_DOMICILIO_DEFAULT;
    const freeThreshold = settings.freeDeliveryThreshold ?? MINIMO_ENVIO_GRATIS_DEFAULT;
    const summary = calculateOrderSummary(cart, feeBase, freeThreshold, esDomicilio);
    const deliveryFee = (!esDomicilio || summary.esGratis)
      ? 0
      : feeBase;
    const saved = await createOrder(deliveryData, cart, {
      subtotal: summary.subtotal,
      deliveryFee,
      total: summary.subtotal + deliveryFee,
    });

    // Incrementa el contador de compras concretadas del cliente en la BD real de Supabase
    if (deliveryData.telefono) {
      incrementCustomerOrderCount(deliveryData.telefono, deliveryData.nombre);
    }

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
    
    message += "• *Pago:* " + deliveryData.pago + "\n\n";
    message += "*DETALLE DEL PEDIDO*\n";

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
        if (item.customizations.deliveryDate && item.customizations.deliveryTime) {
          message += "   *📅 AGENDADO PARA: " + item.customizations.deliveryDate + " - " + item.customizations.deliveryTime + "*\n";
        }
      }

      const subtotal = itemPrice * item.quantity;
      total += subtotal;
      message += "   Subtotal: $" + (subtotal / 1000).toLocaleString() + " K\n\n";
    });

    const esGratis = !esDomicilio || summary.esGratis;
    const totalFinal = summary.subtotal + deliveryFee;

    message += "--------------------------------\n";
    message += "   Subtotal platos: $" + (total / 1000).toLocaleString() + " K\n";
    message +=
      "   Domicilio: " +
      (!esDomicilio ? "No aplica" : esGratis ? "GRATIS" : "$" + (deliveryFee / 1000).toLocaleString() + " K") +
      "\n";
    message += "--------------------------------\n";
    message += "*TOTAL A PAGAR: $" + (totalFinal / 1000).toLocaleString() + " K* \n";
    message += "\n_Pedido generado desde la web_";

    window.open(
      "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message),
      "_blank",
      "noopener,noreferrer"
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
          <div
            className="app-wrapper has-bottom-nav"
            style={{
              backgroundColor: design?.appBg && !design.appBg.includes("fff") && !design.appBg.includes("fdf") ? design.appBg : "#0d0805",
              fontFamily: design?.fontFamily || "inherit",
            }}
          >
            {settings.isActive === false && (
              <div style={{ backgroundColor: "#d32f2f", color: "white", textAlign: "center", padding: "10px", fontWeight: "bold", fontSize: "0.9rem", zIndex: 1000, position: "relative" }}>
                Estamos en mantenimiento o actualización. Pronto volveremos a recibir pedidos.
              </div>
            )}
            <Hero
              cartCount={cartCount}
              onOpenCart={openCart}
              estadoNegocio={estadoNegocio}
              design={design}
              products={products}
              settings={settings}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAddToCart={addToCart}
              customer={customer}
              onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
            />

            <Menu
              data={products}
              categories={categories}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              addToCart={addToCart}
              design={design}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenArmaModal={() => { setArmaEditItem(null); setIsArmaModalOpen(true); }}
            />

            <Footer settings={settings} design={design} />

            <BottomNavigation
              cartCount={cartCount}
              onOpenCart={openCart}
              whatsappNumber={whatsappNumber}
            />

            {/* Floating Badge */}
            {customer && customer.nombre && settings?.useCustomerBadges !== false && (
              (() => {
                const badge = getCustomerBadge(customer.pedidos_count || 0);
                return (
                  <div 
                    className="saborio-floating-badge" 
                    onClick={() => setIsCustomerModalOpen(true)}
                    title={`Nivel ${badge.name}: ${badge.description}`}
                    style={{
                      boxShadow: `0 0 15px ${badge.glow}, 0 4px 12px rgba(0,0,0,0.5)`,
                      border: `2px solid ${badge.color}`
                    }}
                  >
                    <img src={badge.image} alt={`Insignia ${badge.name}`} className="saborio-floating-badge-img" />
                  </div>
                );
              })()
            )}

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

            {productToCustomize && productToCustomize.tiempo_preparacion_horas > 0 ? (
              <CakeScheduleModal
                product={productToCustomize}
                isOpen={isCustomizing}
                onClose={closeCustomizationModal}
                onConfirm={confirmCustomization}
              />
            ) : (
              <CustomizationModal
                product={productToCustomize}
                isOpen={isCustomizing}
                onClose={closeCustomizationModal}
                onConfirm={confirmCustomization}
              />
            )}

            <ArmaTuPaveModal
              isOpen={isArmaModalOpen}
              onClose={() => { setIsArmaModalOpen(false); setArmaEditItem(null); }}
              onAddToCart={(customProduct, isEdit, oldKey) => {
                if (isEdit) {
                  setCart((prev) => prev.filter(c => c.customizationKey !== oldKey));
                }
                
                // Generar nueva key para el customProduct
                const adicionesIds = Object.keys(customProduct.customizations.adiciones || {}).sort();
                const salsasIds    = Object.keys(customProduct.customizations.salsas    || {}).sort();
                
                const newKey = JSON.stringify({
                  productId: customProduct.id,
                  baseId: customProduct.customizations.base.id,
                  adiciones: adicionesIds,
                  salsas: salsasIds,
                });
                
                customProduct.customizationKey = newKey;
                
                setCart((prev) => {
                  const existing = prev.find(c => c.customizationKey === newKey);
                  if (existing) {
                    return prev.map(c => c.customizationKey === newKey ? { ...c, quantity: c.quantity + (isEdit ? armaEditItem.quantity : 1) } : c);
                  } else {
                    return [...prev, { ...customProduct, quantity: isEdit ? armaEditItem.quantity : 1 }];
                  }
                });
              }}
              editItem={armaEditItem}
            />


            <CheckoutModal
              isOpen={isCheckoutOpen}
              onClose={closeCheckout}
              onConfirm={sendOrderToWhatsApp}
              cart={cart}
              settings={settings}
              estadoNegocio={estadoNegocio}
            />

            <CustomerIdentifyModal
              isOpen={isCustomerModalOpen}
              onClose={() => setIsCustomerModalOpen(false)}
              onSaveCustomer={handleSaveCustomer}
              currentCustomer={customer}
              settings={settings}
            />

            <RatingModal
              isOpen={isRatingOpen}
              onClose={() => setIsRatingOpen(false)}
              currentCustomer={customer}
              settings={settings}
            />
          </div>
        }
      />
    </Routes>
  );
};

export default App;

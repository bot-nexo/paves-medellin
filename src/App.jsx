import { useEffect, useState } from "react";
import AOS from "aos";
import Swal from "sweetalert2";
import "aos/dist/aos.css";
import "./App.css";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Menu from "./components/Menu";
import Info from "./components/Info";
import Footer from "./components/Footer";
import CartModal from "./components/CartModal";
import CustomizationModal from "./components/CustomizationModal";
import CheckoutModal from "./components/CheckoutModal";
import { menuData, info } from "./data/menu";

import useCart from "./hooks/useCart";
import {
  calculateItemUnitPrice,
  calculateOrderSummary,
  VALOR_DOMICILIO,
} from "./utils/price";

const App = () => {
  const {
    cart,
    cartCount,
    isCartOpen,
    isCustomizing,
    isCheckoutOpen,
    productToCustomize,
    openCart,
    closeCart,
    openCheckout,
    closeCheckout,
    addToCart,
    editCartItem,
    confirmCustomization,
    removeItemByStoreKey,
    updateQuantity,
    setCart,
    setIsCheckoutOpen,
  } = useCart();

  const [scrolled, setScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const whatsappNumber = info.phone;

  useEffect(() => {
    AOS.init({ duration: 1600, once: true, offset: 100 });
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [selectedProduct]);

  const sendOrderToWhatsApp = (deliveryData) => {
    if (cart.length === 0) return;

    let message = "*NUEVO PEDIDO *\n";
    message += "--------------------------------\n\n";
    message += "*DATOS DE ENTREGA*\n";
    message += "• *Nombre:* " + deliveryData.nombre + "\n";
    message += "• *Telefono:* " + deliveryData.telefono + "\n";
    message += "• *Direccion:* " + deliveryData.direccion + "\n";
    if (deliveryData.unidad) message += "• *Unidad:* " + deliveryData.unidad + "\n";
    message += "• *Apto/Piso:* " + deliveryData.apto + "\n";
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
        if (item.customizations.observaciones) {
          message += "   _Nota: " + item.customizations.observaciones + "_\n";
        }
      }

      const subtotal = itemPrice * item.quantity;
      total += subtotal;
      message += "   Subtotal: $" + (subtotal / 1000).toLocaleString() + " K\n\n";
    });

    const { esGratis } = calculateOrderSummary(cart);
    const totalFinal = esGratis ? total : total + VALOR_DOMICILIO;

    message += "--------------------------------\n";
    message += "   Subtotal platos: $" + (total / 1000).toLocaleString() + " K\n";
    message += "   Domicilio: " + (esGratis ? "GRATIS" : "$" + (VALOR_DOMICILIO / 1000).toLocaleString() + " K") + "\n";
    message += "--------------------------------\n";
    message += "*TOTAL A PAGAR: $" + (totalFinal / 1000).toLocaleString() + " K* \n";
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

  return (
    <div className="app-wrapper">
      <Navbar scrolled={scrolled} cartCount={cartCount} onOpenCart={openCart} />

      <Hero onAddToCart={addToCart} />

      <Menu
        data={menuData}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
      />

      <Info info={info} />

      <Footer />

      <CartModal
        cart={cart}
        isOpen={isCartOpen}
        onClose={closeCart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItemByStoreKey}
        onEdit={editCartItem}
        onCheckout={openCheckout}
      />

      <CustomizationModal
        product={productToCustomize}
        isOpen={isCustomizing}
        onClose={() => setIsCustomizing(false)}
        onConfirm={confirmCustomization}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={closeCheckout}
        onConfirm={sendOrderToWhatsApp}
        cart={cart}
      />

      {scrolled && (
        <button
          className="scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <i className="fas fa-chevron-up"></i>
        </button>
      )}
    </div>
  );
};

export default App;

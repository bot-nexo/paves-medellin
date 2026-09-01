import { useEffect, useState } from "react";
import AOS from "aos";
import Swal from "sweetalert2";
import "aos/dist/aos.css";
import "./App.css";

// Components
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Menu from "./components/Menu";
import Info from "./components/Info";
import Footer from "./components/Footer";
import CartModal from "./components/CartModal";
import CustomizationModal from "./components/CustomizationModal";
import CheckoutModal from "./components/CheckoutModal";
import {
  heroImages,
  menuData, // CORRECCIÓN: Pasamos la data completa que incluye category2 para el filtro "Todo"
  info,
} from "./data/menu";

const App = () => {
  // States
  const [scrolled, setScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [productToCustomize, setProductToCustomize] = useState(null);
  const [editingItemKey, setEditingItemKey] = useState(null);

  // Constants
  const whatsappNumber = info.phone;

  // Effects
  useEffect(() => {
    AOS.init({ duration: 1600, once: true, offset: 100 });

    const handleScroll = () => setScrolled(window.scrollY > 50);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 1700);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [selectedProduct]);

  // Handlers
  const addToCart = (product) => {
    setProductToCustomize(product);
    setEditingItemKey(null);
    setIsCustomizing(true);
  };

  const editCartItem = (item) => {
    setProductToCustomize(item);
    setEditingItemKey(item.customizationKey);
    setIsCustomizing(true);
    setIsCartOpen(false);
  };

  // CORRECCIÓN 1: Adaptación de la llave de personalización para la nueva estructura dinámica
  const confirmCustomization = (product, customizations) => {
    setCart((prevCart) => {
      // Creamos un string identificador único basado en las opciones dinámicas y bebidas elegidas
      const optionsIds = Object.keys(customizations.options || {})
        .map((key) => customizations.options[key]?.id || "")
        .sort();

      const customizationKey = JSON.stringify({
        productId: product.id,
        options: optionsIds,
        bebidaId: customizations.bebida?.id || null,
        saborBebida: customizations.bebida?.sabor || null,
        observaciones: customizations.observaciones,
      });

      let newCart = [...prevCart];
      if (editingItemKey) {
        newCart = newCart.filter(
          (item) => item.customizationKey !== editingItemKey,
        );
      }

      const existingItem = newCart.find(
        (item) => item.customizationKey === customizationKey,
      );

      if (existingItem) {
        return newCart.map((item) =>
          item.customizationKey === customizationKey
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item,
        );
      }

      return [
        ...newCart,
        {
          ...product,
          quantity: product.quantity || 1,
          customizations,
          customizationKey,
        },
      ];
    });

    setEditingItemKey(null);
    setIsCustomizing(false); // Asegura que cierre el modal al confirmar
  };

  const removeItemByStoreKey = (storeKey) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.customizationKey !== storeKey),
    );
  };

  const updateQuantity = (storeKey, delta) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.customizationKey === storeKey) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };

  // CORRECCIÓN 2: Reestructuración de precios y string de WhatsApp para soportar las nuevas propiedades
  const sendOrderToWhatsApp = (deliveryData) => {
    if (cart.length === 0) return;

    let message = "*NUEVO PEDIDO *\n";
    message += "--------------------------------\n\n";

    message += "*DATOS DE ENTREGA*\n";
    message += `• *Nombre:* ${deliveryData.nombre}\n`;
    message += `• *Teléfono:* ${deliveryData.telefono}\n`;
    message += `• *Dirección:* ${deliveryData.direccion}\n`;
    if (deliveryData.unidad) message += `• *Unidad:* ${deliveryData.unidad}\n`;
    message += `• *Apto/Piso:* ${deliveryData.apto}\n`;
    message += `• *Pago:* ${deliveryData.pago}\n\n`;

    message += "*DETALLE DEL PEDIDO*\n";
    let total = 0;

    cart.forEach((item) => {
      // Helper seguro para limpiar "$19 K" -> 19000
      const parsePrice = (priceStr) => {
        if (!priceStr || priceStr === "0" || priceStr === 0) return 0;

        // Si ya es un número, solo lo multiplicamos
        if (typeof priceStr === "number") return priceStr * 1000;

        // CORRECCIÓN: Quitamos todo lo que no sea número o punto decimal, y usamos parseFloat
        const cleanNumber = priceStr.replace(/[^\d.]/g, "");
        const number = parseFloat(cleanNumber);

        return isNaN(number) ? 0 : number * 1000;
      };

      let itemPrice = parsePrice(item.price);

      message += `• *${item.quantity}x ${item.name.trim()}*\n`;

      if (item.customizations) {
        // Mapeamos dinámicamente todas las opciones de comida elegidas (huevos, carnes, etc.)
        Object.keys(item.customizations.options || {}).forEach((groupName) => {
          const selection = item.customizations.options[groupName];
          if (selection) {
            message += `   _${groupName.toUpperCase()}: ${selection.name}_\n`;
            itemPrice += parsePrice(selection.price);
          }
        });

        // Sumamos y mostramos la bebida asignada
        if (item.customizations.bebida) {
          const b = item.customizations.bebida;
          const saborText = b.sabor ? ` (${b.sabor})` : "";
          message += `   _BEBIDA: ${b.name}${saborText}_\n`;
          itemPrice += parsePrice(b.price);
        }

        // Notas adicionales
        if (item.customizations.observaciones) {
          message += `   _Nota: ${item.customizations.observaciones}_\n`;
        }
      }

      const subtotal = itemPrice * item.quantity;
      total += subtotal;
      message += `   Subtotal: $${(subtotal / 1000).toLocaleString()} K\n\n`;
    });

    // Agrega esto en App.jsx dentro de sendOrderToWhatsApp justo antes del TOTAL final:
    const VALOR_DOMICILIO = 2500;
    const MINIMO_ENVIO_GRATIS = 40000;
    const envioGratis = total >= MINIMO_ENVIO_GRATIS;
    const totalFinal = envioGratis ? total : total + VALOR_DOMICILIO;

    message += "--------------------------------\n";
    message += `   Subtotal platos: $${(total / 1000).toLocaleString()} K\n`;
    message += `   Domicilio: ${envioGratis ? "GRATIS" : `$${(VALOR_DOMICILIO / 1000).toLocaleString()} K`}\n`;
    message += "--------------------------------\n";
    message += `*TOTAL A PAGAR: $${(totalFinal / 1000).toLocaleString()} K* \n`;
    message += "\n_Pedido generado desde la web_";

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
    );

    Swal.fire({
      title: " ¡Pedido Enviado!",
      text: "Tu pedido ha sido enviado correctamente a WhatsApp.",
      icon: "success",
      confirmButtonColor: "var(--primary)",
    });

    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  return (
    <div className="app-wrapper">
      <Navbar
        scrolled={scrolled}
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <Hero heroImages={heroImages} currentSlide={currentSlide} />

      {/* CORRECCIÓN 3: Se cambia menuData por allMenuData para que el filtro "Todo" funcione correctamente */}
      <Menu
        data={menuData}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        addToCart={addToCart}
      />

      <Info info={info} />

      <Footer whatsappNumber={whatsappNumber} />

      <CartModal
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItemByStoreKey}
        onEdit={editCartItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CustomizationModal
        product={productToCustomize}
        isOpen={isCustomizing}
        onClose={() => setIsCustomizing(false)}
        onConfirm={confirmCustomization}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
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
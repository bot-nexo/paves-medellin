import { useState, useCallback } from "react";
import { parsePrice } from "../utils/price";

/**
 * Custom hook encapsulating all cart state and operations.
 * Returns everything App.jsx needs to wire up modals and WhatsApp.
 */
const useCart = () => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [productToCustomize, setProductToCustomize] = useState(null);
  const [editingItemKey, setEditingItemKey] = useState(null);

  // ── Open / close helpers ──────────────────────────────────────────────
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  // ── Add / Edit flow ──────────────────────────────────────────────────
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

  // ── Confirm customization (add or update) ────────────────────────────
  const confirmCustomization = useCallback(
    (product, customizations) => {
      setCart((prevCart) => {
        const optionsIds = Object.keys(customizations.options || {})
          .map((key) => customizations.options[key]?.id || "")
          .sort();

        const customizationKey = JSON.stringify({
          productId: product.id,
          options: optionsIds,
          toppings: (customizations.toppings || []).map((t) =>
            typeof t === "string" ? t : t.nombre || t.name || "",
          ),
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
      setIsCustomizing(false);
    },
    [editingItemKey],
  );

  // ── Cart mutations ───────────────────────────────────────────────────
  const removeItemByStoreKey = (storeKey) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.customizationKey !== storeKey),
    );
  };

  const updateQuantity = (storeKey, delta) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.customizationKey === storeKey) {
          return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
      }),
    );
  };

  // ── Derived value ────────────────────────────────────────────────────
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

  return {
    // state
    cart,
    cartCount,
    isCartOpen,
    isCustomizing,
    isCheckoutOpen,
    productToCustomize,

    // actions
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
    setIsCartOpen,
    setIsCustomizing,
    setIsCheckoutOpen,
  };
};

export default useCart;

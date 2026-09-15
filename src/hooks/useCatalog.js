import { useEffect, useState, useCallback } from "react";
import {
  getCategories,
  getProducts,
  getSettings,
  subscribeToCatalog,
  invalidateCatalog,
} from "../data/dataSource";
import {
  categories as localCategories,
  products as localProducts,
  info as localInfo,
} from "../data/menu";


/**
 * Conecta la tienda con la capa de datos (dataSource).
 *
 * Estado inicial = datos locales (menú.js) → cero flash de carga y la tienda
 * se ve idéntica a hoy. Luego hace swap transparente a Supabase si está
 * configurado, y se re-suscribe a cambios en tiempo real (cuando el admin
 * edita algo, la tienda se actualiza sola).
 */
const useCatalog = () => {
  // Estado inicial sincrónico con datos locales (comportamiento actual).
  // Se excluye "Todo": es una categoría fija que Menu.jsx agrega siempre.
  const [categories, setCategories] = useState(
    localCategories.filter((c) => c.id !== "Todo"),
  );
  const [products, setProducts] = useState(localProducts);
  const [settings, setSettings] = useState({
    offersDelivery: false,
    offersPickup: false,
    freeDeliveryThreshold: 0,
  });

  const load = useCallback(async () => {
    const [cats, prods, sett] = await Promise.all([
      getCategories(),
      getProducts(),
      getSettings(),
    ]);
    setCategories(cats);
    // Los productos agotados (disponible=false, editables desde la BD/panel)
    // no se muestran en la tienda. La lógica de "mostrar agotado tachado"
    // llegará con el pulido del panel (F8).
    setProducts(prods.filter((p) => p.disponible !== false));
    console.log("useCatalog",sett);
    setSettings(sett);
  }, []);

  useEffect(() => {
    let mounted = true;

    load();

    // Realtime: si el admin cambia algo en la BD, refrescamos la tienda
    const unsubscribe = subscribeToCatalog(() => {
      invalidateCatalog();
      if (mounted) load();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [load]);

  return { categories, products, settings, reloadCatalog: load };
};

export default useCatalog;

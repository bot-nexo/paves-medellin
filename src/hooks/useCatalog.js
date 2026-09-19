import { useEffect, useState, useCallback } from "react";
import {
  getCategories,
  getProducts,
  getSettings,
  subscribeToCatalog,
  invalidateCatalog,
} from "../data/dataSource";

/**
 * Conecta la tienda con la capa de datos (dataSource).
 *
 * Estado inicial = vacío. isLoading se maneja para evitar renders rotos 
 * mientras se hace fetch de Supabase.
 */
const useCatalog = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [cats, prods, sett] = await Promise.all([
      getCategories(),
      getProducts(),
      getSettings(),
    ]);
    setCategories(cats);
    setProducts(prods.filter((p) => p.disponible !== false));
    setSettings(sett);
    setIsLoading(false);
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

  return { categories, products, settings, isLoading, reloadCatalog: load };
};

export default useCatalog;

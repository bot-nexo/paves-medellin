import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import {
  Palette,
  LayoutGrid,
  Type,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  Plus,
  Monitor,
  Smartphone,
  Check,
  Layers,
  Gift,
  Tag,
  Store,
  Compass,
  Trash2,
  Edit3,
  CheckCircle2,
  Focus,
  Globe,
} from "lucide-react";
import {
  getCatalogDesign,
  updateCatalogDesign,
  getProducts,
  getCategories,
  getSettings,
  subscribeToCatalog,
  DEFAULT_CATALOG_DESIGN,
  DEFAULT_PROMOTIONS_ITEMS,
  DEFAULT_COMBOS_ITEMS,
} from "../../data/dataSource";
import { estaAbiertoSegunHorario } from "../../utils/horario";
import Hero from "../../components/Hero";
import Promociones from "../../components/Promociones";
import Menu from "../../components/Menu";
import Combos from "../../components/Combos";
import Footer from "../../components/Footer";
import { formatCOP } from "../../utils/price";
import ColorPickerField from "../components/ColorPickerField";
import GradientPickerField from "../components/GradientPickerField";
import "../admin.css";

// Paletas predefinidas para aplicar en 1 clic a TODO el catálogo
const PRESETS = [
  {
    name: "Pavés Gourmet (Oficial)",
    emoji: "🍓",
    desc: "Paleta oficial del logo y estética Saborio: Chocolate oscuro, crema, acentos oro y rojo",
    values: {
      appBg: "#0d0805",
      fontFamily: "Montserrat",
      heroBg: "linear-gradient(180deg, #0d0805 0%, #140c08 100%)",
      heroHeaderBg: "rgba(13, 8, 5, 0.85)",
      heroCtaBg: "#ffcc00",
      heroCtaText: "#120a06",
      heroBadgeBg: "rgba(255, 204, 0, 0.15)",
      heroBadgeText: "#ffcc00",
      heroFloatCartBg: "#ffcc00",
      heroFloatCartText: "#120a06",
      promotionsBg: "#120a06",
      promotionsCardBg: "#180e09",
      promotionsAccent: "#ffcc00",
      combosBg: "#0f0906",
      combosCardBg: "#180e09",
      combosAccent: "#d92b38",
      bgColor: "#0d0805",
      cardBg: "#160e0a",
      headerBadgeBg: "rgba(255, 204, 0, 0.12)",
      headerBadgeText: "#ffcc00",
      textPrimary: "#fdfbf7",
      textMuted: "#bda899",
      borderColor: "rgba(255, 255, 255, 0.08)",
      cardRadius: "22px",
      cardShadow: "md",
      btnPrimaryBg: "#ffcc00",
      btnPrimaryText: "#120a06",
      btnDetailsBg: "rgba(255, 255, 255, 0.05)",
      btnDetailsText: "#e2d5cc",
      btnDetailsBorder: "rgba(255, 255, 255, 0.12)",
      priceTagBg: "#ffcc00",
      priceTagText: "#120a06",
      badgePopularBg: "#ffcc00",
      badgePopularText: "#120a06",
      categoryBarBg: "rgba(20, 12, 8, 0.9)",
      categoryActiveBg: "#ffcc00",
      categoryActiveText: "#120a06",
      categoryInactiveBg: "transparent",
      categoryInactiveText: "#bda899",
      columnsDesktop: "auto",
      columnsMobile: "1",
      cardLayout: "vertical",
      imageAspectRatio: "16/11",
      footerBg: "linear-gradient(180deg, #0d0805 0%, #060402 100%)",
      footerText: "rgba(253, 251, 247, 0.7)",
      footerAccent: "#ffcc00",
    },
  },
  {
    name: "Choco Noir & Gold",
    emoji: "🍫",
    desc: "Tonos oscuros chocolate y acentos dorados gourmet",
    values: {
      appBg: "#140e0a",
      fontFamily: "Playfair Display",
      heroBg: "linear-gradient(180deg, #1c1410 0%, #2b1e17 100%)",
      heroHeaderBg: "rgba(43, 30, 23, 0.85)",
      heroCtaBg: "#d4af37",
      heroCtaText: "#1c1410",
      heroBadgeBg: "rgba(212, 175, 55, 0.2)",
      heroBadgeText: "#e5c058",
      heroFloatCartBg: "#d4af37",
      heroFloatCartText: "#1c1410",
      promotionsBg: "#1c1410",
      promotionsCardBg: "#2b1e17",
      promotionsAccent: "#d4af37",
      combosBg: "#18110d",
      combosCardBg: "#2b1e17",
      combosAccent: "#d4af37",
      bgColor: "#1c1410",
      cardBg: "#2b1e17",
      headerBadgeBg: "rgba(212, 175, 55, 0.15)",
      headerBadgeText: "#e5c058",
      textPrimary: "#fdfbf7",
      textMuted: "#d4c5b9",
      borderColor: "rgba(212, 175, 55, 0.25)",
      cardRadius: "16px",
      cardShadow: "md",
      btnPrimaryBg: "#d4af37",
      btnPrimaryText: "#1c1410",
      btnDetailsBg: "transparent",
      btnDetailsText: "#e5c058",
      btnDetailsBorder: "rgba(212, 175, 55, 0.4)",
      priceTagBg: "#d4af37",
      priceTagText: "#1c1410",
      badgePopularBg: "#d4af37",
      badgePopularText: "#1c1410",
      categoryBarBg: "rgba(43, 30, 23, 0.8)",
      categoryActiveBg: "#d4af37",
      categoryActiveText: "#1c1410",
      categoryInactiveBg: "transparent",
      categoryInactiveText: "#d4c5b9",
      columnsDesktop: "auto",
      columnsMobile: "1",
      cardLayout: "vertical",
      imageAspectRatio: "4/3",
      footerBg: "#0f0a07",
      footerText: "rgba(245, 235, 225, 0.7)",
      footerAccent: "#d4af37",
    },
  },
  {
    name: "Pastelería Rosa",
    emoji: "🌸",
    desc: "Estilo dulce, tonos pasteles y blancos puros",
    values: {
      appBg: "#fff5f7",
      fontFamily: "Poppins",
      heroBg: "linear-gradient(180deg, #fff0f3 0%, #ffccd5 100%)",
      heroHeaderBg: "rgba(255, 255, 255, 0.85)",
      heroCtaBg: "#ff4d6d",
      heroCtaText: "#ffffff",
      heroBadgeBg: "rgba(255, 77, 109, 0.15)",
      heroBadgeText: "#ff4d6d",
      heroFloatCartBg: "#590d22",
      heroFloatCartText: "#ffffff",
      promotionsBg: "#fff0f3",
      promotionsCardBg: "#ffffff",
      promotionsAccent: "#ff4d6d",
      combosBg: "#fff5f7",
      combosCardBg: "#ffffff",
      combosAccent: "#ff4d6d",
      bgColor: "#fff0f3",
      cardBg: "#ffffff",
      headerBadgeBg: "rgba(255, 77, 109, 0.12)",
      headerBadgeText: "#ff4d6d",
      textPrimary: "#590d22",
      textMuted: "#a4133c",
      borderColor: "rgba(255, 77, 109, 0.15)",
      cardRadius: "24px",
      cardShadow: "lg",
      btnPrimaryBg: "#ff4d6d",
      btnPrimaryText: "#ffffff",
      btnDetailsBg: "transparent",
      btnDetailsText: "#590d22",
      btnDetailsBorder: "rgba(255, 77, 109, 0.25)",
      priceTagBg: "#800f2f",
      priceTagText: "#ffffff",
      badgePopularBg: "#ff4d6d",
      badgePopularText: "#ffffff",
      categoryBarBg: "rgba(255, 255, 255, 0.85)",
      categoryActiveBg: "#ff4d6d",
      categoryActiveText: "#ffffff",
      categoryInactiveBg: "transparent",
      categoryInactiveText: "#a4133c",
      columnsDesktop: "auto",
      columnsMobile: "1",
      cardLayout: "vertical",
      imageAspectRatio: "4/3",
      footerBg: "linear-gradient(180deg, #2b0813 0%, #150308 100%)",
      footerText: "rgba(255, 225, 235, 0.8)",
      footerAccent: "#ff4d6d",
    },
  },
  {
    name: "Menta & Frutas",
    emoji: "🍃",
    desc: "Frescura botánica y tonos verdes gourmet",
    values: {
      appBg: "#f4fbf6",
      fontFamily: "Outfit",
      heroBg: "linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 100%)",
      heroHeaderBg: "rgba(255, 255, 255, 0.85)",
      heroCtaBg: "#2e7d32",
      heroCtaText: "#ffffff",
      heroBadgeBg: "rgba(46, 125, 50, 0.15)",
      heroBadgeText: "#2e7d32",
      heroFloatCartBg: "#1b5e20",
      heroFloatCartText: "#ffffff",
      promotionsBg: "#e8f5e9",
      promotionsCardBg: "#ffffff",
      promotionsAccent: "#2e7d32",
      combosBg: "#f1f8f3",
      combosCardBg: "#ffffff",
      combosAccent: "#2e7d32",
      bgColor: "#e8f5e9",
      cardBg: "#ffffff",
      headerBadgeBg: "rgba(46, 125, 50, 0.15)",
      headerBadgeText: "#2e7d32",
      textPrimary: "#1b5e20",
      textMuted: "#388e3c",
      borderColor: "rgba(46, 125, 50, 0.15)",
      cardRadius: "18px",
      cardShadow: "md",
      btnPrimaryBg: "#2e7d32",
      btnPrimaryText: "#ffffff",
      btnDetailsBg: "transparent",
      btnDetailsText: "#1b5e20",
      btnDetailsBorder: "rgba(46, 125, 50, 0.25)",
      priceTagBg: "#1b5e20",
      priceTagText: "#ffffff",
      badgePopularBg: "#2e7d32",
      badgePopularText: "#ffffff",
      categoryBarBg: "rgba(255, 255, 255, 0.85)",
      categoryActiveBg: "#2e7d32",
      categoryActiveText: "#ffffff",
      categoryInactiveBg: "transparent",
      categoryInactiveText: "#388e3c",
      columnsDesktop: "auto",
      columnsMobile: "1",
      cardLayout: "vertical",
      imageAspectRatio: "4/3",
      footerBg: "linear-gradient(180deg, #0d2810 0%, #051408 100%)",
      footerText: "rgba(235, 250, 240, 0.75)",
      footerAccent: "#4caf50",
    },
  },
  {
    name: "Minimalista Moderno",
    emoji: "⚪",
    desc: "Gris sutil, alto contraste y diseño pulcro",
    values: {
      appBg: "#ffffff",
      fontFamily: "Inter",
      heroBg: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
      heroHeaderBg: "rgba(255, 255, 255, 0.9)",
      heroCtaBg: "#0f172a",
      heroCtaText: "#ffffff",
      heroBadgeBg: "rgba(15, 23, 42, 0.08)",
      heroBadgeText: "#0f172a",
      heroFloatCartBg: "#0f172a",
      heroFloatCartText: "#ffffff",
      promotionsBg: "#f8fafc",
      promotionsCardBg: "#ffffff",
      promotionsAccent: "#0f172a",
      combosBg: "#f1f5f9",
      combosCardBg: "#ffffff",
      combosAccent: "#0f172a",
      bgColor: "#f8fafc",
      cardBg: "#ffffff",
      headerBadgeBg: "rgba(15, 23, 42, 0.08)",
      headerBadgeText: "#0f172a",
      textPrimary: "#0f172a",
      textMuted: "#64748b",
      borderColor: "rgba(226, 232, 240, 1)",
      cardRadius: "12px",
      cardShadow: "sm",
      btnPrimaryBg: "#0f172a",
      btnPrimaryText: "#ffffff",
      btnDetailsBg: "transparent",
      btnDetailsText: "#0f172a",
      btnDetailsBorder: "rgba(203, 213, 225, 1)",
      priceTagBg: "#0f172a",
      priceTagText: "#ffffff",
      badgePopularBg: "#0f172a",
      badgePopularText: "#ffffff",
      categoryBarBg: "#ffffff",
      categoryActiveBg: "#0f172a",
      categoryActiveText: "#ffffff",
      categoryInactiveBg: "transparent",
      categoryInactiveText: "#64748b",
      columnsDesktop: "auto",
      columnsMobile: "1",
      cardLayout: "vertical",
      imageAspectRatio: "4/3",
      footerBg: "#0f172a",
      footerText: "rgba(241, 245, 249, 0.8)",
      footerAccent: "#94a3b8",
    },
  },
];

const FONTS = [
  { id: "Montserrat", label: "Montserrat (Original Moderno)" },
  { id: "Poppins", label: "Poppins (Geométrico Amigable)" },
  { id: "Inter", label: "Inter (Limpio & Minimalista)" },
  { id: "Outfit", label: "Outfit (Elegante & Redondeado)" },
  { id: "Playfair Display", label: "Playfair Display (Gourmet Clásico)" },
];

const Diseno = () => {
  const [form, setForm] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop"); // desktop | mobile
  const [previewMode, setPreviewMode] = useState("section"); // section | full
  const [activeTab, setActiveTab] = useState("presets"); // presets | hero | promos | combos | menu | footer | typography

  const heroRef = useRef(null);
  const promosRef = useRef(null);
  const menuRef = useRef(null);
  const combosRef = useRef(null);
  const footerRef = useRef(null);
  const viewportRef = useRef(null);

  // Carga de configuración de diseño y catálogo real de la Base de Datos
  const cargarDatos = useCallback(async () => {
    try {
      const [d, prods, cats, sett] = await Promise.all([
        getCatalogDesign(),
        getProducts(),
        getCategories(),
        getSettings(),
      ]);
      setForm(d || { ...DEFAULT_CATALOG_DESIGN });
      setProducts(prods || []);
      setCategories(cats || []);
      setSettings(sett || {});
    } catch (e) {
      Swal.fire({
        title: "Error al cargar datos del catálogo",
        text: e.message,
        icon: "error",
        confirmButtonColor: "#3D2314",
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();

    // Sincronización en tiempo real con Supabase
    const unsubscribe = subscribeToCatalog(() => {
      cargarDatos();
    });

    return () => unsubscribe();
  }, [cargarDatos]);

  // Desplazamiento automático suave a la sección en el simulador completo
  useEffect(() => {
    if (previewMode !== "full") return;
    const timer = setTimeout(() => {
      const refMap = {
        hero: heroRef,
        promos: promosRef,
        menu: menuRef,
        combos: combosRef,
        footer: footerRef,
      };
      const target = refMap[activeTab];
      if (target?.current) {
        target.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [activeTab, previewMode]);

  const estadoNegocio = useMemo(() => estaAbiertoSegunHorario(settings), [settings]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      ...preset.values,
    }));
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `Tema "${preset.name}" aplicado al catálogo`,
      showConfirmButton: false,
      timer: 1800,
    });
  };

  const resetToDefaults = () => {
    Swal.fire({
      title: "¿Restablecer diseño completo?",
      text: "Se volverán a colocar los colores y secciones originales por defecto.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, restablecer",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d92b38",
      cancelButtonColor: "#666",
    }).then((res) => {
      if (res.isConfirmed) {
        setForm({ ...DEFAULT_CATALOG_DESIGN });
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "info",
          title: "Diseño restablecido a valores por defecto",
          showConfirmButton: false,
          timer: 1800,
        });
      }
    });
  };

  const guardar = async (e) => {
    if (e) e.preventDefault();
    setGuardando(true);
    try {
      await updateCatalogDesign(form);
      Swal.fire({
        icon: "success",
        title: "¡Diseño Integral Guardado!",
        text: "Hero, promociones, combos, menú y pie de página actualizados en tiempo real.",
        confirmButtonColor: "#3D2314",
      });
    } catch (err) {
      Swal.fire({
        title: "No se pudo guardar",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#3D2314",
      });
    } finally {
      setGuardando(false);
    }
  };

  // ── Gestor de Promociones en caliente ──
  const handleAddPromo = () => {
    const nueva = {
      id: `promo-${Date.now()}`,
      titulo: "Nueva Promoción",
      tag: "Oferta Especial",
      descripcion: "Descripción de la oferta o beneficio para el cliente.",
      descuento: "20% OFF",
      imagen: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80",
    };
    setForm((prev) => ({
      ...prev,
      promotionsItems: [...(prev.promotionsItems || []), nueva],
    }));
  };

  const handleUpdatePromo = (index, field, val) => {
    setForm((prev) => {
      const items = [...(prev.promotionsItems || [])];
      items[index] = { ...items[index], [field]: val };
      return { ...prev, promotionsItems: items };
    });
  };

  const handleRemovePromo = (index) => {
    setForm((prev) => {
      const items = (prev.promotionsItems || []).filter((_, i) => i !== index);
      return { ...prev, promotionsItems: items };
    });
  };

  // ── Gestor de Combos en caliente ──
  const handleAddCombo = () => {
    const nuevo = {
      id: `combo-${Date.now()}`,
      nombre: "Nuevo Combo Dulce",
      precio: 35000,
      precioOriginal: 42000,
      badge: "Ahorra $7.000",
      descripcion: "Combinación de postres para compartir.",
      incluye: ["1x Pavé 8oz", "1x Bebida o Torta"],
      imagen: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80",
    };
    setForm((prev) => ({
      ...prev,
      combosItems: [...(prev.combosItems || []), nuevo],
    }));
  };

  const handleUpdateCombo = (index, field, val) => {
    setForm((prev) => {
      const items = [...(prev.combosItems || [])];
      items[index] = { ...items[index], [field]: val };
      return { ...prev, combosItems: items };
    });
  };

  const handleRemoveCombo = (index) => {
    setForm((prev) => {
      const items = (prev.combosItems || []).filter((_, i) => i !== index);
      return { ...prev, combosItems: items };
    });
  };

  if (cargando || !form) {
    return <LoadingOverlay fullScreen text="Cargando estudio de diseño integral…" />;
  }

  return (
    <div className="admin-page admin-page--diseno">
      {guardando && <LoadingOverlay text="Sincronizando diseño del catálogo completo…" />}

      <header className="admin-page__header">
        <div className="admin-page__header-title-wrap">
          <h1 className="admin-page__titulo">Diseño Integral del Catálogo</h1>
          <p className="admin-page__sub">
            Personaliza Hero, Promociones, Menú, Combos, Footer y la tipografía en toda la tienda.
          </p>
        </div>

        <div className="admin-page__header-actions" style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className="admin-btn-ghost"
            onClick={resetToDefaults}
            title="Restablecer diseño predeterminado"
          >
            <RotateCcw size={15} /> Restablecer
          </button>
          <button
            type="button"
            className="admin-btn-primary admin-btn-primary--compacto"
            onClick={guardar}
            disabled={guardando}
          >
            <Save size={15} /> Guardar Todo
          </button>
        </div>
      </header>

      {/* Contenedor Principal */}
      <div className="diseno-workspace">
        {/* Columna Izquierda: Pestañas y Controles de Configuración */}
        <div className="diseno-controls-panel">
          <nav className="diseno-tabs">
            <button
              type="button"
              className={`diseno-tab ${activeTab === "presets" ? "diseno-tab--active" : ""}`}
              onClick={() => setActiveTab("presets")}
            >
              <Sparkles size={16} /> Paletas 1-Clic
            </button>
            <button
              type="button"
              className={`diseno-tab ${activeTab === "hero" ? "diseno-tab--active" : ""}`}
              onClick={() => setActiveTab("hero")}
            >
              <Compass size={16} /> Hero & Header
            </button>
            <button
              type="button"
              className={`diseno-tab ${activeTab === "promos" ? "diseno-tab--active" : ""}`}
              onClick={() => setActiveTab("promos")}
            >
              <Tag size={16} /> Promociones
            </button>
            <button
              type="button"
              className={`diseno-tab ${activeTab === "combos" ? "diseno-tab--active" : ""}`}
              onClick={() => setActiveTab("combos")}
            >
              <Gift size={16} /> Combos & Packs
            </button>
            <button
              type="button"
              className={`diseno-tab ${activeTab === "menu" ? "diseno-tab--active" : ""}`}
              onClick={() => setActiveTab("menu")}
            >
              <LayoutGrid size={16} /> Menú & Tarjetas
            </button>
            <button
              type="button"
              className={`diseno-tab ${activeTab === "footer" ? "diseno-tab--active" : ""}`}
              onClick={() => setActiveTab("footer")}
            >
              <Store size={16} /> Footer
            </button>
            <button
              type="button"
              className={`diseno-tab ${activeTab === "typography" ? "diseno-tab--active" : ""}`}
              onClick={() => setActiveTab("typography")}
            >
              <Type size={16} /> Tipografía & Fondo
            </button>
          </nav>

          <div className="diseno-tab-content admin-card">
            {/* TAB 1: PRESETS / PALETAS */}
            {activeTab === "presets" && (
              <div className="diseno-fields-group">
                <h3 className="diseno-group-title">
                  <Sparkles size={16} /> Temas y Paletas Coordinadas (1-Clic)
                </h3>
                <p style={{ fontSize: "0.84rem", color: "var(--texto-dim)" }}>
                  Aplica una estética completa coordinada en todas las secciones de tu tienda instantáneamente.
                </p>

                <div className="diseno-presets-grid" style={{ marginTop: "1rem" }}>
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      className="diseno-preset-chip"
                      onClick={() => applyPreset(p)}
                      title={p.desc}
                    >
                      <span className="diseno-preset-emoji">{p.emoji}</span>
                      <div className="diseno-preset-info">
                        <strong className="diseno-preset-name">{p.name}</strong>
                        <span style={{ fontSize: "0.72rem", color: "var(--texto-dim)" }}>{p.desc}</span>
                        <div className="diseno-preset-colors">
                          <span style={{ background: p.values.heroBg }} />
                          <span style={{ background: p.values.cardBg }} />
                          <span style={{ background: p.values.btnPrimaryBg }} />
                          <span style={{ background: p.values.textPrimary }} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: HERO & CABECERA */}
            {activeTab === "hero" && (
              <div className="diseno-fields-group">
                <h3 className="diseno-group-title">
                  <Compass size={16} /> Personalización del Hero y Encabezado
                </h3>

                {/* Gradiente / Fondo de Hero */}
                <GradientPickerField
                  label="Fondo del Hero Principal (Gradiente o Color Sólido)"
                  value={form.heroBg}
                  onChange={(v) => handleChange("heroBg", v)}
                  description="Fondo de la portada principal con el carrusel de postres destacados."
                />

                <ColorPickerField
                  label="Fondo del Header Glass (Barra de Navegación)"
                  value={form.heroHeaderBg}
                  onChange={(v) => handleChange("heroHeaderBg", v)}
                  placeholder="rgba(255, 255, 255, 0.72)"
                  description="Efecto cristal translúcido detrás del logotipo y botón de ver menú."
                />

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label='Botón "Ver Menú" (Fondo)'
                    value={form.heroCtaBg}
                    onChange={(v) => handleChange("heroCtaBg", v)}
                  />
                  <ColorPickerField
                    label='Botón "Ver Menú" (Texto)'
                    value={form.heroCtaText}
                    onChange={(v) => handleChange("heroCtaText", v)}
                  />
                </div>

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label="Botón Flotante Carrito (Fondo)"
                    value={form.heroFloatCartBg}
                    onChange={(v) => handleChange("heroFloatCartBg", v)}
                  />
                  <ColorPickerField
                    label="Botón Flotante Carrito (Texto / Icono)"
                    value={form.heroFloatCartText}
                    onChange={(v) => handleChange("heroFloatCartText", v)}
                  />
                </div>

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label='Badge "Destacado" en Portada (Fondo)'
                    value={form.heroBadgeBg}
                    onChange={(v) => handleChange("heroBadgeBg", v)}
                    placeholder="rgba(255, 255, 255, 0.92)"
                  />
                  <ColorPickerField
                    label='Badge "Destacado" en Portada (Texto)'
                    value={form.heroBadgeText}
                    onChange={(v) => handleChange("heroBadgeText", v)}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PROMOCIONES */}
            {activeTab === "promos" && (
              <div className="diseno-fields-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 className="diseno-group-title" style={{ margin: 0 }}>
                    <Tag size={16} /> Sección de Promociones & Descuentos
                  </h3>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--acento)" }}>
                    <input
                      type="checkbox"
                      checked={form.showPromotions}
                      onChange={(e) => handleChange("showPromotions", e.target.checked)}
                    />
                    <span>Mostrar Sección en Catálogo</span>
                  </label>
                </div>

                <div className="diseno-grid-2">
                  <label className="admin-field">
                    <span className="admin-field__label">Título de la Sección</span>
                    <input
                      type="text"
                      value={form.promotionsTitle}
                      onChange={(e) => handleChange("promotionsTitle", e.target.value)}
                      className="admin-field__input"
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field__label">Subtítulo Descriptivo</span>
                    <input
                      type="text"
                      value={form.promotionsSubtitle}
                      onChange={(e) => handleChange("promotionsSubtitle", e.target.value)}
                      className="admin-field__input"
                    />
                  </label>
                </div>

                {/* Fondo de Promociones con Selector de Gradientes */}
                <GradientPickerField
                  label="Fondo de la Sección Promociones"
                  value={form.promotionsBg}
                  onChange={(v) => handleChange("promotionsBg", v)}
                  description="Color o gradiente detrás del bloque de promociones."
                />

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label="Fondo de Tarjetas de Promoción"
                    value={form.promotionsCardBg}
                    onChange={(v) => handleChange("promotionsCardBg", v)}
                  />
                  <ColorPickerField
                    label="Color de Acento / Etiqueta Descuento"
                    value={form.promotionsAccent}
                    onChange={(v) => handleChange("promotionsAccent", v)}
                  />
                </div>

                {/* Lista de Promociones */}
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--crema)" }}>
                      Tarjetas de Promociones Activas ({form.promotionsItems?.length || 0}):
                    </span>
                    <button
                      type="button"
                      className="admin-btn-ghost"
                      onClick={handleAddPromo}
                      style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem" }}
                    >
                      <Plus size={14} /> Añadir Promo
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {(form.promotionsItems || []).map((promo, idx) => (
                      <div
                        key={promo.id || idx}
                        style={{
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--aborde)",
                          borderRadius: "10px",
                          padding: "0.85rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
                          <input
                            type="text"
                            placeholder="Título Promo"
                            value={promo.titulo}
                            onChange={(e) => handleUpdatePromo(idx, "titulo", e.target.value)}
                            className="admin-field__input"
                            style={{ fontWeight: 700 }}
                          />
                          <input
                            type="text"
                            placeholder="Descuento (ej: 2x1)"
                            value={promo.descuento}
                            onChange={(e) => handleUpdatePromo(idx, "descuento", e.target.value)}
                            className="admin-field__input"
                            style={{ width: "120px" }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePromo(idx)}
                            style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer" }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Descripción breve de la promo"
                          value={promo.descripcion}
                          onChange={(e) => handleUpdatePromo(idx, "descripcion", e.target.value)}
                          className="admin-field__input"
                          style={{ fontSize: "0.8rem" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: COMBOS & PACKS */}
            {activeTab === "combos" && (
              <div className="diseno-fields-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 className="diseno-group-title" style={{ margin: 0 }}>
                    <Gift size={16} /> Sección de Combos Especiales
                  </h3>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--acento)" }}>
                    <input
                      type="checkbox"
                      checked={form.showCombos}
                      onChange={(e) => handleChange("showCombos", e.target.checked)}
                    />
                    <span>Mostrar Sección en Catálogo</span>
                  </label>
                </div>

                <div className="diseno-grid-2">
                  <label className="admin-field">
                    <span className="admin-field__label">Título de la Sección</span>
                    <input
                      type="text"
                      value={form.combosTitle}
                      onChange={(e) => handleChange("combosTitle", e.target.value)}
                      className="admin-field__input"
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field__label">Subtítulo Descriptivo</span>
                    <input
                      type="text"
                      value={form.combosSubtitle}
                      onChange={(e) => handleChange("combosSubtitle", e.target.value)}
                      className="admin-field__input"
                    />
                  </label>
                </div>

                {/* Fondo de Combos con Selector de Gradientes */}
                <GradientPickerField
                  label="Fondo de la Sección Combos"
                  value={form.combosBg}
                  onChange={(v) => handleChange("combosBg", v)}
                  description="Color o gradiente detrás del bloque de combos y packs."
                />

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label="Fondo de Tarjetas de Combo"
                    value={form.combosCardBg}
                    onChange={(v) => handleChange("combosCardBg", v)}
                  />
                  <ColorPickerField
                    label="Color de Acento / Badge de Ahorro"
                    value={form.combosAccent}
                    onChange={(v) => handleChange("combosAccent", v)}
                  />
                </div>

                {/* Lista de Combos */}
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--crema)" }}>
                      Combos Disponibles ({form.combosItems?.length || 0}):
                    </span>
                    <button
                      type="button"
                      className="admin-btn-ghost"
                      onClick={handleAddCombo}
                      style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem" }}
                    >
                      <Plus size={14} /> Añadir Combo
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {(form.combosItems || []).map((combo, idx) => (
                      <div
                        key={combo.id || idx}
                        style={{
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--aborde)",
                          borderRadius: "10px",
                          padding: "0.85rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
                          <input
                            type="text"
                            placeholder="Nombre del Combo"
                            value={combo.nombre}
                            onChange={(e) => handleUpdateCombo(idx, "nombre", e.target.value)}
                            className="admin-field__input"
                            style={{ fontWeight: 700 }}
                          />
                          <input
                            type="number"
                            placeholder="Precio COP"
                            value={combo.precio}
                            onChange={(e) => handleUpdateCombo(idx, "precio", Number(e.target.value))}
                            className="admin-field__input"
                            style={{ width: "110px" }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCombo(idx)}
                            style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer" }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Descripción breve del combo"
                          value={combo.descripcion}
                          onChange={(e) => handleUpdateCombo(idx, "descripcion", e.target.value)}
                          className="admin-field__input"
                          style={{ fontSize: "0.8rem" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: MENÚ & TARJETAS */}
            {activeTab === "menu" && (
              <div className="diseno-fields-group">
                <h3 className="diseno-group-title">
                  <LayoutGrid size={16} /> Estilos del Menú y Tarjetas de Productos
                </h3>

                {/* Fondo de Menú con GradientPickerField */}
                <GradientPickerField
                  label="Fondo de la Sección del Menú"
                  value={form.bgColor}
                  onChange={(v) => handleChange("bgColor", v)}
                  description="Fondo principal que envuelve toda la lista de postres y productos."
                />

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label="Fondo de Tarjeta de Producto"
                    value={form.cardBg}
                    onChange={(v) => handleChange("cardBg", v)}
                  />
                  <ColorPickerField
                    label="Color de Bordes de Tarjeta"
                    value={form.borderColor}
                    onChange={(v) => handleChange("borderColor", v)}
                    placeholder="rgba(61, 35, 20, 0.08)"
                  />
                </div>

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label="Color de Títulos y Nombres"
                    value={form.textPrimary}
                    onChange={(v) => handleChange("textPrimary", v)}
                  />
                  <ColorPickerField
                    label="Color de Descripciones y Detalles"
                    value={form.textMuted}
                    onChange={(v) => handleChange("textMuted", v)}
                  />
                </div>

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label='Botón "+ Agregar" (Fondo)'
                    value={form.btnPrimaryBg}
                    onChange={(v) => handleChange("btnPrimaryBg", v)}
                  />
                  <ColorPickerField
                    label='Botón "+ Agregar" (Texto)'
                    value={form.btnPrimaryText}
                    onChange={(v) => handleChange("btnPrimaryText", v)}
                  />
                </div>

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label="Etiqueta de Precio (Fondo)"
                    value={form.priceTagBg}
                    onChange={(v) => handleChange("priceTagBg", v)}
                  />
                  <ColorPickerField
                    label="Etiqueta de Precio (Texto)"
                    value={form.priceTagText}
                    onChange={(v) => handleChange("priceTagText", v)}
                  />
                </div>

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label='Insignia "Más Pedido" (Fondo)'
                    value={form.badgePopularBg}
                    onChange={(v) => handleChange("badgePopularBg", v)}
                  />
                  <ColorPickerField
                    label='Insignia "Más Pedido" (Texto)'
                    value={form.badgePopularText}
                    onChange={(v) => handleChange("badgePopularText", v)}
                  />
                </div>

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label="Barra de Categorías (Fondo)"
                    value={form.categoryBarBg}
                    onChange={(v) => handleChange("categoryBarBg", v)}
                    placeholder="rgba(255, 255, 255, 0.7)"
                  />
                  <ColorPickerField
                    label="Categoría Activa (Fondo Botón)"
                    value={form.categoryActiveBg}
                    onChange={(v) => handleChange("categoryActiveBg", v)}
                  />
                </div>

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label="Categoría Activa (Texto Botón)"
                    value={form.categoryActiveText}
                    onChange={(v) => handleChange("categoryActiveText", v)}
                  />
                  <ColorPickerField
                    label="Categorías Inactivas (Texto)"
                    value={form.categoryInactiveText}
                    onChange={(v) => handleChange("categoryInactiveText", v)}
                  />
                </div>

                {/* Disposición y Columnas */}
                <h4 style={{ fontSize: "0.88rem", color: "var(--acento)", marginTop: "0.5rem", marginBottom: "0.2rem" }}>
                  📐 Disposición y Estructura de Cuadrícula
                </h4>

                <div className="diseno-grid-2">
                  <label className="admin-field">
                    <span className="admin-field__label">Columnas en Pantalla Grande (Desktop)</span>
                    <select
                      value={form.columnsDesktop}
                      onChange={(e) => handleChange("columnsDesktop", e.target.value)}
                      className="admin-field__input"
                    >
                      <option value="auto">Automático Adaptable (Min 280px)</option>
                      <option value="2">2 Columnas (Grandes & Destacadas)</option>
                      <option value="3">3 Columnas (Equilibrado)</option>
                      <option value="4">4 Columnas (Compacto)</option>
                    </select>
                  </label>

                  <label className="admin-field">
                    <span className="admin-field__label">Columnas en Celular (Mobile)</span>
                    <select
                      value={form.columnsMobile}
                      onChange={(e) => handleChange("columnsMobile", e.target.value)}
                      className="admin-field__input"
                    >
                      <option value="1">1 Columna (Vertical Clásico)</option>
                      <option value="2">2 Columnas (Vista Catálogo Compacto)</option>
                    </select>
                  </label>
                </div>

                <div className="diseno-grid-2">
                  <label className="admin-field">
                    <span className="admin-field__label">Formato de Tarjeta</span>
                    <select
                      value={form.cardLayout}
                      onChange={(e) => handleChange("cardLayout", e.target.value)}
                      className="admin-field__input"
                    >
                      <option value="vertical">Vertical Estándar (Imagen arriba)</option>
                      <option value="horizontal">Horizontal Compacto (Imagen lateral)</option>
                    </select>
                  </label>

                  <label className="admin-field">
                    <span className="admin-field__label">Proporción de Imagen</span>
                    <select
                      value={form.imageAspectRatio}
                      onChange={(e) => handleChange("imageAspectRatio", e.target.value)}
                      className="admin-field__input"
                    >
                      <option value="4/3">4:3 (Estándar fotográfico)</option>
                      <option value="1/1">1:1 (Cuadrada)</option>
                      <option value="16/9">16:9 (Panorámica)</option>
                      <option value="16/10">16:10 (Compacta)</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 6: FOOTER */}
            {activeTab === "footer" && (
              <div className="diseno-fields-group">
                <h3 className="diseno-group-title">
                  <Store size={16} /> Estilos del Footer y Pie de Página
                </h3>

                {/* Gradiente / Fondo de Footer */}
                <GradientPickerField
                  label="Fondo del Footer (Gradiente o Color Sólido)"
                  value={form.footerBg}
                  onChange={(v) => handleChange("footerBg", v)}
                  description="Gradiente o color oscuro/claro para la sección final del catálogo."
                />

                <div className="diseno-grid-2">
                  <ColorPickerField
                    label="Color de Textos del Footer"
                    value={form.footerText}
                    onChange={(v) => handleChange("footerText", v)}
                    placeholder="rgba(255, 255, 255, 0.7)"
                  />
                  <ColorPickerField
                    label="Color de Acento / Enlaces / Marca"
                    value={form.footerAccent}
                    onChange={(v) => handleChange("footerAccent", v)}
                  />
                </div>
              </div>
            )}

            {/* TAB 7: TIPOGRAFÍA & FONDO GLOBAL */}
            {activeTab === "typography" && (
              <div className="diseno-fields-group">
                <h3 className="diseno-group-title">
                  <Type size={16} /> Tipografía & Fondo Global de la Tienda
                </h3>

                <label className="admin-field">
                  <span className="admin-field__label">Fuente Tipográfica de la Tienda</span>
                  <select
                    value={form.fontFamily}
                    onChange={(e) => handleChange("fontFamily", e.target.value)}
                    className="admin-field__input"
                  >
                    {FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Fondo Global de la Tienda */}
                <GradientPickerField
                  label="Fondo Global de la Aplicación (Body / Tienda Completa)"
                  value={form.appBg}
                  onChange={(v) => handleChange("appBg", v)}
                  description="Color o gradiente base de fondo en todo el viewport."
                />
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: LIVE PREVIEW INTERACTIVO INTEGRAL (CONECTADO A BD) */}
        <aside className="diseno-preview-panel">
          <div className="diseno-preview-header">
            <div className="diseno-preview-title">
              <Eye size={16} />
              <span>Simulador en Vivo (Datos Reales BD)</span>
            </div>

            <div className="diseno-preview-controls-row">
              {/* Selector de Modo: Sección vs Catálogo Completo */}
              <div className="diseno-mode-toggle">
                <button
                  type="button"
                  className={`diseno-mode-btn ${previewMode === "section" ? "diseno-mode-btn--active" : ""}`}
                  onClick={() => setPreviewMode("section")}
                  title="Ver únicamente la sección activa que estás modificando"
                >
                  <Focus size={13} /> Sección Activa
                </button>
                <button
                  type="button"
                  className={`diseno-mode-btn ${previewMode === "full" ? "diseno-mode-btn--active" : ""}`}
                  onClick={() => setPreviewMode("full")}
                  title="Ver todo el catálogo secuencial con auto-scroll a la sección"
                >
                  <Globe size={13} /> Catálogo Completo
                </button>
              </div>

              {/* Selector de Dispositivo: Desktop vs Móvil */}
              <div className="diseno-device-toggle">
                <button
                  type="button"
                  className={`diseno-device-btn ${previewDevice === "desktop" ? "diseno-device-btn--active" : ""}`}
                  onClick={() => setPreviewDevice("desktop")}
                  title="Vista Desktop"
                >
                  <Monitor size={14} /> Desktop
                </button>
                <button
                  type="button"
                  className={`diseno-device-btn ${previewDevice === "mobile" ? "diseno-device-btn--active" : ""}`}
                  onClick={() => setPreviewDevice("mobile")}
                  title="Vista Móvil"
                >
                  <Smartphone size={14} /> Móvil
                </button>
              </div>
            </div>
          </div>

          <div
            ref={viewportRef}
            className={`diseno-preview-viewport ${previewDevice === "mobile" ? "diseno-preview-viewport--mobile" : ""}`}
            style={{
              backgroundColor: form.appBg || "#fdfbf7",
              fontFamily: form.fontFamily,
            }}
          >
            {/* MODO 1: SECCIÓN ACTIVA ESPECÍFICA */}
            {previewMode === "section" && (
              <div>
                {activeTab === "hero" && (
                  <div>
                    <div className="diseno-section-badge">
                      <Compass size={14} /> Vista de Sección: Hero & Header Principal
                    </div>
                    <Hero
                      cartCount={2}
                      onOpenCart={() => {}}
                      estadoNegocio={estadoNegocio}
                      design={form}
                      products={products}
                      settings={settings}
                    />
                  </div>
                )}

                {activeTab === "promos" && (
                  <div>
                    <div className="diseno-section-badge">
                      <Tag size={14} /> Vista de Sección: Promociones & Ofertas
                    </div>
                    {form.showPromotions === false ? (
                      <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "rgba(211, 47, 47, 0.08)", borderRadius: "14px", color: "#d32f2f", border: "1px dashed rgba(211, 47, 47, 0.3)" }}>
                        <Tag size={32} style={{ margin: "0 auto 0.5rem" }} />
                        <strong style={{ display: "block", fontSize: "0.95rem" }}>Sección de Promociones Oculta</strong>
                        <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>Activa el interruptor en la pestaña de la izquierda para mostrarla en la tienda.</span>
                      </div>
                    ) : (
                      <Promociones design={form} />
                    )}
                  </div>
                )}

                {activeTab === "combos" && (
                  <div>
                    <div className="diseno-section-badge">
                      <Gift size={14} /> Vista de Sección: Combos & Packs para Compartir
                    </div>
                    {form.showCombos === false ? (
                      <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "rgba(211, 47, 47, 0.08)", borderRadius: "14px", color: "#d32f2f", border: "1px dashed rgba(211, 47, 47, 0.3)" }}>
                        <Gift size={32} style={{ margin: "0 auto 0.5rem" }} />
                        <strong style={{ display: "block", fontSize: "0.95rem" }}>Sección de Combos Oculta</strong>
                        <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>Activa el interruptor en la pestaña de la izquierda para mostrarla en la tienda.</span>
                      </div>
                    ) : (
                      <Combos design={form} onAddToCart={() => {}} />
                    )}
                  </div>
                )}

                {activeTab === "menu" && (
                  <div>
                    <div className="diseno-section-badge">
                      <LayoutGrid size={14} /> Vista de Sección: Menú Digital & Tarjetas ({products.length} productos reales en BD)
                    </div>
                    <Menu
                      data={products}
                      categories={categories}
                      selectedProduct={null}
                      setSelectedProduct={() => {}}
                      addToCart={() => {}}
                      design={form}
                    />
                  </div>
                )}

                {activeTab === "footer" && (
                  <div>
                    <div className="diseno-section-badge">
                      <Store size={14} /> Vista de Sección: Pie de Página (Footer)
                    </div>
                    <Footer settings={settings} design={form} />
                  </div>
                )}

                {(activeTab === "presets" || activeTab === "typography") && (
                  <div>
                    <div className="diseno-section-badge">
                      <Sparkles size={14} /> Vista de Conjunto: {activeTab === "presets" ? "Paleta Global Aplicada" : "Tipografía & Fondo"}
                    </div>
                    <Hero
                      cartCount={1}
                      onOpenCart={() => {}}
                      estadoNegocio={estadoNegocio}
                      design={form}
                      products={products}
                      settings={settings}
                    />
                    <Menu
                      data={products.slice(0, 4)}
                      categories={categories}
                      selectedProduct={null}
                      setSelectedProduct={() => {}}
                      addToCart={() => {}}
                      design={form}
                    />
                    <Footer settings={settings} design={form} />
                  </div>
                )}
              </div>
            )}

            {/* MODO 2: CATÁLOGO COMPLETO SECUENCIAL CON AUTO-SCROLL */}
            {previewMode === "full" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div ref={heroRef} style={{ scrollMarginTop: "15px" }}>
                  <Hero
                    cartCount={1}
                    onOpenCart={() => {}}
                    estadoNegocio={estadoNegocio}
                    design={form}
                    products={products}
                    settings={settings}
                  />
                </div>

                <div ref={promosRef} style={{ scrollMarginTop: "15px" }}>
                  <Promociones design={form} />
                </div>

                <div ref={menuRef} style={{ scrollMarginTop: "15px" }}>
                  <Menu
                    data={products}
                    categories={categories}
                    selectedProduct={null}
                    setSelectedProduct={() => {}}
                    addToCart={() => {}}
                    design={form}
                  />
                </div>

                <div ref={combosRef} style={{ scrollMarginTop: "15px" }}>
                  <Combos design={form} onAddToCart={() => {}} />
                </div>

                <div ref={footerRef} style={{ scrollMarginTop: "15px" }}>
                  <Footer settings={settings} design={form} />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Diseno;

import React, { useState, useEffect } from "react";
import { Sparkles, Sliders, Disc, Code, Check } from "lucide-react";
import ColorPickerField from "./ColorPickerField";

// Galería de Gradientes Premium para Negocios Gastronómicos & Postres
export const GRADIENT_PRESETS = [
  {
    name: "Fresa Clásico Pavé",
    emoji: "🍓",
    value: "linear-gradient(180deg, #fdf1f1 0%, #fecdcd 100%)",
    category: "Dulce",
  },
  {
    name: "Rosa Sweet Bakery",
    emoji: "🌸",
    value: "linear-gradient(180deg, #fff0f3 0%, #ffccd5 100%)",
    category: "Dulce",
  },
  {
    name: "Choco Noir & Caramelo",
    emoji: "🍫",
    value: "linear-gradient(180deg, #1c1410 0%, #2b1e17 100%)",
    category: "Oscuro",
  },
  {
    name: "Vainilla & Crema Real",
    emoji: "🍦",
    value: "linear-gradient(180deg, #fffdfa 0%, #faecd5 100%)",
    category: "Claro",
  },
  {
    name: "Menta & Matcha Fresco",
    emoji: "🍃",
    value: "linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 100%)",
    category: "Fresco",
  },
  {
    name: "Oro Imperial Gourmet",
    emoji: "✨",
    value: "linear-gradient(180deg, #281c12 0%, #140d08 100%)",
    category: "Oscuro",
  },
  {
    name: "Sunset Melocotón & Fresa",
    emoji: "🌅",
    value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    category: "Dulce",
  },
  {
    name: "Arándano & Mora Berry",
    emoji: "🫐",
    value: "linear-gradient(180deg, #f5f3ff 0%, #ddd6fe 100%)",
    category: "Fresco",
  },
  {
    name: "Café Espresso & Cacao",
    emoji: "☕",
    value: "linear-gradient(180deg, #3d2314 0%, #1a0f08 100%)",
    category: "Oscuro",
  },
  {
    name: "Negro Carbón Footer",
    emoji: "🖤",
    value: "linear-gradient(180deg, #1a0f08 0%, #0d0705 100%)",
    category: "Footer",
  },
  {
    name: "Medianoche Pizarra",
    emoji: "🌙",
    value: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
    category: "Oscuro",
  },
  {
    name: "Blanco Seda Sutil",
    emoji: "🤍",
    value: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
    category: "Claro",
  },
  {
    name: "Algodón de Azúcar",
    emoji: "🍬",
    value: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    category: "Dulce",
  },
  {
    name: "Maracuyá & Mango Pasión",
    emoji: "🥭",
    value: "linear-gradient(135deg, #ffe259 0%, #ffa751 100%)",
    category: "Fresco",
  },
];

const DIRECTIONS = [
  { id: "180deg", label: "⬇️ Vertical (Arriba a Abajo)", prefix: "linear-gradient(180deg" },
  { id: "90deg", label: "➡️ Horizontal (Izq a Der)", prefix: "linear-gradient(90deg" },
  { id: "135deg", label: "↘️ Diagonal (Esquina a Esquina)", prefix: "linear-gradient(135deg" },
  { id: "45deg", label: "↗️ Diagonal Inversa", prefix: "linear-gradient(45deg" },
  { id: "radial", label: "◉ Radial (Centro a Bordes)", prefix: "radial-gradient(circle" },
];

/**
 * Extrae 2 colores aproximados de un string linear-gradient
 */
const parseGradientColors = (gradientStr) => {
  if (!gradientStr || typeof gradientStr !== "string") {
    return { color1: "#fdf1f1", color2: "#fecdcd", dir: "180deg" };
  }

  // Detectar dirección
  let dir = "180deg";
  if (gradientStr.includes("radial")) dir = "radial";
  else if (gradientStr.includes("90deg")) dir = "90deg";
  else if (gradientStr.includes("135deg")) dir = "135deg";
  else if (gradientStr.includes("45deg")) dir = "45deg";

  // Extraer hex o rgb
  const hexMatches = gradientStr.match(/#[0-9A-Fa-f]{3,8}/g);
  if (hexMatches && hexMatches.length >= 2) {
    return { color1: hexMatches[0], color2: hexMatches[1], dir };
  } else if (hexMatches && hexMatches.length === 1) {
    return { color1: hexMatches[0], color2: hexMatches[0], dir };
  }

  return { color1: "#fdf1f1", color2: "#fecdcd", dir };
};

const GradientPickerField = ({
  label,
  value,
  onChange,
  description,
  className = "",
}) => {
  // Modos: presets | builder | solid | manual
  const [mode, setMode] = useState("presets");

  // Estado para el Creador 2 Colores
  const initialParsed = parseGradientColors(value);
  const [customColor1, setCustomColor1] = useState(initialParsed.color1);
  const [customColor2, setCustomColor2] = useState(initialParsed.color2);
  const [customDir, setCustomDir] = useState(initialParsed.dir);

  // Sincronizar creador cuando cambia el value externamente
  useEffect(() => {
    const p = parseGradientColors(value);
    setCustomColor1(p.color1);
    setCustomColor2(p.color2);
    setCustomDir(p.dir);
  }, [value]);

  const handleApplyPreset = (presetValue) => {
    onChange(presetValue);
  };

  const handleBuilderChange = (c1, c2, dir) => {
    let result = "";
    if (dir === "radial") {
      result = `radial-gradient(circle, ${c1} 0%, ${c2} 100%)`;
    } else {
      result = `linear-gradient(${dir}, ${c1} 0%, ${c2} 100%)`;
    }
    onChange(result);
  };

  const handleColor1Change = (c1) => {
    setCustomColor1(c1);
    handleBuilderChange(c1, customColor2, customDir);
  };

  const handleColor2Change = (c2) => {
    setCustomColor2(c2);
    handleBuilderChange(customColor1, c2, customDir);
  };

  const handleDirChange = (dir) => {
    setCustomDir(dir);
    handleBuilderChange(customColor1, customColor2, dir);
  };

  const isPresetActive = (presetVal) => {
    return (value || "").trim().toLowerCase() === presetVal.trim().toLowerCase();
  };

  return (
    <div className={`gradient-field-container ${className}`}>
      {/* Encabezado */}
      <div className="gradient-field__header">
        <div className="color-field__label-wrap">
          <span className="admin-field__label" style={{ margin: 0 }}>{label}</span>
          {description && <span className="color-field__desc">{description}</span>}
        </div>

        {/* Píldora con Live Preview del Fondo Actual */}
        <div
          className="gradient-field__preview-pill"
          style={{ background: value || "#fecdcd" }}
          title={`Fondo actual: ${value}`}
        />
      </div>

      {/* Selector de Modos */}
      <div className="gradient-field__mode-nav">
        <button
          type="button"
          className={`gradient-field__mode-btn ${mode === "presets" ? "gradient-field__mode-btn--active" : ""}`}
          onClick={() => setMode("presets")}
        >
          <Sparkles size={13} /> Galería de Gradientes
        </button>
        <button
          type="button"
          className={`gradient-field__mode-btn ${mode === "builder" ? "gradient-field__mode-btn--active" : ""}`}
          onClick={() => setMode("builder")}
        >
          <Sliders size={13} /> Creador 2 Colores
        </button>
        <button
          type="button"
          className={`gradient-field__mode-btn ${mode === "solid" ? "gradient-field__mode-btn--active" : ""}`}
          onClick={() => setMode("solid")}
        >
          <Disc size={13} /> Color Sólido
        </button>
        <button
          type="button"
          className={`gradient-field__mode-btn ${mode === "manual" ? "gradient-field__mode-btn--active" : ""}`}
          onClick={() => setMode("manual")}
        >
          <Code size={13} /> Manual / CSS
        </button>
      </div>

      {/* CONTENIDO DEL MODO */}
      <div className="gradient-field__body">
        {/* 1. MODO PRESETS */}
        {mode === "presets" && (
          <div className="gradient-field__presets-grid">
            {GRADIENT_PRESETS.map((p) => {
              const active = isPresetActive(p.value);
              return (
                <button
                  key={p.name}
                  type="button"
                  className={`gradient-field__preset-item ${active ? "gradient-field__preset-item--active" : ""}`}
                  onClick={() => handleApplyPreset(p.value)}
                  title={`${p.name} - Clic para aplicar`}
                >
                  <div
                    className="gradient-field__preset-swatch"
                    style={{ background: p.value }}
                  >
                    {active && <Check size={14} className="gradient-field__preset-check" />}
                  </div>
                  <div className="gradient-field__preset-details">
                    <span className="gradient-field__preset-name">
                      {p.emoji} {p.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. MODO CREADOR 2 COLORES */}
        {mode === "builder" && (
          <div className="gradient-field__builder">
            <div className="gradient-field__builder-row">
              <ColorPickerField
                label="Color Inicial (Color 1)"
                value={customColor1}
                onChange={handleColor1Change}
              />
              <ColorPickerField
                label="Color Final (Color 2)"
                value={customColor2}
                onChange={handleColor2Change}
              />
            </div>

            <div className="admin-field" style={{ marginTop: "0.5rem" }}>
              <span className="admin-field__label">Dirección del Gradiente</span>
              <select
                value={customDir}
                onChange={(e) => handleDirChange(e.target.value)}
                className="admin-field__input"
              >
                {DIRECTIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="gradient-field__builder-preview" style={{ background: value }}>
              <span className="gradient-field__builder-preview-label">Vista Previa del Gradiente Creado</span>
            </div>
          </div>
        )}

        {/* 3. MODO COLOR SÓLIDO */}
        {mode === "solid" && (
          <div className="gradient-field__solid-box">
            <ColorPickerField
              label="Selecciona un color sólido para el fondo"
              value={value && !value.includes("gradient") ? value : "#fdfbf7"}
              onChange={(newColor) => onChange(newColor)}
              description="Aplica un color plano y limpio en lugar de un gradiente."
            />
          </div>
        )}

        {/* 4. MODO MANUAL */}
        {mode === "manual" && (
          <div className="gradient-field__manual-box">
            <label className="admin-field">
              <span className="admin-field__label">Código CSS de Fondo (linear-gradient, radial-gradient o Color)</span>
              <input
                type="text"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="admin-field__input"
                placeholder="linear-gradient(180deg, #ffffff 0%, #fecdcd 100%)"
              />
            </label>
            <span style={{ fontSize: "0.75rem", color: "var(--texto-dim)", display: "block", marginTop: "4px" }}>
              💡 Puedes escribir cualquier propiedad válida de CSS para `background`.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradientPickerField;

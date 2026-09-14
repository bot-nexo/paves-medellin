import { useEffect, useState } from "react";
import { Loader2, Save, Power } from "lucide-react";
import Swal from "sweetalert2";
import { getSettings, updateSettings } from "../../data/dataSource";
import "../admin.css";

const CAMPOS = [
  { clave: "phone", label: "WhatsApp de pedidos", placeholder: "573157978326", pista: "Con indicativo de país, sin espacios ni '+' (ej: 573157978326). Aquí llegan los pedidos." },
  { clave: "address", label: "Dirección del negocio", placeholder: "Cl. 101c #74-40, Pedregal, Medellín" },
  { clave: "mapsGoogle", label: "Enlace de Google Maps", placeholder: "https://maps.app.goo.gl/…" },
  { clave: "day1", label: "Días de atención", placeholder: "Todos los días" },
  { clave: "hours1", label: "Horario", placeholder: "12:00 M - 08:00 PM" },
  { clave: "instagram", label: "Instagram (URL)", placeholder: "https://www.instagram.com/…" },
  { clave: "facebook", label: "Facebook (URL)", placeholder: "https://www.facebook.com/…" },
  { clave: "tiktok", label: "TikTok (URL)", placeholder: "https://www.tiktok.com/@…" },
];

const Negocio = () => {
  const [form, setForm] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [forceClosed, setForceClosed] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setForm(Object.fromEntries(CAMPOS.map(({ clave }) => [clave, s[clave] || ""])));
        setForceClosed(s.forceClosed === true);
      })
      .catch((e) =>
        Swal.fire({ title: "Error al cargar", text: e.message, icon: "error", confirmButtonColor: "#3D2314" }),
      );
  }, []);

  const set = (clave, valor) => setForm((f) => ({ ...f, [clave]: valor }));

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) {
      Swal.fire({
        icon: "warning",
        text: "El WhatsApp de pedidos es obligatorio (sin él la tienda no puede enviar pedidos).",
        confirmButtonColor: "#3D2314",
      });
      return;
    }
    setCargando(true);
    try {
      await updateSettings(form);
      Swal.fire({
        icon: "success",
        title: "Información actualizada",
        text: "La tienda refleja los cambios en segundos.",
        toast: true,
        position: "top-end",
        timer: 2400,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ title: "No se pudo guardar", text: err.message, icon: "error", confirmButtonColor: "#3D2314" });
    }
    setCargando(false);
  };

  if (!form) {
    return (
      <div className="admin-page">
        <h1 className="admin-page__titulo">🏪 Mi Negocio</h1>
        <p className="admin-page__sub">Cargando información…</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header admin-page__header--row">
        <div>
          <h1 className="admin-page__titulo">🏪 Mi Negocio</h1>
          <p className="admin-page__sub">Estos datos se muestran en el pie de página de la tienda.</p>
        </div>
      </header>

      <form className="admin-card adm-cfg" onSubmit={guardar}>
        {CAMPOS.map(({ clave, label, placeholder, pista }) => (
          <label key={clave} className="admin-field">
            <span className="admin-field__label">{label}</span>
            <div className="admin-field__input">
              <input
                type="text"
                value={form[clave]}
                onChange={(e) => set(clave, e.target.value)}
                placeholder={placeholder}
              />
            </div>
            {pista && <span className="adm-modal__precio-hint">{pista}</span>}
          </label>
        ))}

        {/* Cierre de emergencia (mismo control que en Configuración) */}
        <div className={"adm-cfg__seccion " + (forceClosed ? "adm-cfg__seccion--alerta" : "")}>
          <div className="adm-cfg__seccion-titulo">
            <Power size={15} /> Estado del negocio
          </div>
          <p className="adm-cfg__alerta-texto">
            {forceClosed
              ? "⚠️ El negocio está CERRADO por emergencia. Los pedidos se siguen agendando."
              : "Abierto según el horario configurado arriba. Cierra solo para emergencias."}
          </p>
          <div className="adm-cfg__pie" style={{ justifyContent: "flex-start" }}>
            <button
              type="button"
              className={forceClosed ? "admin-btn-primary admin-btn-primary--compacto" : "admin-btn-ghost"}
              onClick={async () => {
                const nuevo = !forceClosed;
                const res = await Swal.fire({
                  title: nuevo ? "¿Cerrar el negocio ahora?" : "¿Reabrir el negocio?",
                  text: nuevo
                    ? "La tienda mostrará 'Cerrado — agenda tu pedido'. Los pedidos se siguen recibiendo."
                    : "La tienda volverá a mostrar el estado según tu horario.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: nuevo ? "Sí, cerrar" : "Sí, reabrir",
                  cancelButtonText: "Cancelar",
                  confirmButtonColor: "#E07A5F",
                  cancelButtonColor: "#3D2314",
                  reverseButtons: true,
                });
                if (!res.isConfirmed) return;
                try {
                  await updateSettings({ forceClosed: nuevo });
                  setForceClosed(nuevo);
                  Swal.fire({
                    icon: "success",
                    title: nuevo ? "Negocio cerrado" : "Negocio reabierto",
                    toast: true,
                    position: "top-end",
                    timer: 2200,
                    showConfirmButton: false,
                  });
                } catch (err) {
                  Swal.fire({ title: "No se pudo guardar", text: err.message, icon: "error", confirmButtonColor: "#3D2314" });
                }
              }}
            >
              {forceClosed ? "✅ Reabrir negocio" : "🔒 Cierre de emergencia"}
            </button>
          </div>
        </div>

        <div className="adm-cfg__pie">
          <button type="submit" className="admin-btn-primary admin-btn-primary--compacto" disabled={cargando}>
            {cargando ? <Loader2 size={15} className="adm-spin" /> : <Save size={15} />}
            {cargando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Negocio;

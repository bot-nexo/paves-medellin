import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import Swal from "sweetalert2";
import LoadingOverlay from "../../components/common/LoadingOverlay";
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

const Empresa = () => {
  const [form, setForm] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const timeOut = 1500;
  const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  //*************************** */
  useEffect(() => {
    const cargarEmpresa = async () => {
      setCargando(true);
      try {
        // ✅ Forzamos a que espere tanto los datos como el temporizador mediante Promise.all y await
        const [s] = await Promise.all([
          getSettings(),
          esperar(timeOut)
        ]);

        setForm(Object.fromEntries(CAMPOS.map(({ clave }) => [clave, s[clave] || ""])));
      } catch (e) {
        Swal.fire({
          title: "Error al cargar",
          text: e.message,
          icon: "error",
          confirmButtonColor: "#3D2314",
        });
      } finally {
        setCargando(false);
      }
    };

    cargarEmpresa();
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

    setGuardando(true);
    try {
      // ✅ Sincronizamos la actualización con el temporizador artificial
      await Promise.all([
        updateSettings(form),
        esperar(timeOut)
      ]);

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

  // 1. Carga inicial (Pantalla Completa)
  if (cargando || !form) {
    return (
      <div className="adm-page" style={{ minHeight: "80vh", position: "relative" }}>
        <LoadingOverlay fullScreen text="Cargando empresa" minTime={timeOut} />
      </div>
    );
  }

  //*************************** */
  return (
    <div className="admin-page" style={{ position: "relative" }}>
      {/* 2. Loader emergente durante el guardado */}
      {guardando && (
        <LoadingOverlay text="Sincronizando empresa" minTime={timeOut} />
      )}

      <header className="admin-page__header admin-page__header--row">
        <div>
          <h1 className="admin-page__titulo">Empresa</h1>
          <p className="admin-page__sub">Información de la empresa.</p>
        </div>
      </header>

      <div className="admin-main-content">
        {/* Formulario de configuración del negocio */}
        <form className="admin-card adm-cfg" onSubmit={guardar}>
          <div className="admin-field-contenedor">
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
          </div>

          <div className="adm-cfg__pie">
            <button type="submit" className="admin-btn-primary admin-btn-primary--compacto" disabled={guardando}>
              {guardando ? <Loader2 size={15} className="adm-spin" /> : <Save size={15} />}
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Empresa;
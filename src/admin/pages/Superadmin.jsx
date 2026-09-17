import { useState, useEffect } from "react";
import { useAdminSession } from "../useAdminSession";
import { getSettings, updateSettings } from "../../data/dataSource";
import Swal from "sweetalert2";
import { ShieldAlert, Loader2, Save, ToggleLeft, ToggleRight, Building } from "lucide-react";
import LoadingOverlay from "../../components/common/LoadingOverlay";

const AdminSuper = () => {
  const { session, role } = useAdminSession();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getSettings();
        setForm({
          isActive: data.isActive,
          canChangePassword: data.canChangePassword,
        });
      } catch (err) {
        console.error("Error cargando super admin:", err);
      } finally {
        setCargando(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (field) => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await updateSettings(form);
      Swal.fire({
        icon: "success",
        title: "Guardado",
        text: "Configuración de superadmin actualizada.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setGuardando(false);
    }
  };

  if (role !== "superadmin") {
    return (
      <div className="admin-card" style={{ padding: "3rem", textAlign: "center" }}>
        <ShieldAlert size={48} color="#d32f2f" style={{ margin: "0 auto 1rem" }} />
        <h2>Acceso Denegado</h2>
        <p>Esta sección es exclusiva para el superadministrador.</p>
      </div>
    );
  }

  if (cargando || !form) {
    return <LoadingOverlay fullScreen text="Cargando controles maestros" />;
  }

  return (
    <div className="admin-layout__page">
      <div className="admin-page-header">
        <h1 className="admin-page-header__titulo">Panel de Superadmin</h1>
        <p className="admin-page-header__desc">Gestiona el estado y accesos de este inquilino (tenant).</p>
      </div>

      <div className="admin-card adm-cfg" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="adm-cfg__seccion-titulo" style={{ marginBottom: "1rem" }}>
          <Building size={16} /> Estado del Negocio
        </div>
        <p className="adm-cfg__alerta-texto" style={{ marginBottom: "2rem" }}>
          Estos interruptores controlan si el negocio puede operar y si los administradores pueden cambiar su contraseña. Si desactivas el negocio, el catálogo público se bloqueará.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="adm-cfg__grid" style={{ gridTemplateColumns: "1fr", gap: "2rem" }}>
            
            {/* Toggle Is Active */}
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "8px", cursor: "pointer" }}
              onClick={() => handleChange("isActive")}
            >
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem" }}>Negocio Activo (Mensualidad)</strong>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>Permite recibir pedidos y acceder al panel.</span>
              </div>
              <div style={{ color: form.isActive ? "#4caf50" : "#d32f2f" }}>
                {form.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </div>
            </div>

            {/* Toggle Can Change Password */}
            <div 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "8px", cursor: "pointer" }}
              onClick={() => handleChange("canChangePassword")}
            >
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem" }}>Permitir Cambio de Contraseña</strong>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>El administrador podrá cambiar su clave desde el perfil.</span>
              </div>
              <div style={{ color: form.canChangePassword ? "#4caf50" : "#d32f2f" }}>
                {form.canChangePassword ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </div>
            </div>
            
          </div>

          <div className="adm-cfg__pie" style={{ marginTop: "2rem" }}>
            <button type="submit" className="admin-btn-primary admin-btn-primary--compacto" disabled={guardando}>
              {guardando ? <Loader2 size={15} className="adm-spin" /> : <Save size={15} />}
              {guardando ? "Guardando…" : "Guardar controles"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSuper;

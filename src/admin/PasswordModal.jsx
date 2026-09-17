import { useState } from "react";
import { X, Lock, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../services/supabaseClient";

const PasswordModal = ({ isOpen, onClose, email }) => {
  const [passwords, setPasswords] = useState({ oldPass: "", newPass: "", confirmPass: "" });
  const [actualizando, setActualizando] = useState(false);
  const [enviandoRecovery, setEnviandoRecovery] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPass.length < 6) {
      return Swal.fire({ icon: "warning", text: "La nueva contraseña debe tener al menos 6 caracteres", confirmButtonColor: "#3D2314" });
    }
    if (passwords.newPass !== passwords.confirmPass) {
      return Swal.fire({ icon: "warning", text: "Las contraseñas nuevas no coinciden", confirmButtonColor: "#3D2314" });
    }
    
    setActualizando(true);
    try {
      // 1. Re-autenticar con la contraseña antigua
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: passwords.oldPass,
      });

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta.");
      }

      // 2. Si pasa, actualizar
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.newPass
      });

      if (updateError) throw updateError;

      Swal.fire({ icon: "success", title: "Contraseña actualizada", text: "Tu contraseña ha sido cambiada de forma segura.", confirmButtonColor: "#3D2314" });
      onClose();
      setPasswords({ oldPass: "", newPass: "", confirmPass: "" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message, confirmButtonColor: "#3D2314" });
    } finally {
      setActualizando(false);
    }
  };

  const handleRecuperacion = async () => {
    setEnviandoRecovery(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/admin"
      });
      if (error) throw error;
      Swal.fire({ icon: "success", title: "Correo enviado", text: "Revisa tu bandeja de entrada o spam con el link de recuperación.", confirmButtonColor: "#3D2314" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error al enviar correo", text: err.message, confirmButtonColor: "#3D2314" });
    } finally {
      setEnviandoRecovery(false);
    }
  };

  return (
    <div className="adm-modal-overlay">
      <div className="adm-modal" style={{ maxWidth: "400px" }}>
        <button type="button" className="adm-modal__cerrar" onClick={onClose}><X size={20} /></button>
        <div className="adm-modal__header">
          <h2 className="adm-modal__titulo"><Lock size={18} /> Cambiar Contraseña</h2>
          <p className="adm-modal__desc">{email}</p>
        </div>
        <div className="adm-modal__content">
          <form onSubmit={handleSubmit} className="adm-cfg__grid" style={{ gridTemplateColumns: "1fr", gap: "1rem" }}>
            <label className="admin-field">
              <span className="admin-field__label">Contraseña Actual *</span>
              <div className="admin-field__input">
                <input type="password" value={passwords.oldPass} onChange={(e) => setPasswords({ ...passwords, oldPass: e.target.value })} required placeholder="La que usas actualmente" />
              </div>
            </label>
            <div className="divider" style={{ margin: "0" }} />
            <label className="admin-field">
              <span className="admin-field__label">Nueva Contraseña *</span>
              <div className="admin-field__input">
                <input type="password" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })} required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
            </label>
            <label className="admin-field">
              <span className="admin-field__label">Confirmar Nueva Contraseña *</span>
              <div className="admin-field__input">
                <input type="password" value={passwords.confirmPass} onChange={(e) => setPasswords({ ...passwords, confirmPass: e.target.value })} required minLength={6} />
              </div>
            </label>
            
            <button type="submit" className="admin-btn-primary" disabled={actualizando}>
              {actualizando ? <Loader2 size={16} className="adm-spin" /> : <Lock size={16} />}
              {actualizando ? "Cambiando..." : "Cambiar Contraseña"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "#666" }}>
            ¿Olvidaste tu contraseña actual? <br />
            <button type="button" onClick={handleRecuperacion} disabled={enviandoRecovery} style={{ background: "none", border: "none", color: "#ffaa29", cursor: "pointer", fontWeight: "bold", marginTop: "5px" }}>
              {enviandoRecovery ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;

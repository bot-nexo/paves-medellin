import { useState } from "react";
import { Lock, Mail, Eye, EyeOff, CakeSlice, AlertCircle } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import LoadingOverlay from "../components/common/LoadingOverlay";
import { useNavigate } from "react-router-dom";
import useCatalog from "../hooks/useCatalog";

// Mensajes de error de Supabase → texto claro para el dueño del negocio
const ERRORES = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed": "El correo aún no está confirmado. Revisa tu bandeja.",
  "Too many requests": "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const { settings } = useCatalog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const timeOut = 1500;
  const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  //*********************** */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Completa el correo y la contraseña.");
      return;
    }

    setCargando(true);
    try {
      // ✅ Ejecutamos la autenticación y la espera en paralelo
      const [{ error: err }] = await Promise.all([
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        esperar(timeOut),
      ]);

      if (err) {
        setError(ERRORES[err.message] || "No se pudo iniciar sesión. Intenta de nuevo.");
        setCargando(false);
        return;
      }

      // Redirigir tras cumplir la promesa y la animación
      navigate("/admin");
    } catch (err) {
      console.error("Error en login:", err.message);
      setError(err.message || "No se pudo iniciar sesión. Intenta de nuevo.");
      setCargando(false);
    }
  };

  //****************************** */
  return (
    <div className="admin-login" style={{ position: "relative" }}>
      {cargando && (
        <LoadingOverlay fullScreen text="Ingresando" minTime={timeOut} />
      )}

      <form className="admin-login__card" onSubmit={handleSubmit}>
        <div className="admin-login__logo">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "12px" }} />
          ) : (
            <CakeSlice size={34} strokeWidth={1.6} />
          )}
        </div>
        <h1 className="admin-login__titulo">Panel de Administración</h1>
        <p className="admin-login__subtitulo">Pavés Medellín — acceso exclusivo del negocio</p>

        {error && (
          <div className="admin-login__error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <label className="admin-field">
          <span className="admin-field__label">Correo</span>
          <div className="admin-field__input">
            <Mail size={16} className="admin-field__icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              autoFocus
            />
          </div>
        </label>

        <label className="admin-field">
          <span className="admin-field__label">Contraseña</span>
          <div className="admin-field__input">
            <Lock size={16} className="admin-field__icon" />
            <input
              type={verPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="admin-field__toggle"
              onClick={() => setVerPass((v) => !v)}
              aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <button type="submit" className="admin-btn-primary" disabled={cargando}>
          {cargando ? "Ingresando…" : "Ingresar"}
        </button>

        <p className="admin-login__nota">
          Solo el equipo del negocio puede entrar a este panel.
        </p>
      </form>
    </div>
  );
};

export default AdminLogin;
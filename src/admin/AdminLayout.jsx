import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Dessert,
  Tags,
  Tag,
  Receipt,
  Store,
  Settings,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
  Palette,
} from "lucide-react";
import { logoutAdmin } from "./sessionStore";
import { useAdminSession } from "./useAdminSession";
import useCatalog from "../hooks/useCatalog";
import PasswordModal from "./PasswordModal";
import NotificationBell from "./components/NotificationBell";
import logoImg from "../assets/images/logo.png";
import "./admin.css";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/productos", label: "Productos", icon: Dessert },
  { to: "/admin/categorias", label: "Categorías", icon: Tags },
  { to: "/admin/adiciones", label: "Adiciones & Salsas", icon: Sparkles },
  { to: "/admin/pedidos", label: "Pedidos", icon: Receipt },
  { to: "/admin/promociones", label: "Promos & Combos", icon: Tag },
  { to: "/admin/diseno", label: "Diseño Menú", icon: Palette },
  { to: "/admin/empresa", label: "Empresa", icon: Store },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

const AdminLayout = () => {
  const rz = localStorage.getItem("store_razon_social");
  const { session, role } = useAdminSession();
  const { settings } = useCatalog();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [name, setName] = useState("Dashboard");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const email = session?.user?.email || "";

  // Lógica de bloqueo por falta de pago
  const isSuspended = settings && !settings.isActive;

  if (isSuspended && role !== "superadmin") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#fdf8f5", textAlign: "center", padding: "2rem" }}>
        <AlertOctagon size={64} color="#d32f2f" style={{ marginBottom: "1rem" }} />
        <h1 style={{ color: "#3D2314", fontSize: "2rem", marginBottom: "1rem" }}>Servicio Suspendido</h1>
        <p style={{ color: "#666", fontSize: "1.1rem", maxWidth: "400px", marginBottom: "2rem" }}>
          Tu acceso al panel de administración ha sido bloqueado temporalmente. Por favor, contacta con el administrador del sistema para regularizar el estado de tu cuenta.
        </p>
        <button onClick={handleLogout} className="admin-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>
    );
  }

  const navItemsToShow = [...NAV_ITEMS];
  if (role === "superadmin") {
    navItemsToShow.push({ to: "/admin/super", label: "Superadmin", icon: ShieldCheck });
  }

  //********************* */
  return (
    <div className={`admin-shell ${collapsed ? "admin-shell--collapsed" : ""}`}>
      {/* Overlay para móviles */}
      {mobileMenuOpen && (
        <div className="admin-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar Principal */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "admin-sidebar--mobile-open" : ""}`}>
        {/* Header del Sidebar */}
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo-wrapper">
            <img src={settings?.logo_url || logoImg} alt="Logo" className="admin-sidebar__logo" />
          </div>
          {!collapsed && (
            <div className="admin-sidebar__brand-text">
              <span className="admin-sidebar__titulo">{rz || "Paves Medellin"}</span>
              <span className="admin-sidebar__subtitulo">Panel Admin</span>
            </div>
          )}
          <button
            type="button"
            className="admin-sidebar__toggle-btn"
            onClick={toggleSidebar}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Menú de Navegación */}
        <nav className="admin-nav">
          {navItemsToShow.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => {
                setMobileMenuOpen(false);
                setName(label);
              }}
              className={({ isActive }) =>
                "admin-nav__item" + (isActive ? " admin-nav__item--active" : "")
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="admin-nav__icon" />
              {!collapsed && <span className="admin-nav__label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer del Sidebar */}
        <div className="admin-sidebar__pie">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-nav__item admin-nav__item--link"
            title={collapsed ? "Ver tienda" : undefined}
          >
            <ExternalLink size={20} className="admin-nav__icon" />
            {!collapsed && <span className="admin-nav__label">Ver tienda</span>}
          </a>

          {email && !collapsed && (
            <div className="admin-sidebar__user" title={email}>
              <User size={16} className="admin-sidebar__user-icon" />
              <span className="admin-sidebar__email">{email}</span>
            </div>
          )}

          <button
            type="button"
            className="admin-nav__item admin-nav__item--salir"
            onClick={handleLogout}
            title={collapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut size={20} className="admin-nav__icon" />
            {!collapsed && <span className="admin-nav__label">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Wrapper del Contenido Principal */}
      <div className="admin-layout__wrapper">
        {/* Topbar Superior */}
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar__hamburger"
            onClick={toggleMobileMenu}
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="admin-topbar__title">
            <span>Panel {name}</span>
          </div>

          <div className="admin-topbar__actions">
            <NotificationBell />
            {email && (
              <button
                type="button"
                className="admin-topbar__user-badge"
                onClick={() => setIsPasswordModalOpen(true)}
                title="Cambiar contraseña"
                style={{ background: "none", border: "none", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                <User size={14} />
                <span>{email}</span>
              </button>
            )}
          </div>
        </header>

        {/* Área donde se renderizan las páginas */}
        <main className="admin-main">
          <Outlet />
        </main>
      </div>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        email={email}
        canChange={settings?.canChangePassword !== false}
      />
    </div>
  );
};

export default AdminLayout;
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  IceCream,
  Tags,
  Receipt,
  Store,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { logoutAdmin } from "./sessionStore";
import { useAdminSession } from "./useAdminSession";
import "./admin.css";
import logoImg from "../assets/images/logo.png";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/productos", label: "Productos", icon: IceCream },
  { to: "/admin/categorias", label: "Categorías", icon: Tags },
  { to: "/admin/pedidos", label: "Pedidos", icon: Receipt },
  { to: "/admin/negocio", label: "Mi Negocio", icon: Store },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

const AdminLayout = () => {
  const { session } = useAdminSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  // Email legible del dueño (por si tiene varios admins)
  const email = session?.user?.email || "";

  //***************************** */
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src={logoImg} alt="logo" className="admin-sidebar__logo" />
          <span className="admin-sidebar__subtitulo">Panel Admin</span>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                "admin-nav__item" + (isActive ? " admin-nav__item--active" : "")
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__pie">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-nav__item admin-nav__item--link"
          >
            <ExternalLink size={18} />
            <span>Ver tienda</span>
          </a>
          {email && (
            <span className="admin-sidebar__email" title={email}>
              {email}
            </span>
          )}
          <button
            type="button"
            className="admin-nav__item admin-nav__item--salir"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* <main className="admin-main">
        <Outlet />
      </main> */}
    </div>
  );
};

export default AdminLayout;

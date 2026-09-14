import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CakeSlice,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Eye,
  Package,
  RefreshCw,
  Star,
  Tag,
  TrendingUp,
  Wallet,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import {
  getOrders,
  getProducts,
  getSettings,
  subscribeToOrders,
  isUsingSupabase,
} from "../../data/dataSource";
import { estaAbiertoSegunHorario } from "../../utils/horario";
import { formatCOP } from "../../utils/price";
import "../../css/estadoNegocio.css";

const esHoy = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const h = new Date();
  return (
    d.getFullYear() === h.getFullYear() &&
    d.getMonth() === h.getMonth() &&
    d.getDate() === h.getDate()
  );
};

const horaCorta = (iso) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

const Dashboard = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState(null); // null = cargando
  const [productos, setProductos] = useState(null);
  const [settings, setSettings] = useState(null);
  const [nuevosSinVer, setNuevosSinVer] = useState(0);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setError("");
    try {
      // El error de pedidos no debe bloquear el resto: se piden en paralelo
      // pero cada fallo se maneja solo.
      const [p, prods, cfg] = await Promise.allSettled([
        getOrders(),
        getProducts(),
        getSettings(),
      ]);
      if (p.status === "fulfilled") setPedidos(p.value);
      else {
        setPedidos([]);
        setError("No se pudieron cargar los pedidos: " + p.reason?.message);
      }
      if (prods.status === "fulfilled") setProductos(prods.value);
      if (cfg.status === "fulfilled") setSettings(cfg.value);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
    const off = subscribeToOrders((evento, pedido) => {
      if (evento === "insert") {
        setPedidos((prev) => (prev ? [pedido, ...prev] : [pedido]));
        setNuevosSinVer((n) => n + 1);
      } else {
        setPedidos((prev) =>
          prev?.map((x) => (x.id === pedido.id ? pedido : x)) ?? [pedido],
        );
      }
    });
    return off;
  }, [cargar]);

  // ── Métricas ──────────────────────────────────────────────────────────────
  const m = useMemo(() => {
    const hoy = (pedidos || []).filter((p) => esHoy(p.created_at) && p.estado !== "cancelado");
    const ventasHoy = hoy.reduce((s, p) => s + (p.total || 0), 0);
    const ticketPromedio = hoy.length ? Math.round(ventasHoy / hoy.length) : 0;

    const porEstado = { nuevo: 0, preparacion: 0, camino: 0 };
    for (const p of pedidos || []) {
      if (p.estado in porEstado) porEstado[p.estado] += 1;
    }

    const agotados = (productos || []).filter((p) => p.disponible === false);
    const destacados = (productos || []).filter((p) => p.destacado);
    const activos = (productos || []).filter((p) => p.disponible !== false);

    return { hoy, ventasHoy, ticketPromedio, porEstado, agotados, destacados, activos };
  }, [pedidos, productos]);

  const estadoNegocio = estaAbiertoSegunHorario(settings || {});

  // Estados vacíos (datos aún cargando)
  if (pedidos === null || productos === null) {
    return (
      <div className="adm-page">
        <p className="adm-dashboard__cargando">Cargando métricas…</p>
      </div>
      );
  }

  return (
    <div className="adm-page">
      <header className="adm-dashboard__header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-dashboard__sub">
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="adm-dashboard__header-actions">
          <span
            className={`adm-conn ${isUsingSupabase() ? "adm-conn--ok" : "adm-conn--local"}`}
            title={
              isUsingSupabase()
                ? "Datos en vivo desde Supabase"
                : "Supabase no configurado: leyendo datos locales"
            }
          >
            {isUsingSupabase() ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isUsingSupabase() ? "Supabase" : "Local"}
          </span>
          <button type="button" className="admin-btn-ghost" onClick={cargar}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </header>

      {/* Estado del negocio (igual criterio que la tienda) */}
      <div className={`estado-banner ${estadoNegocio.abierto ? "abierto" : "cerrado"}`}>
        <span className="estado-dot" />
        <div className="estado-texto">
          <strong>{estadoNegocio.abierto ? "Negocio abierto" : "Negocio cerrado"}</strong>
          <small>
            {estadoNegocio.fuerzaCierre
              ? "🚨 Cierre de emergencia activo — la tienda acepta pedidos agendados"
              : estadoNegocio.abierto
                ? "Aceptando pedidos en horario normal"
                : "Fuera de horario — se aceptan pedidos agendados para la apertura"}
          </small>
        </div>
        <small className="estado-horario">{estadoNegocio.horarioTexto}</small>
        <button
          type="button"
          className="admin-btn-ghost"
          onClick={() => navigate("/admin/negocio")}
        >
          Gestionar
        </button>
      </div>

      {error && <p className="adm-dashboard__error">⚠️ {error}</p>}

      {/* Métricas del día */}
      <section className="adm-dash__grid">
        <div className="adm-dash__card adm-dash__card--ventas">
          <div className="adm-dash__card-icono"><Wallet size={20} /></div>
          <div>
            <span className="adm-dash__card-valor">{formatCOP(m.ventasHoy)}</span>
            <span className="adm-dash__card-label">Ventas de hoy</span>
          </div>
        </div>
        <div className="adm-dash__card">
          <div className="adm-dash__card-icono"><ClipboardList size={20} /></div>
          <div>
            <span className="adm-dash__card-valor">{m.hoy.length}</span>
            <span className="adm-dash__card-label">Pedidos de hoy</span>
          </div>
        </div>
        <div className="adm-dash__card">
          <div className="adm-dash__card-icono"><TrendingUp size={20} /></div>
          <div>
            <span className="adm-dash__card-valor">{formatCOP(m.ticketPromedio)}</span>
            <span className="adm-dash__card-label">Ticket promedio</span>
          </div>
        </div>
        <div className="adm-dash__card">
          <div className="adm-dash__card-icono"><Package size={20} /></div>
          <div>
            <span className="adm-dash__card-valor">{m.activos.length}</span>
            <span className="adm-dash__card-label">Productos activos</span>
          </div>
        </div>
      </section>

      {/* Flujo de pedidos + acceso rápido */}
      <div className="adm-dash__fila">
        <section className="adm-dash__panel">
          <h2 className="adm-dash__panel-titulo">
            <ChefHat size={16} /> Flujo de pedidos
          </h2>
          <div className="adm-dash__flujo">
            <button
              type="button"
              className="adm-dash__flujo-item adm-dash__flujo-item--nuevo"
              onClick={() => navigate("/admin/pedidos")}
            >
              <span className="adm-dash__flujo-num">{m.porEstado.nuevo}</span>
              <span className="adm-dash__flujo-label">🆕 Nuevos</span>
            </button>
            <span className="adm-dash__flujo-flecha">→</span>
            <button
              type="button"
              className="adm-dash__flujo-item adm-dash__flujo-item--prep"
              onClick={() => navigate("/admin/pedidos")}
            >
              <span className="adm-dash__flujo-num">{m.porEstado.preparacion}</span>
              <span className="adm-dash__flujo-label">👨‍🍳 Preparación</span>
            </button>
            <span className="adm-dash__flujo-flecha">→</span>
            <button
              type="button"
              className="adm-dash__flujo-item adm-dash__flujo-item--camino"
              onClick={() => navigate("/admin/pedidos")}
            >
              <span className="adm-dash__flujo-num">{m.porEstado.camino}</span>
              <span className="adm-dash__flujo-label">🛵 En camino</span>
            </button>
          </div>
          {nuevosSinVer > 0 && (
            <p className="adm-dash__nuevos">
              <Bell size={13} /> {nuevosSinVer} pedido(s) nuevo(s) llegó(aron) mientras veías el panel
            </p>
          )}
        </section>

        <section className="adm-dash__panel">
          <h2 className="adm-dash__panel-titulo">
            <Tag size={16} /> Accesos rápidos
          </h2>
          <div className="adm-dash__accesos">
            <button type="button" className="adm-dash__acceso" onClick={() => navigate("/admin/productos")}>
              <CakeSlice size={16} /> Productos
            </button>
            <button type="button" className="adm-dash__acceso" onClick={() => navigate("/admin/categorias")}>
              <Tag size={16} /> Categorías
            </button>
            <button type="button" className="adm-dash__acceso" onClick={() => navigate("/admin/pedidos")}>
              <ClipboardList size={16} /> Pedidos
            </button>
            <button type="button" className="adm-dash__acceso" onClick={() => navigate("/admin/configuracion")}>
              <Wallet size={16} /> Domicilio
            </button>
          </div>
        </section>
      </div>

      {/* Productos críticos + pedidos recientes */}
      <div className="adm-dash__fila">
        <section className="adm-dash__panel">
          <h2 className="adm-dash__panel-titulo">
            <Package size={16} /> Requieren atención
          </h2>
          {m.agotados.length === 0 && m.destacados.length === 0 ? (
            <p className="adm-dash__vacio">Todo en orden: sin agotados ni destacados que revisar.</p>
          ) : (
            <>
              {m.agotados.length > 0 && (
                <ul className="adm-dash__lista">
                  {m.agotados.map((p) => (
                    <li key={p.id}>
                      <XCircle size={13} className="adm-dash__agotado" />
                      <span>{p.nombre}</span>
                      <small>agotado</small>
                    </li>
                  ))}
                </ul>
              )}
              {m.destacados.length > 0 && (
                <ul className="adm-dash__lista">
                  {m.destacados.slice(0, 4).map((p) => (
                    <li key={p.id}>
                      <Star size={13} className="adm-dash__destacado" />
                      <span>{p.nombre}</span>
                      <small>destacado</small>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => navigate("/admin/productos")}
              >
                Ir a Productos
              </button>
            </>
          )}
        </section>

        <section className="adm-dash__panel">
          <h2 className="adm-dash__panel-titulo">
            <ClipboardList size={16} /> Últimos pedidos
          </h2>
          {(pedidos || []).length === 0 ? (
            <p className="adm-dash__vacio">Aún no hay pedidos registrados.</p>
          ) : (
            <ul className="adm-dash__lista adm-dash__lista--pedidos">
              {pedidos.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <span className="adm-dash__pedido-num">#{p.numero}</span>
                  <span className="adm-dash__pedido-nombre">{p.nombre}</span>
                  <span className="adm-dash__pedido-estado">{p.estado}</span>
                  <span className="adm-dash__pedido-total">{formatCOP(p.total)}</span>
                  <small>{esHoy(p.created_at) ? horaCorta(p.created_at) : "antes de hoy"}</small>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="admin-btn-ghost"
            onClick={() => navigate("/admin/pedidos")}
          >
            <Eye size={14} /> Ver todos
          </button>
        </section>
      </div>

      <div className="adm-dash__resumen-final">
        <span><CheckCircle2 size={14} /> {m.activos.length} activos</span>
        <span><XCircle size={14} /> {m.agotados.length} agotados</span>
        <span><Star size={14} /> {m.destacados.length} destacados</span>
      </div>
    </div>
  );
};

export default Dashboard;

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import Pagination from "../Pagination";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import PedidoDetalleModal from "../PedidoDetalleModal";
import {
  getOrders,
  updateOrderStatus,
  subscribeToOrders,
} from "../../data/dataSource";
import { formatCOP } from "../../utils/price";
import { Eye, RefreshCw, Bell, Calendar, ChevronDown } from "lucide-react";
import "../admin.css";

const ESTADOS = [
  { id: "todos", label: "Todos" },
  { id: "nuevo", label: "🆕 Nuevos" },
  { id: "preparacion", label: "👨‍🍳 En preparación" },
  { id: "camino", label: "🛵 En camino" },
  { id: "entregado", label: "✅ Entregados" },
  { id: "cancelado", label: "❌ Cancelados" },
];

const SIGUIENTE = {
  nuevo: { estado: "preparacion", label: "Aceptar" },
  preparacion: { estado: "camino", label: "Despachar" },
  camino: { estado: "entregado", label: "Entregar" },
};

const labelEstado = (estado) =>
({
  nuevo: "🆕 Nuevo",
  preparacion: "👨‍🍳 Preparación",
  camino: "🛵 En camino",
  entregado: "✅ Entregado",
  cancelado: "❌ Cancelado",
}[estado] || estado);

const resumen = (p) => {
  if (!p.items?.length) return "—";
  const texto = p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ");
  return texto.length > 44 ? texto.slice(0, 44) + "…" : texto;
};

//-----------------------------------------
const Pedidos = () => {
  const [pedidos, setPedidos] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [filtroMes, setFiltroMes] = useState(""); // "" = Todos, o "YYYY-MM"
  const [detalle, setDetalle] = useState(null);
  const [cargandoId, setCargandoId] = useState(null);
  const [nuevos, setNuevos] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [pedidoExpandido, setPedidoExpandido] = useState(null); // ID del pedido expandido

  const [cargandoGlobal, setCargandoGlobal] = useState(true);
  const timeOut = 1500;
  const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  //***************************** */
  const cargar = useCallback(async () => {
    try {
      setCargandoGlobal(true);
      const [data] = await Promise.all([getOrders(), esperar(timeOut)]);
      setPedidos(data);
      setPedidoExpandido(null); // Resetear acordeón al recargar
    } catch (e) {
      Swal.fire({
        title: "Error al cargar pedidos",
        text: e.message,
        icon: "error",
        confirmButtonColor: "#3D2314",
      });
      setPedidos([]);
    } finally {
      setCargandoGlobal(false);
    }
  }, []);

  // Carga inicial + realtime (pedido nuevo o cambio desde otro dispositivo)
  useEffect(() => {
    cargar();
    const unsubscribe = subscribeToOrders((evento, pedido) => {
      if (evento === "insert") {
        setPedidos((prev) => (prev ? [pedido, ...prev] : [pedido]));
        if (pedido.estado === "nuevo") {
          setNuevos((n) => n + 1);
          Swal.fire({
            icon: "info",
            title: `¡Pedido #${pedido.numero}!`,
            text: `${pedido.nombre} — ${formatCOP(pedido.total)}`,
            toast: true,
            position: "top-end",
            timer: 6000,
            showConfirmButton: false,
          });
        }
      }
      if (evento === "update") {
        setPedidos((prev) => prev?.map((p) => (p.id === pedido.id ? pedido : p)));
        setDetalle((d) => (d?.id === pedido.id ? pedido : d));
      }
    });
    return unsubscribe;
  }, [cargar]);

  // ... (el resto del código de filtros y paginación se mantiene igual hasta el render)
  // Calcular los meses disponibles basados en los pedidos
  const mesesDisponibles = useMemo(() => {
    if (!pedidos) return [];
    const setMeses = new Set();
    pedidos.forEach((p) => {
      const d = new Date(p.created_at);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      setMeses.add(mes);
    });

    return Array.from(setMeses)
      .sort()
      .reverse()
      .map((m) => {
        const [year, month] = m.split("-");
        const date = new Date(year, month - 1);
        const label = date.toLocaleString("es-CO", { month: "long", year: "numeric" });
        return {
          value: m,
          label: label.charAt(0).toUpperCase() + label.slice(1),
        };
      });
  }, [pedidos]);

  // Auto-seleccionar el mes actual o el más reciente al cargar
  useEffect(() => {
    if (mesesDisponibles.length > 0 && !filtroMes) {
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
      if (mesesDisponibles.some((m) => m.value === mesActual)) {
        setFiltroMes(mesActual);
      } else {
        setFiltroMes(mesesDisponibles[0].value);
      }
    }
  }, [mesesDisponibles, filtroMes]);

  // Resetear a página 1 y cerrar acordeón al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
    setPedidoExpandido(null);
  }, [filtro, filtroMes]);

  const conteos = useMemo(() => {
    const base = { todos: 0 };
    pedidos?.forEach((p) => {
      const d = new Date(p.created_at);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!filtroMes || filtroMes === "todos" || mes === filtroMes) {
        base.todos++;
        base[p.estado] = (base[p.estado] || 0) + 1;
      }
    });
    return base;
  }, [pedidos, filtroMes]);

  const filtrados = useMemo(() => {
    return (pedidos || []).filter((p) => {
      const d = new Date(p.created_at);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const pasaEstado = filtro === "todos" || p.estado === filtro;
      const pasaMes = !filtroMes || filtroMes === "todos" || mes === filtroMes;
      return pasaEstado && pasaMes;
    });
  }, [pedidos, filtro, filtroMes]);

  const paginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return filtrados.slice(inicio, inicio + itemsPorPagina);
  }, [filtrados, paginaActual, itemsPorPagina]);

  const cambiarEstado = async (pedido, nuevoEstado) => {
    setCargandoId(pedido.id);
    try {
      await Promise.all([updateOrderStatus(pedido.id, nuevoEstado), esperar(timeOut)]);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedido.id ? { ...p, estado: nuevoEstado } : p)),
      );
      setDetalle((d) => (d?.id === pedido.id ? { ...d, estado: nuevoEstado } : d));
    } catch (e) {
      Swal.fire({
        title: "No se pudo actualizar",
        text: e.message,
        icon: "error",
        confirmButtonColor: "#3D2314",
      });
    } finally {
      setCargandoId(null);
    }
  };

  const avanzarEstado = (pedido) => {
    const paso = SIGUIENTE[pedido.estado];
    if (paso) cambiarEstado(pedido, paso.estado);
  };

  const toggleExpandir = (id) => {
    setPedidoExpandido((prev) => (prev === id ? null : id));
  };

  if (cargandoGlobal || pedidos === null) {
    return (
      <div className="adm-page" style={{ minHeight: "80vh", position: "relative" }}>
        <LoadingOverlay fullScreen text="Sincronizando pedidos..." minTime={timeOut} />
      </div>
    );
  }

  //******************************** */
  return (
    <div className="admin-page admin-main-content" style={{ position: "relative" }}>
      <header className="admin-page__header admin-page__header--row">
        <h1 className="admin-page__titulo">Pedidos</h1>
        <div className="admin-page__acciones">
          <div className="adm-ped__filtro-mes">
            <Calendar size={15} />
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="adm-ped__select-mes"
            >
              <option value="todos">Todos los tiempos</option>
              {mesesDisponibles.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="admin-btn-ghost admin-btn-ghost--recargar" onClick={cargar}>
            <RefreshCw size={15} /> Recargar
          </button>
        </div>
      </header>

      {/* Chips de estado con conteo */}
      <div className="adm-ped__chips">
        {ESTADOS.map((e) => (
          <button
            key={e.id}
            type="button"
            className={"adm-ped__chip" + (filtro === e.id ? " adm-ped__chip--activa" : "")}
            onClick={() => setFiltro(e.id)}
          >
            {e.label}
            <span className="adm-ped__chip-count">{conteos[e.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* Lista de Pedidos (Acordeón) */}
      <div className="adm-ped__grid">
        {filtrados.length === 0 ? (
          <div className="admin-card" style={{ gridColumn: "1 / -1" }}>
            <p className="adm-prod__vacio">
              {filtro === "todos"
                ? "Aún no hay pedidos en este rango de tiempo."
                : "No hay pedidos en este estado."}
            </p>
          </div>
        ) : (
          paginados.map((p) => {
            const paso = SIGUIENTE[p.estado];
            
            return (
              <div 
                key={p.id} 
                className={`adm-ped-card adm-ped-card--clickable ${p.estado === "cancelado" ? "adm-ped-card--cancelado" : ""}`}
                onClick={() => setDetalle(p)}
              >
                <div className="adm-ped-card__header">
                  <div className="adm-ped-card__header-info">
                    <span className="adm-ped-card__numero">#{p.numero}</span>
                    <span className="adm-ped-card__fecha">
                      {new Date(p.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                  <span className={`adm-ped__estado adm-ped__estado--${p.estado}`}>
                    {labelEstado(p.estado)}
                  </span>
                </div>

                <div className="adm-ped-card__body">
                  <div className="adm-ped-card__cliente">
                    <span className="adm-ped-card__nombre">{p.nombre}</span>
                    <span className="adm-ped-card__info">
                      {p.tipo_entrega === "recogida" ? (
                        <strong>💁‍♂️ Recoger en tienda</strong>
                      ) : (
                        <>🏍️ Domicilio</>
                      )}
                      {" · "}{formatCOP(p.total)}
                    </span>
                  </div>
                  <div className="adm-ped-card__resumen-linea">
                    {resumen(p)}
                  </div>
                </div>

                {paso && (
                  <div className="adm-ped-card__footer">
                    <button
                      type="button"
                      className={`admin-btn-primary admin-btn-primary--full adm-btn-estado--${paso.estado}`}
                      disabled={cargandoId === p.id}
                      onClick={(e) => { e.stopPropagation(); avanzarEstado(p); }}
                    >
                      {paso.label}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {filtrados.length > 0 && (
        <Pagination
          paginaActual={paginaActual}
          totalItems={filtrados.length}
          itemsPorPagina={itemsPorPagina}
          onCambiarPagina={(p) => setPaginaActual(p)}
          onCambiarItemsPorPagina={(n) => {
            setItemsPorPagina(n);
            setPaginaActual(1);
          }}
        />
      )}

      {detalle && (
        <PedidoDetalleModal
          pedido={detalle}
          onClose={() => setDetalle(null)}
          onEstado={cambiarEstado}
          onCancel={(p) => {
            if (window.confirm("¿Seguro que deseas cancelar este pedido?")) {
              cambiarEstado(p, "cancelado");
              setDetalle(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default Pedidos;
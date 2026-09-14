import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Bell } from "lucide-react";
import Swal from "sweetalert2";
import {
  getOrders,
  updateOrderStatus,
  subscribeToOrders,
} from "../../data/dataSource";
import { formatCOP } from "../../utils/price";
import PedidoDetalleModal from "../PedidoDetalleModal";
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

const Pedidos = () => {
  const [pedidos, setPedidos] = useState(null); // null = cargando
  const [filtro, setFiltro] = useState("todos");
  const [detalle, setDetalle] = useState(null);
  const [cargandoId, setCargandoId] = useState(null);
  const [nuevos, setNuevos] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const data = await getOrders();
      setPedidos(data);
    } catch (e) {
      Swal.fire({
        title: "Error al cargar pedidos",
        text: e.message,
        icon: "error",
        confirmButtonColor: "#3D2314",
      });
      setPedidos([]);
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

  const conteos = useMemo(() => {
    const base = { todos: pedidos?.length ?? 0 };
    pedidos?.forEach((p) => {
      base[p.estado] = (base[p.estado] || 0) + 1;
    });
    return base;
  }, [pedidos]);

  const filtrados = useMemo(
    () => (pedidos || []).filter((p) => filtro === "todos" || p.estado === filtro),
    [pedidos, filtro],
  );

  const cambiarEstado = async (pedido, nuevoEstado) => {
    setCargandoId(pedido.id);
    try {
      await updateOrderStatus(pedido.id, nuevoEstado);
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
    }
    setCargandoId(null);
  };

  const avanzarEstado = (pedido) => {
    const paso = SIGUIENTE[pedido.estado];
    if (paso) cambiarEstado(pedido, paso.estado);
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header admin-page__header--row">
        <div>
          <h1 className="admin-page__titulo">Pedidos</h1>
          <p className="admin-page__sub">
            {pedidos
              ? `${conteos.nuevo || 0} nuevos · ${conteos.preparacion || 0} en preparación · ${conteos.camino || 0} en camino`
              : "Cargando…"}
          </p>
        </div>
        <div className="admin-page__acciones">
          {nuevos > 0 && (
            <button
              type="button"
              className="admin-btn-ghost admin-btn-ghost--alerta"
              onClick={() => setNuevos(0)}
              title="Marcar alertas como vistas"
            >
              <Bell size={15} /> {nuevos} nuevo(s) 🛎️
            </button>
          )}
          <button type="button" className="admin-btn-ghost" onClick={cargar}>
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

      {/* Tabla */}
      <div className="admin-card admin-card--tabla">
        {pedidos === null ? (
          <p className="adm-prod__vacio">Cargando pedidos…</p>
        ) : filtrados.length === 0 ? (
          <p className="adm-prod__vacio">
            {filtro === "todos"
              ? "Aún no hay pedidos. Cuando un cliente compre, aparecerá aquí en tiempo real."
              : "No hay pedidos en este estado."}
          </p>
        ) : (
          <table className="adm-prod__tabla">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Cliente</th>
                <th>Resumen</th>
                <th>Entrega</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th className="adm-prod__col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const paso = SIGUIENTE[p.estado];
                return (
                  <tr
                    key={p.id}
                    className={p.estado === "cancelado" ? "adm-prod__fila--agotada" : ""}
                  >
                    <td className="adm-ped__numero">#{p.numero}</td>
                    <td>
                      <strong className="adm-ped__nombre">{p.nombre}</strong>
                      <small className="adm-ped__tel">{p.telefono}</small>
                      <small className="adm-ped__dir">
                        {p.direccion}
                        {p.unidad ? `, ${p.unidad}` : ""}
                        {p.apto ? `, ${p.apto}` : ""}
                      </small>
                    </td>
                    <td className="adm-ped__resumen" title={resumen(p)}>
                      {resumen(p)}
                    </td>
                    <td>
                      <span
                        className={`adm-ped__entrega adm-ped__entrega--${p.tipo_entrega === "recogida" ? "recogida" : "domicilio"
                          }`}
                      >
                        {p.tipo_entrega === "recogida" ? "🏪 Recogida" : "🛵 Domicilio"}
                      </span>
                    </td>
                    <td className="adm-prod__precio">{formatCOP(p.total)}</td>
                    <td>
                      <span className={`adm-ped__estado adm-ped__estado--${p.estado}`}>
                        {labelEstado(p.estado)}
                      </span>
                      <select
                        className="adm-ped__select-estado"
                        value={p.estado}
                        disabled={cargandoId === p.id}
                        onChange={(e) => cambiarEstado(p, e.target.value)}
                      >
                        {ESTADOS.filter((e) => e.id !== "todos").map((e) => (
                          <option key={e.id} value={e.id}>
                            {labelEstado(e.id)}
                          </option>
                        ))}
                      </select>
                      {paso && (
                        <button
                          type="button"
                          className="admin-btn-ghost admin-btn-ghost--mini"
                          disabled={cargandoId === p.id}
                          onClick={() => avanzarEstado(p)}
                        >
                          {paso.label}
                        </button>
                      )}
                    </td>
                    <td className="adm-ped__fecha">
                      {new Date(p.created_at).toLocaleString("es-CO", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="adm-prod__col-acciones">
                      <button
                        type="button"
                        className="adm-icono-btn"
                        title="Ver detalle"
                        onClick={() => setDetalle(p)}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {detalle && (
        <PedidoDetalleModal
          pedido={detalle}
          onClose={() => setDetalle(null)}
          onEstado={cambiarEstado}
        />
      )}
    </div>
  );
};

export default Pedidos;

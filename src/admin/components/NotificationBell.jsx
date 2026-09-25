import React, { useState, useEffect, useMemo } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getOrders, subscribeToOrders } from "../../data/dataSource";
import "./NotificationBell.css";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [hasAnimated, setHasAnimated] = useState(false);

  const cargarPedidos = async () => {
    try {
      const data = await getOrders();
      setPedidos(data || []);
    } catch (e) {
      console.error("Error cargando pedidos para notificaciones", e);
    }
  };

  useEffect(() => {
    cargarPedidos();
    const unsubscribe = subscribeToOrders((evento, pedido) => {
      if (evento === "insert") {
        setPedidos((prev) => (prev ? [pedido, ...prev] : [pedido]));
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const day = String(tomorrow.getDate()).padStart(2, "0");
        const searchString = `AGENDADO PARA: ${year}-${month}-${day}`;

        let isAgendadoManana = pedido.observaciones && pedido.observaciones.includes(searchString);
        if (!isAgendadoManana && pedido.items) {
          isAgendadoManana = pedido.items.some(
            (item) => item.observaciones && item.observaciones.includes(searchString)
          );
        }
        if (isAgendadoManana) {
          setHasAnimated(false); // Trigger animation & sound only on NEW scheduled orders for tomorrow
        }
      }
      if (evento === "update") {
        setPedidos((prev) => prev?.map((p) => (p.id === pedido.id ? pedido : p)));
      }
    });
    return unsubscribe;
  }, []);

  const pendientesAgendados = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");
    const searchString = `AGENDADO PARA: ${year}-${month}-${day}`;

    return pedidos.filter((p) => {
      // Ignorar entregados y cancelados
      if (p.estado === "entregado" || p.estado === "cancelado") return false;
      
      let isAgendadoManana = p.observaciones && p.observaciones.includes(searchString);
      if (!isAgendadoManana && p.items) {
        isAgendadoManana = p.items.some(
          (item) => item.observaciones && item.observaciones.includes(searchString)
        );
      }
      return isAgendadoManana;
    });
  }, [pedidos]);

  const hasPending = pendientesAgendados.length > 0;

  useEffect(() => {
    if (hasPending && !hasAnimated) {
      setHasAnimated(true);
      // Play a short beep using Web Audio API
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch (e) {
        console.warn("No se pudo reproducir sonido de alerta", e);
      }
    }
  }, [hasPending, hasAnimated]);

  return (
    <button
      type="button"
      className={`admin-topbar__bell ${hasPending ? "ringing" : ""}`}
      onClick={() => navigate("/admin/pedidos")}
      title={hasPending ? `${pendientesAgendados.length} tortas agendadas pendientes` : "Sin tortas pendientes"}
    >
      <div className="bell-icon-wrapper">
        <Bell size={20} />
        {hasPending && (
          <span className="bell-badge">{pendientesAgendados.length}</span>
        )}
      </div>
    </button>
  );
};

export default NotificationBell;

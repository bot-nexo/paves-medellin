import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import AdditionFormModal from "../AdditionFormModal";
import Pagination from "../Pagination";
import Switch from "../Switch";
import Swal from "sweetalert2";
import {
  getAdditions, createAddition, updateAddition, deleteAddition,
  getSauces, createSauce, updateSauce, deleteSauce,
} from "../../data/dataSource";
import { formatCOP } from "../../utils/price";
import { Plus, Pencil, Trash2, RefreshCw, Flame, Sparkles, Search } from "lucide-react";
import "../admin.css";

const timeOut = 1200;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Tab genérico ────────────────────────────────────────────────────────────
const TabContent = ({
  tipo, // "addition" | "sauce"
  items, setItems,
  onCreate, onUpdate, onDelete,
}) => {
  const label = tipo === "sauce" ? "salsa" : "adición";
  const labelPlur = tipo === "sauce" ? "salsas" : "adiciones";
  const labelCap = tipo === "sauce" ? "Salsa" : "Adición";
  const Icon = tipo === "sauce" ? Flame : Sparkles;

  const [modal, setModal] = useState({ abierto: false, item: null });
  const [procesandoId, setProcId] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(8);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos" | "disponibles" | "inactivos"

  //*********************************** */
  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (items || []).filter((it) => {
      const okBus = !q || it.nombre.toLowerCase().includes(q);
      const okEstado =
        filtroEstado === "todos" ? true
          : filtroEstado === "disponibles" ? it.disponible
            : /* inactivos */ !it.disponible;
      return okBus && okEstado;
    });
  }, [items, busqueda, filtroEstado]);

  const paginados = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return filtrados.slice(inicio, inicio + porPagina);
  }, [filtrados, pagina, porPagina]);

  const toggleDisponible = async (it) => {
    const nuevo = !it.disponible;
    setProcId(it.id);
    try {
      await onUpdate(it.id, { disponible: nuevo });
      setItems((prev) => prev.map((x) => x.id === it.id ? { ...x, disponible: nuevo } : x));
    } catch (e) {
      Swal.fire({ title: "No se pudo actualizar", text: e.message, icon: "error", confirmButtonColor: "#3D2314" });
    } finally { setProcId(null); }
  };

  const eliminar = async (it) => {
    const res = await Swal.fire({
      title: `¿Eliminar "${it.nombre}"?`,
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#E07A5F",
      cancelButtonColor: "#3D2314",
      reverseButtons: true,
    });
    if (!res.isConfirmed) return;

    setProcId(it.id);
    try {
      await onDelete(it.id);
      setItems((prev) => prev.filter((x) => x.id !== it.id));
      Swal.fire({ icon: "success", title: `${labelCap} eliminada`, toast: true, position: "top-end", timer: 2200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ title: "No se pudo eliminar", text: e.message, icon: "error", confirmButtonColor: "#3D2314" });
    } finally { setProcId(null); }
  };

  //*********************************** */
  return (
    <>
      <div className="adm-extras__tab-header">
        <p className="admin-page__sub">
        </p>
        <button
          type="button"
          className="admin-btn-primary admin-btn-primary--compacto"
          onClick={() => setModal({ abierto: true, item: null })}
        >
          <Plus size={16} /> Nueva {label}
        </button>
      </div>

      {/* Filtros */}
      <div className="adm-prod__filtros">
        <div className="admin-field__input adm-prod__buscador">
          <Search size={15} className="admin-field__icon" />
          <input
            type="text"
            placeholder={`Buscar ${labelPlur} por nombre…`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="adm-filtro-estado" role="group" aria-label="Filtrar por estado">
          {[
            { valor: "todos", etiqueta: "Todos", num: (items || []).length },
            { valor: "disponibles", etiqueta: "Disponibles", num: (items || []).filter((x) => x.disponible).length },
            { valor: "inactivos", etiqueta: "Inactivos", num: (items || []).filter((x) => !x.disponible).length },
          ].map(({ valor, etiqueta, num }) => (
            <button
              key={valor}
              type="button"
              className={`adm-filtro-estado__btn${filtroEstado === valor ? " adm-filtro-estado__btn--activo" : ""}`}
              onClick={() => setFiltroEstado(valor)}
            >
              {etiqueta}
              <span className="adm-filtro-estado__num">{num}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card admin-card--tabla admin-main-content">
        {filtrados.length === 0 ? (
          <p className="adm-prod__vacio">No hay {labelPlur} que coincidan con el filtro.</p>
        ) : (
          <table className="adm-prod__tabla">
            <thead>
              <tr>
                <th><Icon size={14} /> Nombre</th>
                <th>Precio extra</th>
                <th>Orden</th>
                <th>Disponible</th>
                <th className="adm-prod__col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map((it) => (
                <tr key={it.id} className={it.disponible ? "" : "adm-prod__fila--agotada"}>
                  <td><strong>{it.nombre}</strong></td>
                  <td>
                    {it.precio > 0
                      ? <span className="adm-chip adm-chip--precio">+{formatCOP(it.precio)}</span>
                      : <span className="adm-chip">Gratis</span>}
                  </td>
                  <td>{it.orden}</td>
                  <td>
                    <Switch
                      activo={it.disponible}
                      disabled={procesandoId === it.id}
                      onChange={() => toggleDisponible(it)}
                      etiqueta={it.disponible ? "Ocultar" : "Mostrar"}
                    />
                  </td>
                  <td className="adm-prod__col-acciones">
                    <button type="button" className="adm-icono-btn" title="Editar"
                      onClick={() => setModal({ abierto: true, item: it })}>
                      <Pencil size={15} />
                    </button>
                    <button type="button" className="adm-icono-btn adm-icono-btn--peligro" title="Eliminar"
                      disabled={procesandoId === it.id}
                      onClick={() => eliminar(it)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtrados.length > 0 && (
        <Pagination
          paginaActual={pagina}
          totalItems={filtrados.length}
          itemsPorPagina={porPagina}
          onCambiarPagina={setPagina}
          onCambiarItemsPorPagina={(n) => { setPorPagina(n); setPagina(1); }}
        />
      )}

      {modal.abierto && (
        <AdditionFormModal
          tipo={tipo}
          item={modal.item}
          ordenSugerido={
            (items?.reduce((max, x) => Math.max(max, x.orden || 0), 0) || 0) + 1
          }
          onCreate={onCreate}
          onUpdate={onUpdate}
          onClose={() => setModal({ abierto: false, item: null })}
          onSaved={async () => {
            setModal({ abierto: false, item: null });
            // Refresca solo este tab
            const data = tipo === "sauce" ? await getSauces() : await getAdditions();
            setItems(data);
          }}
        />
      )}
    </>
  );
};

// ── Página principal ────────────────────────────────────────────────────────
const Adiciones = () => {
  const [adiciones, setAdiciones] = useState(null);
  const [salsas, setSalsas] = useState(null);
  const [tabActivo, setTabActivo] = useState("adiciones");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [adds, sauces] = await Promise.all([getAdditions(), getSauces(), esperar(timeOut)]);
      setAdiciones(adds);
      setSalsas(sauces);
    } catch (e) {
      Swal.fire({ title: "Error al cargar", text: e.message, icon: "error", confirmButtonColor: "#3D2314" });
      setAdiciones([]);
      setSalsas([]);
    } finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (adiciones === null || salsas === null) {
    return <LoadingOverlay fullScreen text="Cargando adiciones y salsas" minTime={timeOut} />;
  }

  return (
    <div className="admin-page">
      {cargando && <LoadingOverlay text="Sincronizando…" minTime={timeOut} />}

      <header className="admin-page__header admin-page__header--row">
        <div>
          <h1 className="admin-page__titulo">Adiciones & Salsas</h1>
          <p className="admin-page__sub">
            Gestiona el catálogo de extras que puedes asociar a cada producto.
          </p>
        </div>
        <div className="admin-page__acciones">
          <button type="button" className="admin-btn-ghost" onClick={cargar} disabled={cargando}>
            <RefreshCw size={15} className={cargando ? "adm-spin" : ""} /> Recargar
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="adm-extras__tabs">
        <button
          type="button"
          className={`adm-extras__tab ${tabActivo === "adiciones" ? "adm-extras__tab--active" : ""}`}
          onClick={() => setTabActivo("adiciones")}
        >
          <Sparkles size={15} /> Adiciones ({adiciones.length})
        </button>
        <button
          type="button"
          className={`adm-extras__tab ${tabActivo === "salsas" ? "adm-extras__tab--active" : ""}`}
          onClick={() => setTabActivo("salsas")}
        >
          <Flame size={15} /> Salsas ({salsas.length})
        </button>
      </div>

      {tabActivo === "adiciones" ? (
        <TabContent
          tipo="addition"
          items={adiciones}
          setItems={setAdiciones}
          onCreate={createAddition}
          onUpdate={updateAddition}
          onDelete={deleteAddition}
        />
      ) : (
        <TabContent
          tipo="sauce"
          items={salsas}
          setItems={setSalsas}
          onCreate={createSauce}
          onUpdate={updateSauce}
          onDelete={deleteSauce}
        />
      )}
    </div>
  );
};

export default Adiciones;

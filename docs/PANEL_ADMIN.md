# 🛠️ Panel Administrativo — Pavés Medellín

> **Documento de definición (v1).** Acordado antes de programar. Cualquier cambio
> de alcance se documenta aquí primero.

---

## 1. Objetivo

Que el dueño del negocio gestione su catálogo, pedidos e información **sin tocar
código ni volver a desplegar**: desde un panel web protegido, disponible en
cualquier dispositivo.

## 2. Stack y decisiones de arquitectura

| Decisión | Elección | Motivo |
|---|---|---|
| Backend | **Supabase** (Postgres + Auth + Storage) | Gratuito, gestión de datos en tiempo real, auth real, alojamiento de imágenes |
| Auth | **Supabase Auth** (email + contraseña) | Sesiones seguras, recuperación de contraseña |
| Front | React 18 + Vite (existente) | Sin reescritura, reutiliza componentes y estilos |
| Datos públicos | Catálogo lee de Supabase con **fallback** a datos locales si falla la red | El catálogo nunca se rompe |
| Pedidos | Se registran en BD **y** se envían a WhatsApp | WhatsApp sigue siendo el canal del negocio; la BD da trazabilidad |
| Routing | **react-router-dom** | URLs limpias (/admin, /admin/productos), navegación nativa |
| Hosting | **Netlify** | Variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` |
| Estrategia | Datos de ejemplo locales con **capa de datos intercambiable** | Se programa ya; Supabase se conecta cuando el cliente valide su cuenta (solo se cambia el adapter) |

## 3. Modelo de datos (Supabase)

```sql
categories:   id, nombre, emoji, orden, visible
products:     id, nombre, category_id, descripcion, precio, imagen_url,
              destacado, disponible, nota, orden, created_at, updated_at
settings:     id(1), phone, address, maps_url, instagram, facebook, tiktok,
              day1, hours1, delivery_fee, free_delivery_threshold
orders:       id, numero, nombre, telefono, direccion, unidad, apto, pago,
              subtotal, delivery_fee, total, items(jsonb snapshot),
              estado, created_at
```

**Seguridad (RLS):**
- Lectura pública (`anon`): `products`, `categories`, `settings`.
- Escritura: solo usuario autenticado (admin).
- `orders`: `insert` público (el cliente hace checkout), `select/update` solo admin.

**Storage:** bucket `product-images` para subir fotos desde el panel. El servicio
(`src/services/storage.js`) comprime en el navegador (máx 1000px, JPEG q0.8),
nombra con timestamp y **elimina la imagen anterior al reemplazar** — optimizado
para la capa gratuita (1 GB). Las imágenes de producto originales viven como
assets del código; la BD las resuelve por nombre (ver `localImagesByNombre` en
`src/data/menu.js`) hasta que el admin suba fotos propias.

> ⚠️ **Lección registrada (2026-09-14):** `menu.js` NUNCA se elimina — es el
> fallback/seed del sistema. Restaurarlo con git sin sus exports nuevos rompe
> la app (`localImagesByNombre` faltante). Al mover datos a BD, conservar el
> archivo local completo.

## 3.1 Sistema de diseño del panel (tema oscuro "postre")

Tema oscuro profesional con paleta inspirada en el nicho (pavés, helados, postres):

| Token | Color | Uso |
|---|---|---|
| `bg-base` | `#16100D` (chocolate amargo) | Fondo principal |
| `bg-panel` | `#241A15` (cacao) | Sidebar, tarjetas, modales |
| `accent` | `#E0A45E` (caramelo) | Botones primarios, activos, links |
| `accent-soft` | `#F3E5D5` (crema) | Textos principales sobre oscuro |
| `pink` | `#E8879C` (fresa) | Destacados, badges de atención |
| `mint` | `#7FC8A9` (menta/helado) | Estados OK / disponible |
| `danger` | `#E07A5F` | Estados agotado / eliminar |

Tipografía e iconografía: se mantiene `lucide-react` (ya en el proyecto). Sin frameworks CSS nuevos.

## 4. Módulos del panel

```
/admin
├── 🔐 Login                (Supabase Auth)
├── 📊 Dashboard            (resumen: productos, pedidos hoy, ventas del día)
├── 🍰 Productos            (CRUD + foto + precio + disponible + destacado + nota)
├── 🗂️ Categorías           (CRUD + emoji + orden + visible)
├── 🧾 Pedidos              (lista con estados: nuevo → preparación → en camino → entregado / cancelado)
├── 🏪 Info del negocio     (horarios, teléfono, redes, dirección)
└── ⚙️ Configuración        (domicilio: valor y umbral de envío gratis)
```

## 5. Cambios en el catálogo público (mínimos, sin romper nada)

1. `src/data/menu.js` → adapter: lee de Supabase (mismo shape de datos) con
   fallback a los datos actuales si no hay conexión. Los 17 productos actuales
   se migran como seed inicial.
2. Checkout: antes de abrir WhatsApp, se guarda el pedido en `orders` con su
   número (`#N`) y se incluye en el mensaje de WhatsApp.
3. Cero cambios visuales en la tienda.

## 6. Fases de implementación

- [x] **F1 — Capa de datos:** adapter `dataSource` (local con datos actuales ↔ Supabase) — ✅ HECHA (2026-09-14)
      - `src/services/supabaseClient.js` · `src/data/dataSource.js` · `supabase/schema.sql` · `supabase/seed.sql`
      - Fallback automático a local + realtime + `createOrder()` listo para F2
      - ⚠️ Pendiente del usuario: ejecutar `schema.sql` y `seed.sql` en el SQL Editor de Supabase
- [x] **F2 — Catálogo:** conectar adapter + registro de pedidos en checkout — ✅ HECHA (2026-09-14)
      - `useCatalog` alimenta la tienda (estado inicial local → swap a Supabase → realtime)
      - Checkout guarda el pedido en `orders` y añade el nº al mensaje de WhatsApp (no bloqueante)
      - Domicilio/envío gratis ahora dinámicos (`settings.deliveryFee`, `settings.freeDeliveryThreshold`)
      - Footer/Menu leen de settings/categorías dinámicas
      - ⚠️ Re-ejecutar `schema.sql` en Supabase (añade columna `orders.observaciones`, idempotente)
- [ ] **F3 — Admin base:** react-router, login, layout con sidebar (tema oscuro postre)
- [ ] **F4 — Módulo Productos** (el núcleo)
- [ ] **F5 — Módulo Categorías**
- [ ] **F6 — Módulo Pedidos** (lista, detalle, cambio de estado)
- [ ] **F7 — Info del negocio + Configuración**
- [ ] **F8 — Dashboard + pulido final + pruebas de regresión de la tienda**
- [ ] **F9 — Supabase real:** cuando el cliente valide su cuenta → proyecto, schema SQL, RLS, seed, bucket, y solo se activa el adapter

## 7. Criterios de aceptación

- El catálogo público funciona idéntico a hoy (carrito, WhatsApp, personalizaciones).
- El admin crea/edita/agota/destaca productos y se refleja al instante en la tienda.
- Los pedidos quedan registrados con número, detalle y estado.
- Solo el dueño (login) puede acceder al panel.

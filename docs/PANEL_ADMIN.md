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

**Storage:** bucket `product-images` para subir fotos desde el panel.

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

- [ ] **F1 — Supabase:** proyecto, schema SQL, RLS, seed de datos actuales, bucket de imágenes
- [ ] **F2 — Catálogo:** adapter de datos + registro de pedidos en checkout
- [ ] **F3 — Admin base:** routing, login, layout con sidebar protegido
- [ ] **F4 — Módulo Productos** (el núcleo)
- [ ] **F5 — Módulo Categorías**
- [ ] **F6 — Módulo Pedidos** (lista, detalle, cambio de estado)
- [ ] **F7 — Info del negocio + Configuración**
- [ ] **F8 — Dashboard + pulido final + pruebas de regresión de la tienda**

## 7. Criterios de aceptación

- El catálogo público funciona idéntico a hoy (carrito, WhatsApp, personalizaciones).
- El admin crea/edita/agota/destaca productos y se refleja al instante en la tienda.
- Los pedidos quedan registrados con número, detalle y estado.
- Solo el dueño (login) puede acceder al panel.

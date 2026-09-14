-- ============================================================================
-- Pavés Medellín — Schema del panel administrativo
-- Ejecutar en Supabase → SQL Editor. Idempotente (se puede re-ejecutar).
-- Orden de ejecución: 1) schema.sql  2) seed.sql
-- ============================================================================

-- ── Categorías ──────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  emoji      text not null default '',
  label      text not null default '',      -- etiqueta completa con emoji ("🍨 Pavés 8oz")
  orden      int  not null default 0,
  visible    boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Productos ───────────────────────────────────────────────────────────────
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  descripcion text not null default '',
  precio      int  not null default 0,        -- COP, sin decimales
  imagen_url  text not null default '',       -- URL de Storage (http); asset local se resuelve en lectura
  destacado   boolean not null default false,
  disponible  boolean not null default true,
  nota        text not null default '',       -- ej: "LA PUEDES PEDIR CON 4 HORAS..."
  orden       int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);

-- ── Configuración del negocio (fila única id=1) ─────────────────────────────
create table if not exists public.settings (
  id                      int primary key default 1 check (id = 1),
  phone                   text not null default '',
  address                 text not null default '',
  maps_url                text not null default '',
  instagram               text not null default '',
  facebook                text not null default '',
  tiktok                  text not null default '',
  day1                    text not null default '',
  hours1                  text not null default '',
  delivery_fee            int  not null default 3500,
  free_delivery_threshold int  not null default 45000,
  offers_delivery         boolean not null default true,   -- 🛵 domicilio
  offers_pickup           boolean not null default true,   -- 🏪 recogida en tienda
  force_closed            boolean not null default false,  -- cierre de emergencia
  updated_at              timestamptz not null default now()
);

-- ── Pedidos (el público inserta; solo el admin lee/actualiza) ───────────────
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  numero       int generated always as identity,  -- nº de pedido legible (#1, #2, ...)
  nombre       text not null,
  telefono     text not null,
  direccion    text not null default '',
  unidad       text not null default '',
  apto         text not null default '',
  observaciones text not null default '',
  pago         text not null default '',
  tipo_entrega text not null default 'domicilio', -- 'domicilio' | 'recogida'
  subtotal     int  not null default 0,
  delivery_fee int  not null default 0,
  total        int  not null default 0,
  items        jsonb not null default '[]'::jsonb, -- snapshot del carrito al momento del pedido
  estado       text not null default 'nuevo'
               check (estado in ('nuevo','preparacion','camino','entregado','cancelado')),
  created_at   timestamptz not null default now(),
  unique (numero)
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_estado_idx on public.orders (estado);

-- ── Trigger updated_at automático ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
for each row execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.settings   enable row level security;
alter table public.orders     enable row level security;

-- ── GRANTs a nivel Postgres (necesarios además de RLS) ─────────────────────
-- Sin esto, anon recibe "permission denied" y el front cae al fallback local.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.settings to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Lectura pública del catálogo (anon + autenticados)
drop policy if exists "categorias_lectura_publica" on public.categories;
create policy "categorias_lectura_publica" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "productos_lectura_publica" on public.products;
create policy "productos_lectura_publica" on public.products
  for select to anon, authenticated using (true);

drop policy if exists "settings_lectura_publica" on public.settings;
create policy "settings_lectura_publica" on public.settings
  for select to anon, authenticated using (true);

-- Escritura solo con sesión iniciada (el dueño/admin)
drop policy if exists "categorias_admin_todo" on public.categories;
create policy "categorias_admin_todo" on public.categories
  for all to authenticated using (true) with check (true);

drop policy if exists "productos_admin_todo" on public.products;
create policy "productos_admin_todo" on public.products
  for all to authenticated using (true) with check (true);

drop policy if exists "settings_admin_todo" on public.settings;
create policy "settings_admin_todo" on public.settings
  for all to authenticated using (true) with check (true);

-- Pedidos: el público solo crea; el admin lee y actualiza estados
drop policy if exists "pedidos_insert_publico" on public.orders;
create policy "pedidos_insert_publico" on public.orders
  for insert to anon, authenticated with check (true);

drop policy if exists "pedidos_select_admin" on public.orders;
create policy "pedidos_select_admin" on public.orders
  for select to authenticated using (true);

drop policy if exists "pedidos_update_admin" on public.orders;
create policy "pedidos_update_admin" on public.orders
  for update to authenticated using (true) with check (true);

-- ── Storage: imágenes de productos ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "imagenes_lectura_publica" on storage.objects;
create policy "imagenes_lectura_publica" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');

drop policy if exists "imagenes_admin_insert" on storage.objects;
create policy "imagenes_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

drop policy if exists "imagenes_admin_update" on storage.objects;
create policy "imagenes_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

drop policy if exists "imagenes_admin_delete" on storage.objects;
create policy "imagenes_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

-- ── Migraciones ligeras (por si ya ejecutaste una versión anterior) ─────────
alter table public.orders add column if not exists observaciones text not null default '';
alter table public.orders add column if not exists tipo_entrega text not null default 'domicilio';
alter table public.settings add column if not exists offers_delivery boolean not null default true;
alter table public.settings add column if not exists offers_pickup boolean not null default true;
alter table public.settings add column if not exists force_closed boolean not null default false;

-- ── RPC segura: crear pedido y devolver su nº ───────────────────────────────
-- Evita dar SELECT de orders a anon (protege teléfonos/direcciones de otros
-- clientes): la función corre con privilegios del dueño y SOLO devuelve el nº.
create or replace function public.crear_pedido(
  p_nombre text, p_telefono text, p_direccion text, p_unidad text,
  p_apto text, p_observaciones text, p_pago text,
  p_subtotal int, p_delivery_fee int, p_total int, p_items jsonb,
  p_tipo_entrega text default 'domicilio'
) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_numero int;
begin
  insert into public.orders
    (nombre, telefono, direccion, unidad, apto, observaciones, pago, tipo_entrega,
     subtotal, delivery_fee, total, items)
  values
    (p_nombre, p_telefono, p_direccion, p_unidad, p_apto, p_observaciones, p_pago, p_tipo_entrega,
     p_subtotal, p_delivery_fee, p_total, p_items)
  returning numero into v_numero;
  return v_numero;
end $$;

grant execute on function public.crear_pedido(text, text, text, text, text, text, text, int, int, int, jsonb, text)
  to anon, authenticated;

-- ── Realtime: publicar tablas para postgres_changes ────────────────────────
-- Sin esto, las suscripciones en tiempo real no reciben eventos.
do $$ begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.categories;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.settings;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Pavés Medellín — Schema del panel administrativo
-- Ejecutar en Supabase → SQL Editor. Idempotente (se puede re-ejecutar).
-- Orden de ejecución: 1) schema.sql  2) seed.sql
-- ============================================================================
-- ── Categorías ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  emoji text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  -- etiqueta completa con emoji ("🍨 Pavés 8oz")
 orden int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Productos ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  category_id uuid REFERENCES public.categories(id) ON delete set NULL,
  descripcion text NOT NULL DEFAULT '',
  precio int NOT NULL DEFAULT 0,
  -- COP, sin decimales
 imagen_url text NOT NULL DEFAULT '',
  -- URL de Storage (http); asset local se resuelve en lectura
 destacado boolean NOT NULL DEFAULT false,
  disponible boolean NOT NULL DEFAULT true,
  nota text NOT NULL DEFAULT '',
  -- ej: "LA PUEDES PEDIR CON 4 HORAS..."
 orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category_id);

-- ── Configuración del negocio (fila única id=1) ─────────────────────────────
create table if not exists public.settings (
  id                      int primary key default 1 check (id = 1),
  phone                   text not null default '',
  address                 text not null default '',
  maps_url                text not null default '',
  instagram               text not null default '',
  facebook                text not null default '',
  tiktok                  text not null default '',
  logo_url                text not null default '',
  day1                    text not null default '',
  hours1                  text not null default '',
  delivery_fee            int  not null default 0,
  free_delivery_threshold int  not null default 0,
  offers_delivery         boolean not null default true,   -- 🛵 domicilio
  offers_pickup           boolean not null default true,   -- 🏪 recogida en tienda
  offersLocal             boolean not null default true,   -- 🍽️ local
  force_closed            boolean not null default false,  -- cierre de emergencia
  plan_adiciones          boolean not null default true,
  plan_promociones        boolean not null default true,
  plan_reportes           boolean not null default true,
  plan_diseno             boolean not null default true,
  slogan                  text not null default '',
  razon_social            text not null default '',
  updated_at              timestamptz not null default now()
);

-- ── Pedidos (el público inserta; solo el admin lee/actualiza) ───────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero int generated always AS identity,
  -- nº de pedido legible (#1, #2, ...)
 nombre text NOT NULL,
  telefono text NOT NULL,
  direccion text NOT NULL DEFAULT '',
  unidad text NOT NULL DEFAULT '',
  apto text NOT NULL DEFAULT '',
  observaciones text NOT NULL DEFAULT '',
  pago text NOT NULL DEFAULT '',
  tipo_entrega text NOT NULL DEFAULT 'domicilio',
  -- 'domicilio' | 'recogida'
 subtotal int NOT NULL DEFAULT 0,
  delivery_fee int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- snapshot del carrito al momento del pedido
 estado text NOT NULL DEFAULT 'nuevo' check (estado IN ('nuevo','preparacion','camino','entregado','cancelado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (numero)
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at desc);

CREATE INDEX IF NOT EXISTS orders_estado_idx ON public.orders (estado);

-- ── Trigger updated_at automático ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  new.updated_at = now();
  return new;
end $$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;

CREATE TRIGGER products_updated_at
BEFORE update ON public.products
FOR EACH ROW execute function public.set_updated_at();

DROP TRIGGER IF EXISTS settings_updated_at ON public.settings;

CREATE TRIGGER settings_updated_at
BEFORE update ON public.settings
FOR EACH ROW execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.categories enable row level security;

ALTER TABLE public.products enable row level security;

ALTER TABLE public.settings enable row level security;

ALTER TABLE public.orders enable row level security;

-- ── GRANTs a nivel Postgres (necesarios además de RLS) ─────────────────────
-- Sin esto, anon recibe "permission denied" y el front cae al fallback local.
GRANT usage ON schema public TO anon, authenticated;

GRANT select ON public.categories, public.products, public.settings TO anon, authenticated;

GRANT insert ON public.orders TO anon, authenticated;

GRANT all ON all tables IN schema public TO authenticated;

GRANT usage, select ON all sequences IN schema public TO anon, authenticated;

-- Lectura pública del catálogo (anon + autenticados)
drop policy IF EXISTS "categorias_lectura_publica" ON public.categories;

create policy "categorias_lectura_publica" ON public.categories for select TO anon, authenticated
USING (true);

drop policy IF EXISTS "productos_lectura_publica" ON public.products;

create policy "productos_lectura_publica" ON public.products for select TO anon, authenticated
USING (true);

drop policy IF EXISTS "settings_lectura_publica" ON public.settings;

create policy "settings_lectura_publica" ON public.settings for select TO anon, authenticated
USING (true);

-- Escritura solo con sesión iniciada (el dueño/admin)
drop policy IF EXISTS "categorias_admin_todo" ON public.categories;

create policy "categorias_admin_todo" ON public.categories for all TO authenticated
USING (true) WITH check (true);

drop policy IF EXISTS "productos_admin_todo" ON public.products;

create policy "productos_admin_todo" ON public.products for all TO authenticated
USING (true) WITH check (true);

drop policy IF EXISTS "settings_admin_todo" ON public.settings;

create policy "settings_admin_todo" ON public.settings for all TO authenticated
USING (true) WITH check (true);

-- Pedidos: el público solo crea; el admin lee y actualiza estados
drop policy IF EXISTS "pedidos_insert_publico" ON public.orders;

create policy "pedidos_insert_publico" ON public.orders for insert TO anon, authenticated WITH check (true);

drop policy IF EXISTS "pedidos_select_admin" ON public.orders;

create policy "pedidos_select_admin" ON public.orders for select TO authenticated
USING (true);

drop policy IF EXISTS "pedidos_update_admin" ON public.orders;

create policy "pedidos_update_admin" ON public.orders for update TO authenticated
USING (true) WITH check (true);

-- ── Storage: imágenes de productos ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

drop policy IF EXISTS "imagenes_lectura_publica" ON storage.objects;

create policy "imagenes_lectura_publica" ON storage.objects for select TO anon, authenticated
USING (bucket_id = 'product-images');

drop policy IF EXISTS "imagenes_admin_insert" ON storage.objects;

create policy "imagenes_admin_insert" ON storage.objects for insert TO authenticated WITH check (bucket_id = 'product-images');

drop policy IF EXISTS "imagenes_admin_update" ON storage.objects;

create policy "imagenes_admin_update" ON storage.objects for update TO authenticated
USING (bucket_id = 'product-images');

drop policy IF EXISTS "imagenes_admin_delete" ON storage.objects;

create policy "imagenes_admin_delete" ON storage.objects for delete TO authenticated
USING (bucket_id = 'product-images');

-- ── Migraciones ligeras (por si ya ejecutaste una versión anterior) ─────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS observaciones text NOT NULL DEFAULT '';

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tipo_entrega text NOT NULL DEFAULT 'domicilio';

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS offers_delivery boolean NOT NULL DEFAULT true;

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS offers_pickup boolean NOT NULL DEFAULT true;

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS force_closed boolean NOT NULL DEFAULT false;

ALTER TABLE public.settings DROP COLUMN IF EXISTS bank_name;

ALTER TABLE public.settings DROP COLUMN IF EXISTS account_number;

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS bank_accounts jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── RPC segura: crear pedido y devolver su nº ───────────────────────────────
-- Evita dar SELECT de orders a anon (protege teléfonos/direcciones de otros
-- clientes): la función corre con privilegios del dueño y SOLO devuelve el nº.
CREATE OR REPLACE FUNCTION public.crear_pedido( p_nombre text, p_telefono text, p_direccion text, p_unidad text, p_apto text, p_observaciones text, p_pago text, p_subtotal int, p_delivery_fee int, p_total int, p_items jsonb, p_tipo_entrega text DEFAULT 'domicilio' )
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER set search_path = public
AS $$
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

GRANT execute ON function public.crear_pedido(text, text, text, text, text, text, text, int, int, int, jsonb, text) TO anon, authenticated;

-- ── Diseño del Menú / Catálogo (fila única id=1) ───────────────────────────
create table if not exists public.catalog_design (
  id                    int primary key default 1 check (id = 1),
  app_bg                text not null default '#fdfbf7',
  font_family           text not null default 'Montserrat',

  -- Hero
  hero_bg               text not null default 'linear-gradient(180deg, #fdf1f1 0%, #fecdcd 100%)',
  hero_header_bg        text not null default 'rgba(255, 255, 255, 0.72)',
  hero_cta_bg           text not null default '#d92b38',
  hero_cta_text         text not null default '#ffffff',
  hero_badge_bg         text not null default 'rgba(255, 255, 255, 0.92)',
  hero_badge_text       text not null default '#d92b38',
  hero_float_cart_bg    text not null default '#3d2314',
  hero_float_cart_text  text not null default '#ffffff',

  -- Promociones
  show_promotions       boolean not null default true,
  promotions_title      text not null default 'Promociones & Especiales',
  promotions_subtitle   text not null default 'Aprovecha nuestras ofertas por tiempo limitado en tus postres favoritos',
  promotions_bg         text not null default '#fff5f5',
  promotions_card_bg    text not null default '#ffffff',
  promotions_accent     text not null default '#d92b38',
  promotions_items      jsonb not null default '[]'::jsonb,

  -- Combos
  show_combos           boolean not null default true,
  combos_title          text not null default 'Combos & Packs para Compartir',
  combos_subtitle       text not null default 'Las combinaciones perfectas al mejor precio para tus momentos dulces',
  combos_bg             text not null default '#fbf8f3',
  combos_card_bg        text not null default '#ffffff',
  combos_accent         text not null default '#d92b38',
  combos_items          jsonb not null default '[]'::jsonb,

  -- Menú
  bg_color              text not null default '#fecdcd',
  card_bg               text not null default '#fdfbf7',
  header_badge_bg       text not null default 'rgba(255, 255, 255, 0.75)',
  header_badge_text     text not null default '#b4232e',
  text_primary          text not null default '#3d2314',
  text_muted            text not null default '#7a6353',
  border_color          text not null default 'rgba(61, 35, 20, 0.08)',
  card_radius           text not null default '20px',
  card_shadow           text not null default 'md',
  btn_primary_bg        text not null default '#d92b38',
  btn_primary_text      text not null default '#ffffff',
  btn_details_bg        text not null default 'transparent',
  btn_details_text      text not null default '#3d2314',
  btn_details_border    text not null default 'rgba(61, 35, 20, 0.12)',
  price_tag_bg          text not null default '#3d2314',
  price_tag_text        text not null default '#ffffff',
  badge_popular_bg      text not null default '#d92b38',
  badge_popular_text    text not null default '#ffffff',
  category_bar_bg       text not null default 'rgba(255, 255, 255, 0.7)',
  category_active_bg    text not null default '#d92b38',
  category_active_text  text not null default '#ffffff',
  category_inactive_bg  text not null default 'transparent',
  category_inactive_text text not null default '#7a6353',
  columns_desktop       text not null default 'auto',
  columns_mobile        text not null default '1',
  card_layout           text not null default 'vertical',
  image_aspect_ratio    text not null default '4/3',

  -- Footer
  footer_bg             text not null default 'linear-gradient(180deg, #1a0f08 0%, #0d0705 100%)',
  footer_text           text not null default 'rgba(255, 255, 255, 0.7)',
  footer_accent         text not null default '#d92b38',

  updated_at            timestamptz not null default now()
);

insert into public.catalog_design (id) values (1) on conflict (id) do nothing;

alter table public.catalog_design enable row level security;

drop trigger if exists catalog_design_updated_at on public.catalog_design;
create trigger catalog_design_updated_at before update on public.catalog_design
for each row execute function public.set_updated_at();

drop policy if exists "catalog_design_lectura_publica" on public.catalog_design;
create policy "catalog_design_lectura_publica" on public.catalog_design
  for select to anon, authenticated using (true);

drop policy if exists "catalog_design_admin_todo" on public.catalog_design;
create policy "catalog_design_admin_todo" on public.catalog_design
  for all to authenticated using (true) with check (true);

grant select on public.catalog_design to anon, authenticated;
grant all on public.catalog_design to authenticated;

-- ── Realtime: publicar tablas para postgres_changes ────────────────────────
-- Sin esto, las suscripciones en tiempo real no reciben eventos.
DO $$ begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null; end $$;

DO $$ begin
  alter publication supabase_realtime add table public.categories;
exception when duplicate_object then null; end $$;

DO $$ begin
  alter publication supabase_realtime add table public.settings;
exception when duplicate_object then null; end $$;

DO $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.catalog_design;
exception when duplicate_object then null; end $$;

-- ── Clientes (sincronizados por número de WhatsApp) ────────────────────────
create table if not exists public.clientes (
  id                       uuid primary key default gen_random_uuid(),
  telefono                 text not null unique,           -- WhatsApp / Teléfono único por cliente
  nombre                   text not null,                  -- Nombre del cliente
  pedidos_count            int not null default 0,         -- Cantidad de pedidos concretados
  cant_pedidos_concretados int not null default 0,         -- Alias para compatibilidad
  fecha_cumple             date default null,              -- Fecha de cumpleaños (opcional)
  notas                    text default '',                -- Observaciones / notas
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists clientes_telefono_idx on public.clientes (telefono);

drop trigger if exists clientes_updated_at on public.clientes;
create trigger clientes_updated_at before update on public.clientes
for each row execute function public.set_updated_at();

alter table public.clientes enable row level security;

drop policy if exists "clientes_lectura_publica" on public.clientes;
create policy "clientes_lectura_publica" on public.clientes for select to anon, authenticated using (true);

drop policy if exists "clientes_insercion_publica" on public.clientes;
create policy "clientes_insercion_publica" on public.clientes for insert to anon, authenticated with check (true);

drop policy if exists "clientes_actualizacion_publica" on public.clientes;
create policy "clientes_actualizacion_publica" on public.clientes for update to anon, authenticated using (true) with check (true);

grant select, insert, update on public.clientes to anon, authenticated;

do $$ begin
  alter publication supabase_realtime add table public.clientes;
exception when duplicate_object then null; end $$;

create or replace function public.registrar_cliente_si_no_existe(
  p_telefono text,
  p_nombre text default '',
  p_fecha_cumple date default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_clean_phone text;
  v_cliente public.clientes%rowtype;
begin
  v_clean_phone := regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  if v_clean_phone = '' then
    return null;
  end if;

  -- 1. Validar si ya existe
  select * into v_cliente from public.clientes where telefono = v_clean_phone limit 1;

  if found then
    -- Si existe y se proporciona fecha_cumple cuando antes estaba nula, actualizarla opcionalmente
    if v_cliente.fecha_cumple is null and p_fecha_cumple is not null then
      update public.clientes
      set fecha_cumple = p_fecha_cumple,
          updated_at = now()
      where id = v_cliente.id
      returning * into v_cliente;
    end if;
    return to_jsonb(v_cliente);
  else
    -- 2. Si no existe en 'clientes', verificar si tiene nombre previo en 'orders'
    if p_nombre is null or trim(p_nombre) = '' then
      select nombre into p_nombre from public.orders
      where regexp_replace(telefono, '\D', '', 'g') = v_clean_phone
      limit 1;
    end if;

    -- 3. Crear nuevo registro de cliente
    insert into public.clientes (
      telefono,
      nombre,
      fecha_cumple,
      pedidos_count,
      cant_pedidos_concretados
    )
    values (
      v_clean_phone,
      coalesce(nullif(trim(p_nombre), ''), 'Cliente'),
      p_fecha_cumple,
      0,
      0
    )
    returning * into v_cliente;

    return to_jsonb(v_cliente);
  end if;
end $$;

grant execute on function public.registrar_cliente_si_no_existe(text, text, date) to anon, authenticated;


-- //////////**********************//////////////////
-- 1. Tabla para Calificaciones del Negocio
CREATE TABLE store_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telefono TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla para Bases de "Arma tu Pavé"
CREATE TABLE bases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio NUMERIC DEFAULT 0,
    disponible BOOLEAN DEFAULT true,
    orden INT DEFAULT 0
);

-- 3. Tabla para Tamaños de "Arma tu Pavé"
CREATE TABLE sizes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio NUMERIC DEFAULT 0,
    disponible BOOLEAN DEFAULT true,
    orden INT DEFAULT 0
);

-- Permitir lectura pública de bases y tamaños
ALTER TABLE bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bases public read" ON bases FOR SELECT USING (true);

ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sizes public read" ON sizes FOR SELECT USING (true);

-- Permitir crear y leer calificaciones
ALTER TABLE store_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings public insert" ON store_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Ratings public read" ON store_ratings FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  telefono text,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);



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
CREATE TABLE IF NOT EXISTS public.settings (
  id int PRIMARY KEY DEFAULT 1 check (id = 1),
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  razon_social text NOT NULL DEFAULT '',
  maps_url text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  facebook text NOT NULL DEFAULT '',
  tiktok text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  day1 text NOT NULL DEFAULT '',
  hours1 text NOT NULL DEFAULT '',
  delivery_fee int NOT NULL DEFAULT 3500,
  free_delivery_threshold int NOT NULL DEFAULT 45000,
  offers_delivery boolean NOT NULL DEFAULT true,
  -- 🛵 domicilio
 offers_pickup boolean NOT NULL DEFAULT true,
  -- 🏪 recogida en tienda
 offersLocal boolean NOT NULL DEFAULT true,
  -- 🍽️ local
 force_closed boolean NOT NULL DEFAULT false,
  -- cierre de emergencia
 bank_accounts jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- lista de cuentas bancarias
 updated_at timestamptz NOT NULL DEFAULT now()
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
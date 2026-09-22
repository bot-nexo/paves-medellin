-- ============================================================================
-- Pavés Medellín — Script SQL para la tabla 'clientes' en Supabase
-- Instrucciones: Copiar y ejecutar en Supabase → SQL Editor
-- ============================================================================

-- 1. Crear tabla 'clientes' con clave única por número de WhatsApp
create table if not exists public.clientes (
  id                       uuid primary key default gen_random_uuid(),
  telefono                 text not null unique,           -- WhatsApp / Teléfono único por cliente
  nombre                   text not null,                  -- Nombre del cliente
  pedidos_count            int not null default 0,         -- Cantidad de pedidos concretados
  cant_pedidos_concretados int not null default 0,         -- Campo de soporte de compras
  fecha_cumple             date default null,              -- Fecha de cumpleaños (opcional)
  notas                    text default '',                -- Observaciones / notas
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- 2. Índice optimizado para búsquedas por WhatsApp
create index if not exists clientes_telefono_idx on public.clientes (telefono);

-- 3. Trigger para refrescar automáticamente el campo updated_at
drop trigger if exists clientes_updated_at on public.clientes;
create trigger clientes_updated_at 
before update on public.clientes
for each row execute function public.set_updated_at();

-- 4. Configuración de Row Level Security (RLS)
alter table public.clientes enable row level security;

-- Políticas de lectura, inserción y actualización para anónimos y autenticados
drop policy if exists "Permitir lectura de clientes" on public.clientes;
create policy "Permitir lectura de clientes"
  on public.clientes for select
  to anon, authenticated
  using (true);

drop policy if exists "Permitir insercion de clientes" on public.clientes;
create policy "Permitir insercion de clientes"
  on public.clientes for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Permitir actualizacion de clientes" on public.clientes;
create policy "Permitir actualizacion de clientes"
  on public.clientes for update
  to anon, authenticated
  using (true)
  with check (true);

-- 5. Agregar la tabla a la publicación de tiempo real de Supabase
alter publication supabase_realtime add table public.clientes;

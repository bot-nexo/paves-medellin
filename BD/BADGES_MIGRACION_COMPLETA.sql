-- ============================================================
-- MIGRACION COMPLETA: Sistema de Fidelizacion / Insignias
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Descuento porcentual y envio gratis por insignia
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS free_delivery boolean DEFAULT false;

-- 2. Activar / desactivar insignia individualmente
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 3. Regla 2x1 y dias en que aplican los beneficios
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS has_2x1 boolean DEFAULT false;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS apply_days jsonb DEFAULT '[]'::jsonb;

-- Recargar el schema cache de Supabase (equivalente al boton en el panel)
NOTIFY pgrst, 'reload schema';

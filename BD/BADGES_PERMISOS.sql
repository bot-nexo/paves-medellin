-- ============================================================
-- PERMISOS TABLA BADGES
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Dar permisos al rol anon (el que usa la app sin login)
GRANT ALL ON TABLE public.badges TO anon;
GRANT ALL ON TABLE public.badges TO authenticated;

-- 2. Habilitar RLS (si no esta) y crear politicas permisivas
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Eliminar politicas anteriores si las hay (para no duplicar)
DROP POLICY IF EXISTS "badges_select" ON public.badges;
DROP POLICY IF EXISTS "badges_insert" ON public.badges;
DROP POLICY IF EXISTS "badges_update" ON public.badges;
DROP POLICY IF EXISTS "badges_delete" ON public.badges;
DROP POLICY IF EXISTS "badges_all" ON public.badges;

-- Crear una sola politica: acceso total (la seguridad la maneja el frontend con el service role)
CREATE POLICY "badges_all"
  ON public.badges
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Recargar schema cache
NOTIFY pgrst, 'reload schema';

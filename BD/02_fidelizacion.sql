-- 1. Agregar columna plan_fidelizacion a la tabla settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS plan_fidelizacion boolean DEFAULT true;

-- 2. Crear tabla de insignias (badges)
CREATE TABLE IF NOT EXISTS public.badges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    beneficio text,
    required_orders integer NOT NULL DEFAULT 0,
    color text DEFAULT '#ffcc00',
    glow text DEFAULT 'rgba(255, 204, 0, 0.5)',
    image text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) y crear políticas
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_read_all" ON public.badges
    FOR SELECT USING (true);

CREATE POLICY "badges_all_admin" ON public.badges
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. (Opcional) Insertar insignias por defecto si está vacía
INSERT INTO public.badges (name, description, beneficio, required_orders, color, glow)
SELECT 'Bronce', 'Cliente Nuevo', 'Sin beneficio especial aún', 0, '#d97746', 'rgba(205, 127, 50, 0.4)'
WHERE NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Bronce');

INSERT INTO public.badges (name, description, beneficio, required_orders, color, glow)
SELECT 'Plata', 'Cliente Frecuente', '5% de descuento', 3, '#e0e0e0', 'rgba(224, 224, 224, 0.4)'
WHERE NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Plata');

INSERT INTO public.badges (name, description, beneficio, required_orders, color, glow)
SELECT 'Oro', 'Cliente Muy Frecuente', '10% de descuento', 9, '#ffdf00', 'rgba(255, 223, 0, 0.5)'
WHERE NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Oro');

INSERT INTO public.badges (name, description, beneficio, required_orders, color, glow)
SELECT 'Platino', 'Cliente VIP', 'Envío gratis en todos los pedidos', 16, '#e5e4e2', 'rgba(255, 255, 255, 0.6)'
WHERE NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Platino');

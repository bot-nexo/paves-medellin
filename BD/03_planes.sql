ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS plan_configuracion boolean DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS plan_domicilio_dinamico boolean DEFAULT true;

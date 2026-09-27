ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

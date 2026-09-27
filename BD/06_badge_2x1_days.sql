ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS has_2x1 boolean DEFAULT false;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS apply_days jsonb DEFAULT '[]'::jsonb;

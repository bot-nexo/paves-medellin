ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS free_delivery boolean DEFAULT false;

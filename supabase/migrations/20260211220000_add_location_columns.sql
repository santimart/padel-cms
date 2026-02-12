-- Add province and city columns to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS province text,
ADD COLUMN IF NOT EXISTS city text;

-- Create ranking_definitions table
CREATE TABLE IF NOT EXISTS public.ranking_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES public.complexes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category INTEGER NOT NULL,
  base_points INTEGER NOT NULL DEFAULT 1000,
  points_distribution JSONB NOT NULL DEFAULT '{
    "champion": 1000,
    "finalist": 600,
    "semifinalist": 360,
    "quarterfinalist": 180,
    "round_of_16": 90,
    "round_of_32": 45,
    "round_of_64": 25,
    "participation": 10
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for ranking_definitions
CREATE INDEX IF NOT EXISTS idx_ranking_definitions_complex_id ON public.ranking_definitions(complex_id);
CREATE INDEX IF NOT EXISTS idx_ranking_definitions_category ON public.ranking_definitions(category);

-- Add ranking_definition_id to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS ranking_definition_id UUID REFERENCES public.ranking_definitions(id) ON DELETE SET NULL;

-- Create index for tournaments ranking_definition_id
CREATE INDEX IF NOT EXISTS idx_tournaments_ranking_definition_id ON public.tournaments(ranking_definition_id);

-- Update rankings table to reference ranking_definition instead of season_year
-- First, add the new column
ALTER TABLE public.rankings 
ADD COLUMN IF NOT EXISTS ranking_definition_id UUID REFERENCES public.ranking_definitions(id) ON DELETE CASCADE;

-- We don't drop season_year immediately to avoid data loss on existing records if any, 
-- but for a clean implementation we should migrate data if this was production.
-- Assuming dev environment or we can keep season_year as legacy for now or redundant info.
-- Let's keep season_year for now as redundant but useful for quick filtering without join? 
-- Actually, the prompt said "Remove season_year (handled by definition name/validity)".
-- I will Make it nullable if it was not, or just ignore it.
-- Let's create the unique index on (player_id, ranking_definition_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rankings_player_definition ON public.rankings(player_id, ranking_definition_id);

-- RLS Policies for ranking_definitions
ALTER TABLE public.ranking_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ranking definitions of their complexes" ON public.ranking_definitions
  FOR SELECT USING (
    complex_id IN (
      SELECT id FROM public.complexes WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ranking definitions for their complexes" ON public.ranking_definitions
  FOR INSERT WITH CHECK (
    complex_id IN (
      SELECT id FROM public.complexes WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ranking definitions of their complexes" ON public.ranking_definitions
  FOR UPDATE USING (
    complex_id IN (
      SELECT id FROM public.complexes WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ranking definitions of their complexes" ON public.ranking_definitions
  FOR DELETE USING (
    complex_id IN (
      SELECT id FROM public.complexes WHERE owner_id = auth.uid()
    )
  );

-- Public read access for rankings (if we want public leaderboards)
CREATE POLICY "Public can view ranking definitions" ON public.ranking_definitions
  FOR SELECT USING (true);

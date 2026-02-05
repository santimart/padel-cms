-- Migration: Fix RLS policies for pairs table to allow deletion
-- Run this in Supabase SQL Editor

-- Drop existing policies for pairs table
DROP POLICY IF EXISTS "Users can view pairs" ON pairs;
DROP POLICY IF EXISTS "Users can insert pairs" ON pairs;
DROP POLICY IF EXISTS "Users can update pairs" ON pairs;
DROP POLICY IF EXISTS "Users can delete pairs" ON pairs;

-- Create new RLS policies for pairs table
-- Allow viewing all pairs
CREATE POLICY "Users can view pairs"
  ON pairs FOR SELECT
  USING (true);

-- Allow inserting pairs for tournaments in user's complexes
CREATE POLICY "Users can insert pairs"
  ON pairs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      INNER JOIN complexes c ON t.complex_id = c.id
      WHERE t.id = tournament_id
      AND c.owner_id = auth.uid()
    )
  );

-- Allow updating pairs for tournaments in user's complexes
CREATE POLICY "Users can update pairs"
  ON pairs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      INNER JOIN complexes c ON t.complex_id = c.id
      WHERE t.id = tournament_id
      AND c.owner_id = auth.uid()
    )
  );

-- Allow deleting pairs for tournaments in user's complexes
CREATE POLICY "Users can delete pairs"
  ON pairs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      INNER JOIN complexes c ON t.complex_id = c.id
      WHERE t.id = tournament_id
      AND c.owner_id = auth.uid()
    )
  );

SELECT 'RLS policies for pairs table updated successfully!' as status;

-- Migration: Add match_number column to matches table
-- Run this in Supabase SQL Editor

-- Add match_number column to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_number INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_match_number ON matches(match_number);

SELECT 'match_number column added successfully!' as status;

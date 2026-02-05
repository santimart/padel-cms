-- Migration: Add scheduling fields to tournaments table
-- Run this in Supabase SQL Editor

-- Add scheduling configuration fields
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS daily_start_time TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS daily_end_time TIME DEFAULT '21:00',
ADD COLUMN IF NOT EXISTS match_duration_minutes INTEGER DEFAULT 60;

-- Add comment for documentation
COMMENT ON COLUMN tournaments.daily_start_time IS 'Daily tournament start time (e.g., 09:00)';
COMMENT ON COLUMN tournaments.daily_end_time IS 'Daily tournament end time (e.g., 21:00)';
COMMENT ON COLUMN tournaments.match_duration_minutes IS 'Estimated duration per match in minutes (default 60)';

SELECT 'Scheduling fields added to tournaments table!' as status;

-- Add available courts field to tournaments table
ALTER TABLE tournaments ADD COLUMN available_courts INTEGER DEFAULT 1;

-- Update existing tournaments to have at least 1 court
UPDATE tournaments SET available_courts = 1 WHERE available_courts IS NULL;

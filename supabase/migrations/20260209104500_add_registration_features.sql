-- Add registration_price to tournaments table
ALTER TABLE tournaments ADD COLUMN registration_price NUMERIC DEFAULT 0;

-- Add payment status flags to pairs table
ALTER TABLE pairs ADD COLUMN player1_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE pairs ADD COLUMN player2_paid BOOLEAN DEFAULT FALSE;

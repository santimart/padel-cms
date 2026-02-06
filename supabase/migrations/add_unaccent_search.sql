-- Enable the unaccent extension for accent-insensitive searches
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create a function for accent-insensitive search on players
-- This function can be used in queries to search players by name or DNI
CREATE OR REPLACE FUNCTION search_players_unaccent(search_term TEXT)
RETURNS TABLE (
  id UUID,
  dni TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  current_category INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.dni,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.current_category,
    p.created_at,
    p.updated_at
  FROM players p
  WHERE 
    unaccent(lower(p.first_name)) LIKE unaccent(lower('%' || search_term || '%'))
    OR unaccent(lower(p.last_name)) LIKE unaccent(lower('%' || search_term || '%'))
    OR lower(p.dni) LIKE lower('%' || search_term || '%')
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

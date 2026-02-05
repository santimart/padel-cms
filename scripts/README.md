# Tournament Scripts

Utility scripts for managing tournaments.

## Add Pairs to Tournament

Adds 12 random pairs to a tournament from available players.

### Node.js Script (Recommended)

```bash
# Make sure you have the environment variables set
node scripts/add-pairs.js <tournament-id>
```

**Example:**
```bash
node scripts/add-pairs.js 33c6be12-c45c-4eda-aac7-2ad542846588
```

**Requirements:**
- Players must exist in the same complex as the tournament
- Players must match the tournament gender (or any gender for "Mixto")
- Players must have category within ±1 of tournament category
- At least 24 players must be available

### SQL Script (Alternative)

If you prefer to run directly in Supabase SQL Editor:

1. Open `supabase/add-pairs-to-tournament.sql`
2. Replace `'YOUR_TOURNAMENT_ID_HERE'` with your tournament ID (in 2 places)
3. Run the script in Supabase SQL Editor

## Output

The script will:
1. ✅ Verify tournament exists
2. ✅ Find eligible players (24 needed)
3. ✅ Create 12 random pairs
4. ✅ Display the created pairs with player names and categories

After running, you can generate zones for the tournament in the UI.

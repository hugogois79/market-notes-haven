-- Update existing snapshot with correct values including Cash accounts
UPDATE portfolio_snapshots
SET 
  total_value = 9571079.23,
  total_pl = 0,
  asset_count = 6,
  allocation_by_category = '{"Marine": 3850000, "Vehicles": 400000, "Watches": 38500, "Cash": 5282579.23}'::jsonb
WHERE user_id = '31377412-f0d4-4fdf-bf6b-7ca78d6caedf' AND snapshot_date = '2026-01-06';
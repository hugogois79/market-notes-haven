-- Add GPS coordinates to fleet_contacts
ALTER TABLE public.fleet_contacts
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);

-- Update coordinates for all 11 contacts
UPDATE public.fleet_contacts SET latitude = 41.2379, longitude = -8.6188
  WHERE nome = 'Hugo Góis - Correio';

UPDATE public.fleet_contacts SET latitude = 41.1483, longitude = -8.6053
  WHERE nome = 'Epicatmosphere - Correio';

UPDATE public.fleet_contacts SET latitude = 41.1593, longitude = -8.6345
  WHERE nome = 'Escritório Porto';

UPDATE public.fleet_contacts SET latitude = 41.1579, longitude = -8.6291
  WHERE nome = 'Casa - Marechal 1385';

UPDATE public.fleet_contacts SET latitude = 38.7267, longitude = -9.1387
  WHERE nome = 'Casa Lisboa';

UPDATE public.fleet_contacts SET latitude = 41.2370, longitude = -8.6700
  WHERE nome LIKE '%Aeroporto%OPO%';

UPDATE public.fleet_contacts SET latitude = 41.2602, longitude = -8.6196
  WHERE nome LIKE '%Vilar de Luz%';

UPDATE public.fleet_contacts SET latitude = 41.1563, longitude = -8.6459
  WHERE nome = 'Centro Porsche Porto';

UPDATE public.fleet_contacts SET latitude = 41.1558, longitude = -8.6468
  WHERE nome LIKE '%BENTLEY%';

UPDATE public.fleet_contacts SET latitude = 41.1631, longitude = -8.6098
  WHERE nome LIKE '%Paranhos%';

UPDATE public.fleet_contacts SET latitude = 41.0564, longitude = -8.5587
  WHERE nome LIKE '%INFTEL%';

-- Generate Google Maps URLs
UPDATE public.fleet_contacts
  SET google_maps_url = 'https://www.google.com/maps?q=' || latitude || ',' || longitude
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

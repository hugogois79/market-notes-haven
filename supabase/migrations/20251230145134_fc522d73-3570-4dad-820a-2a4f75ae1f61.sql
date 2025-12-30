-- Update the Voos category to include the correct Vasco user ID
UPDATE calendar_categories 
SET shared_with_users = array_append(
  COALESCE(shared_with_users, ARRAY[]::uuid[]), 
  '6ee91a32-8dfa-47dd-8dff-6cc0bbf232c9'::uuid
)
WHERE name = 'Voos' 
  AND NOT ('6ee91a32-8dfa-47dd-8dff-6cc0bbf232c9'::uuid = ANY(COALESCE(shared_with_users, ARRAY[]::uuid[])));
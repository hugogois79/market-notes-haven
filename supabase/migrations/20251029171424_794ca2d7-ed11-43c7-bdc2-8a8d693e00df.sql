-- Update Epic Atmosphere company with logo URL pointing to public storage
UPDATE receipt_companies
SET logo_url = '/company-logos/epicatmosphere-logo.png'
WHERE name ILIKE '%epic%atmosphere%';

-- Also update Sustainable Yield if it exists
UPDATE receipt_companies
SET logo_url = '/company-logos/sustainable-yield-logo.png'
WHERE name ILIKE '%sustainable%yield%';
-- Update receipt_companies table to have all necessary fields for Epic Atmosphere
ALTER TABLE receipt_companies 
  DROP COLUMN IF EXISTS postal_code,
  DROP COLUMN IF EXISTS city,
  ADD COLUMN IF NOT EXISTS nipc TEXT,
  ADD COLUMN IF NOT EXISTS capital_social TEXT,
  ADD COLUMN IF NOT EXISTS bank_account TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Insert Epic Atmosphere data
INSERT INTO receipt_companies (
  name,
  nipc,
  capital_social,
  address,
  country,
  email,
  bank_account,
  bank_name,
  logo_url,
  is_default,
  user_id
) VALUES (
  'EPIC ATMOSPHERE UNIPESSOAL LDA',
  '517 468 042',
  '€5.000,00',
  'Rua Pinto Bessa 522, r/c CE, Bonfim, 4300-428 Porto',
  'Portugal',
  'info@epicatmosphere.com',
  'PT50 0007 0000 0064 6564 4622 3',
  'Novo Banco, S.A.',
  NULL,
  false,
  NULL
)
ON CONFLICT DO NOTHING;

-- Insert Sustainable Yield Capital data  
INSERT INTO receipt_companies (
  name,
  company_number,
  address,
  country,
  email,
  logo_url,
  is_default,
  user_id
) VALUES (
  'SUSTAINABLE YIELD CAPITAL LTD',
  '15769755',
  'Dept 302, 43 Owston Road Carcroft, Doncaster, DN6 8DA',
  'United Kingdom',
  NULL,
  NULL,
  false,
  NULL
)
ON CONFLICT DO NOTHING;
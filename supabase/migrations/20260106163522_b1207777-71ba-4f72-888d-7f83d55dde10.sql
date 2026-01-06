-- Insert holdings for Areg Investment Lda
INSERT INTO public.market_holdings (user_id, asset_id, name, ticker, current_value, notes)
VALUES 
  ('6ee91a32-8dfa-47dd-8dff-6cc0bbf232c9', 'ac0cf25a-24a9-4ec1-af76-36f745774061', 'EUR Conta Corrente', 'EUR', 852.17, 'Conta corrente em Euros'),
  ('6ee91a32-8dfa-47dd-8dff-6cc0bbf232c9', 'ac0cf25a-24a9-4ec1-af76-36f745774061', 'USD Conta Corrente', 'USD', 31345.87, 'Conta corrente em Dólares'),
  ('6ee91a32-8dfa-47dd-8dff-6cc0bbf232c9', 'ac0cf25a-24a9-4ec1-af76-36f745774061', 'Money Market Call', 'USD/MM', 3030000.00, 'Investimento Money Market em USD');

-- Insert holdings for Swissintegral
INSERT INTO public.market_holdings (user_id, asset_id, name, ticker, current_value, notes)
VALUES 
  ('6ee91a32-8dfa-47dd-8dff-6cc0bbf232c9', '8532a431-471b-4f44-bc21-f1872368b121', 'EUR Conta Corrente', 'EUR', -3534.70, 'Conta corrente em Euros (saldo negativo - descoberto)'),
  ('6ee91a32-8dfa-47dd-8dff-6cc0bbf232c9', '8532a431-471b-4f44-bc21-f1872368b121', 'USD Conta Corrente', 'USD', 29506.83, 'Conta corrente em Dólares'),
  ('6ee91a32-8dfa-47dd-8dff-6cc0bbf232c9', '8532a431-471b-4f44-bc21-f1872368b121', 'Money Market Call', 'USD/MM', 2990000.00, 'Investimento Money Market em USD');

-- Insert holdings for Safe Global (Crypto)
INSERT INTO public.market_holdings (user_id, asset_id, name, ticker, current_value, quantity, notes)
VALUES 
  ('6ee91a32-8dfa-47dd-8dff-6cc0bbf232c9', '22b29f8f-a3e3-4f64-be68-dde79745cc5d', 'USDT Stablecoin', 'USDT', 100000.00, 100000, 'Tether - Dólar Digital');
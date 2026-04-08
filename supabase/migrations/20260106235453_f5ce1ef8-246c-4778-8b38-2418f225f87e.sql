-- Adicionar colunas de variação de preço
ALTER TABLE securities
ADD COLUMN change_1d numeric,
ADD COLUMN change_1w numeric,
ADD COLUMN change_ytd numeric;

COMMENT ON COLUMN securities.change_1d IS 'Variação % últimas 24h';
COMMENT ON COLUMN securities.change_1w IS 'Variação % últimos 7 dias';
COMMENT ON COLUMN securities.change_ytd IS 'Variação % desde início do ano';
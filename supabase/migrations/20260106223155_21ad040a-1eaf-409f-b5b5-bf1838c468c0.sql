-- Renomear latest_trading_day para date
ALTER TABLE stock_prices RENAME COLUMN latest_trading_day TO date;

-- Atualizar registos NULL com data atual
UPDATE stock_prices SET date = CURRENT_DATE WHERE date IS NULL;

-- Tornar date NOT NULL
ALTER TABLE stock_prices ALTER COLUMN date SET NOT NULL;

-- Remover duplicados mantendo o registo mais recente (maior id)
DELETE FROM stock_prices a USING stock_prices b
WHERE a.id < b.id AND a.symbol = b.symbol AND a.date = b.date;

-- Adicionar constraint UNIQUE(symbol, date)
ALTER TABLE stock_prices ADD CONSTRAINT stock_prices_symbol_date_unique UNIQUE (symbol, date);
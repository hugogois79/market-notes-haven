-- Add 'notification' to the transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'notification';
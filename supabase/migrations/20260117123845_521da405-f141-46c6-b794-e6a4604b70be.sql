-- =============================================
-- TELEGRAM BOT SUPPORT - DATABASE MIGRATIONS
-- =============================================

-- 1. ALTER expense_users - Add Telegram fields
ALTER TABLE expense_users 
ADD COLUMN telegram_user_id BIGINT UNIQUE,
ADD COLUMN telegram_username TEXT;

CREATE INDEX idx_expense_users_telegram_id 
ON expense_users(telegram_user_id) 
WHERE telegram_user_id IS NOT NULL;

-- 2. CREATE telegram_sessions - Active sessions
CREATE TABLE telegram_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT NOT NULL,
    expense_user_id UUID NOT NULL REFERENCES expense_users(id) ON DELETE CASCADE,
    authenticated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telegram_sessions_active 
ON telegram_sessions(telegram_user_id, is_active, expires_at) 
WHERE is_active = TRUE;

ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage telegram sessions"
ON telegram_sessions FOR ALL
USING (true)
WITH CHECK (true);

-- 3. CREATE telegram_pending_expenses - Temporary expenses before confirmation
CREATE TABLE telegram_pending_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT NOT NULL,
    expense_user_id UUID NOT NULL REFERENCES expense_users(id) ON DELETE CASCADE,
    expense_claim_id UUID REFERENCES expense_claims(id) ON DELETE CASCADE,
    
    -- Extracted data (editable)
    expense_date DATE,
    supplier TEXT,
    amount NUMERIC(10,2),
    description TEXT,
    category_id UUID REFERENCES expense_categories(id),
    project_id UUID REFERENCES expense_projects(id),
    
    -- File info
    file_url TEXT,
    file_type TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending_confirmation',
    
    -- Metadata
    raw_ocr_text TEXT,
    telegram_message_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telegram_pending_user 
ON telegram_pending_expenses(telegram_user_id, status) 
WHERE status = 'pending_confirmation';

ALTER TABLE telegram_pending_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage telegram pending expenses"
ON telegram_pending_expenses FOR ALL
USING (true)
WITH CHECK (true);

-- 4. CREATE telegram_conversation_state - Conversation state tracking
CREATE TABLE telegram_conversation_state (
    telegram_user_id BIGINT PRIMARY KEY,
    current_state TEXT NOT NULL DEFAULT 'idle',
    
    -- Temporary flow data
    selected_expense_user_id UUID REFERENCES expense_users(id),
    pending_expense_id UUID REFERENCES telegram_pending_expenses(id),
    editing_field TEXT,
    
    -- Metadata
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE telegram_conversation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage telegram conversation state"
ON telegram_conversation_state FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_telegram_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_telegram_pending_expenses_updated_at
    BEFORE UPDATE ON telegram_pending_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_updated_at();

CREATE TRIGGER update_telegram_conversation_state_updated_at
    BEFORE UPDATE ON telegram_conversation_state
    FOR EACH ROW
    EXECUTE FUNCTION update_telegram_updated_at();
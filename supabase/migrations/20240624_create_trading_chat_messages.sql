
-- Create the trading_chat_messages table to store chat history
CREATE TABLE IF NOT EXISTS trading_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_trading_chat_messages_note_id ON trading_chat_messages(note_id);

-- Enable Row Level Security
ALTER TABLE trading_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own trading chat messages"
  ON trading_chat_messages
  FOR SELECT
  USING (
    note_id IN (
      SELECT id FROM notes WHERE notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own trading chat messages"
  ON trading_chat_messages
  FOR INSERT
  WITH CHECK (
    note_id IN (
      SELECT id FROM notes WHERE notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own trading chat messages"
  ON trading_chat_messages
  FOR DELETE
  USING (
    note_id IN (
      SELECT id FROM notes WHERE notes.user_id = auth.uid()
    )
  );

-- Add new columns for tracking Technical Clarification phase
ALTER TABLE procurement_assignments 
ADD COLUMN IF NOT EXISTS clarification_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS clarification_question text,
ADD COLUMN IF NOT EXISTS proposal_received_at timestamptz;
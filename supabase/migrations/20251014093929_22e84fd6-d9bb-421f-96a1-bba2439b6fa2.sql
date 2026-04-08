-- Create storage bucket for kanban attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('kanban-attachments', 'kanban-attachments', true);

-- Create RLS policies for kanban attachments bucket
CREATE POLICY "Users can upload attachments to their cards"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kanban-attachments' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM kanban_cards
    JOIN kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_boards.user_id = auth.uid()
    AND (storage.foldername(name))[1] = kanban_cards.id::text
  )
);

CREATE POLICY "Users can view attachments from their cards"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kanban-attachments' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM kanban_cards
    JOIN kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_boards.user_id = auth.uid()
    AND (storage.foldername(name))[1] = kanban_cards.id::text
  )
);

CREATE POLICY "Users can delete attachments from their cards"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kanban-attachments' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM kanban_cards
    JOIN kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_boards.user_id = auth.uid()
    AND (storage.foldername(name))[1] = kanban_cards.id::text
  )
);
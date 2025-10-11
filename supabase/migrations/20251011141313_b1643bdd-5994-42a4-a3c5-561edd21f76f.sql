-- Tabela de quadros Kanban
CREATE TABLE public.kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#0a4a6b',
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de listas/colunas
CREATE TABLE public.kanban_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  board_id UUID REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de cartões
CREATE TABLE public.kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  list_id UUID REFERENCES public.kanban_lists(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de labels/etiquetas
CREATE TABLE public.kanban_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  board_id UUID REFERENCES public.kanban_boards(id) ON DELETE CASCADE
);

-- Relacionamento cartão-etiqueta
CREATE TABLE public.kanban_card_labels (
  card_id UUID REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
  label_id UUID REFERENCES public.kanban_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- Tabela de checklists
CREATE TABLE public.kanban_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  card_id UUID REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL
);

-- Items de checklist
CREATE TABLE public.kanban_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  checklist_id UUID REFERENCES public.kanban_checklists(id) ON DELETE CASCADE,
  position INTEGER NOT NULL
);

-- Comentários em cartões
CREATE TABLE public.kanban_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  card_id UUID REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Anexos
CREATE TABLE public.kanban_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  card_id UUID REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kanban_boards
CREATE POLICY "Users can view their own boards"
  ON public.kanban_boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create boards"
  ON public.kanban_boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards"
  ON public.kanban_boards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards"
  ON public.kanban_boards FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para kanban_lists
CREATE POLICY "Users can view lists from their boards"
  ON public.kanban_lists FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.kanban_boards
    WHERE kanban_boards.id = kanban_lists.board_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create lists in their boards"
  ON public.kanban_lists FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.kanban_boards
    WHERE kanban_boards.id = kanban_lists.board_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update lists in their boards"
  ON public.kanban_lists FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.kanban_boards
    WHERE kanban_boards.id = kanban_lists.board_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete lists in their boards"
  ON public.kanban_lists FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.kanban_boards
    WHERE kanban_boards.id = kanban_lists.board_id
    AND kanban_boards.user_id = auth.uid()
  ));

-- Políticas RLS para kanban_cards
CREATE POLICY "Users can view cards from their boards"
  ON public.kanban_cards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.kanban_lists
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_lists.id = kanban_cards.list_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create cards in their boards"
  ON public.kanban_cards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.kanban_lists
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_lists.id = kanban_cards.list_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update cards in their boards"
  ON public.kanban_cards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.kanban_lists
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_lists.id = kanban_cards.list_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete cards in their boards"
  ON public.kanban_cards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.kanban_lists
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_lists.id = kanban_cards.list_id
    AND kanban_boards.user_id = auth.uid()
  ));

-- Políticas RLS para kanban_labels
CREATE POLICY "Users can manage labels in their boards"
  ON public.kanban_labels FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.kanban_boards
    WHERE kanban_boards.id = kanban_labels.board_id
    AND kanban_boards.user_id = auth.uid()
  ));

-- Políticas RLS para kanban_card_labels
CREATE POLICY "Users can manage card labels"
  ON public.kanban_card_labels FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.kanban_cards
    JOIN public.kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_cards.id = kanban_card_labels.card_id
    AND kanban_boards.user_id = auth.uid()
  ));

-- Políticas RLS para kanban_checklists
CREATE POLICY "Users can manage checklists"
  ON public.kanban_checklists FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.kanban_cards
    JOIN public.kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_cards.id = kanban_checklists.card_id
    AND kanban_boards.user_id = auth.uid()
  ));

-- Políticas RLS para kanban_checklist_items
CREATE POLICY "Users can manage checklist items"
  ON public.kanban_checklist_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.kanban_checklists
    JOIN public.kanban_cards ON kanban_cards.id = kanban_checklists.card_id
    JOIN public.kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_checklists.id = kanban_checklist_items.checklist_id
    AND kanban_boards.user_id = auth.uid()
  ));

-- Políticas RLS para kanban_comments
CREATE POLICY "Users can view comments"
  ON public.kanban_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.kanban_cards
    JOIN public.kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_cards.id = kanban_comments.card_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create comments"
  ON public.kanban_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.kanban_cards
    JOIN public.kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_cards.id = kanban_comments.card_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own comments"
  ON public.kanban_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.kanban_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para kanban_attachments
CREATE POLICY "Users can manage attachments"
  ON public.kanban_attachments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.kanban_cards
    JOIN public.kanban_lists ON kanban_lists.id = kanban_cards.list_id
    JOIN public.kanban_boards ON kanban_boards.id = kanban_lists.board_id
    WHERE kanban_cards.id = kanban_attachments.card_id
    AND kanban_boards.user_id = auth.uid()
  ));

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_kanban_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kanban_boards_updated_at
  BEFORE UPDATE ON public.kanban_boards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kanban_updated_at();

CREATE TRIGGER update_kanban_cards_updated_at
  BEFORE UPDATE ON public.kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kanban_updated_at();

-- Função para reordenar cartões
CREATE OR REPLACE FUNCTION public.reorder_cards(
  card_id UUID,
  new_list_id UUID,
  new_position INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Atualizar o cartão
  UPDATE public.kanban_cards
  SET list_id = new_list_id, position = new_position
  WHERE id = card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
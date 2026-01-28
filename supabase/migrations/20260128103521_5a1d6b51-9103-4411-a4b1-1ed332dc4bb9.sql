-- =====================================================
-- KANBAN BOARDS SHARING: Add is_shared column and update RLS policies
-- =====================================================

-- 1) Add is_shared column to kanban_boards
ALTER TABLE public.kanban_boards 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false;

-- 2) Mark all existing boards as shared
UPDATE public.kanban_boards SET is_shared = true;

-- 3) Create index for performance
CREATE INDEX IF NOT EXISTS idx_kanban_boards_is_shared 
ON public.kanban_boards(is_shared) WHERE is_shared = true;

CREATE INDEX IF NOT EXISTS idx_kanban_boards_space_id 
ON public.kanban_boards(space_id) WHERE space_id IS NOT NULL;

-- =====================================================
-- Helper function: Check if user has projects permission
-- =====================================================
CREATE OR REPLACE FUNCTION public.user_has_projects_permission(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM expense_users
    WHERE user_id = _user_id
    AND (feature_permissions->>'projects')::boolean = true
  )
$$;

-- =====================================================
-- Helper function: Check if board is visible to user
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_view_board(_user_id uuid, _board_user_id uuid, _is_shared boolean)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    _user_id = _board_user_id  -- Owner
    OR public.has_role(_user_id, 'admin')  -- Admin
    OR (_is_shared = true AND public.user_has_projects_permission(_user_id))  -- Shared + Projects permission
  )
$$;

-- =====================================================
-- UPDATE KANBAN_BOARDS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view boards" ON public.kanban_boards;
DROP POLICY IF EXISTS "Users can view their boards or shared boards" ON public.kanban_boards;

CREATE POLICY "Users can view boards" 
ON public.kanban_boards FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
  OR (
    is_shared = true 
    AND public.user_has_projects_permission(auth.uid())
  )
);

-- =====================================================
-- UPDATE KANBAN_SPACES POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view spaces" ON public.kanban_spaces;
DROP POLICY IF EXISTS "Users can view their spaces" ON public.kanban_spaces;

CREATE POLICY "Users can view spaces" 
ON public.kanban_spaces FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.kanban_boards kb
    WHERE kb.space_id = kanban_spaces.id
    AND kb.is_shared = true
    AND public.user_has_projects_permission(auth.uid())
  )
);

-- =====================================================
-- UPDATE KANBAN_LISTS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view lists" ON public.kanban_lists;
DROP POLICY IF EXISTS "Users can view their lists" ON public.kanban_lists;

CREATE POLICY "Users can view lists" 
ON public.kanban_lists FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_boards kb
    WHERE kb.id = kanban_lists.board_id
    AND (
      auth.uid() = kb.user_id 
      OR public.has_role(auth.uid(), 'admin')
      OR (kb.is_shared = true AND public.user_has_projects_permission(auth.uid()))
    )
  )
);

-- =====================================================
-- UPDATE KANBAN_CARDS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view cards" ON public.kanban_cards;
DROP POLICY IF EXISTS "Users can view their cards" ON public.kanban_cards;

CREATE POLICY "Users can view cards" 
ON public.kanban_cards FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_lists kl
    JOIN public.kanban_boards kb ON kb.id = kl.board_id
    WHERE kl.id = kanban_cards.list_id
    AND (
      auth.uid() = kb.user_id 
      OR public.has_role(auth.uid(), 'admin')
      OR (kb.is_shared = true AND public.user_has_projects_permission(auth.uid()))
    )
  )
);

-- =====================================================
-- UPDATE KANBAN_LABELS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view labels" ON public.kanban_labels;
DROP POLICY IF EXISTS "Users can view their labels" ON public.kanban_labels;

CREATE POLICY "Users can view labels" 
ON public.kanban_labels FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_boards kb
    WHERE kb.id = kanban_labels.board_id
    AND (
      auth.uid() = kb.user_id 
      OR public.has_role(auth.uid(), 'admin')
      OR (kb.is_shared = true AND public.user_has_projects_permission(auth.uid()))
    )
  )
);

-- =====================================================
-- UPDATE KANBAN_ATTACHMENTS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view attachments" ON public.kanban_attachments;
DROP POLICY IF EXISTS "Users can view their attachments" ON public.kanban_attachments;

CREATE POLICY "Users can view attachments" 
ON public.kanban_attachments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_cards kc
    JOIN public.kanban_lists kl ON kl.id = kc.list_id
    JOIN public.kanban_boards kb ON kb.id = kl.board_id
    WHERE kc.id = kanban_attachments.card_id
    AND (
      auth.uid() = kb.user_id 
      OR public.has_role(auth.uid(), 'admin')
      OR (kb.is_shared = true AND public.user_has_projects_permission(auth.uid()))
    )
  )
);
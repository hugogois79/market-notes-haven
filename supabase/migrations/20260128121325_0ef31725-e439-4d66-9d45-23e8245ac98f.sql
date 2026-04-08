-- =====================================================
-- SECURITY FIX: Enable RLS on tables that have policies but RLS disabled
-- Also add missing policies for tables without them
-- =====================================================

-- 1. TODOS TABLE - Policies exist, just enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- 2. CLAWD_TASKS TABLE - No policies, enable RLS and add admin-only policies
ALTER TABLE public.clawd_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view clawd_tasks"
  ON public.clawd_tasks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert clawd_tasks"
  ON public.clawd_tasks FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update clawd_tasks"
  ON public.clawd_tasks FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete clawd_tasks"
  ON public.clawd_tasks FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. KANBAN_CARDS TABLE - Policies exist, just enable RLS
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

-- 4. TELEGRAM_PENDING_EXPENSES TABLE 
-- Has service role policy, add user-scoped policies
CREATE POLICY "Users can view their own pending expenses"
  ON public.telegram_pending_expenses FOR SELECT
  USING (auth.uid() = expense_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own pending expenses"
  ON public.telegram_pending_expenses FOR INSERT
  WITH CHECK (auth.uid() = expense_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own pending expenses"
  ON public.telegram_pending_expenses FOR UPDATE
  USING (auth.uid() = expense_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own pending expenses"
  ON public.telegram_pending_expenses FOR DELETE
  USING (auth.uid() = expense_user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. REMINDER_CONTEXT TABLE - No policies, enable RLS and add admin-only policies
ALTER TABLE public.reminder_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view reminder_context"
  ON public.reminder_context FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert reminder_context"
  ON public.reminder_context FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update reminder_context"
  ON public.reminder_context FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete reminder_context"
  ON public.reminder_context FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- The constraint already exists and project_ids were cleared. Now just create the function and trigger.

-- Create function to update project total cost
CREATE OR REPLACE FUNCTION public.update_project_total_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_project_id uuid;
  new_project_id uuid;
BEGIN
  -- Get old and new project IDs
  IF TG_OP = 'DELETE' THEN
    old_project_id := OLD.project_id;
    new_project_id := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_project_id := NULL;
    new_project_id := NEW.project_id;
  ELSE -- UPDATE
    old_project_id := OLD.project_id;
    new_project_id := NEW.project_id;
  END IF;

  -- Update old project's total cost if it changed
  IF old_project_id IS NOT NULL AND (new_project_id IS NULL OR old_project_id != new_project_id OR TG_OP = 'DELETE') THEN
    UPDATE public.expense_projects
    SET total_cost = COALESCE((
      SELECT SUM(e.amount)
      FROM public.expenses e
      WHERE e.project_id = old_project_id
    ), 0),
    updated_at = NOW()
    WHERE id = old_project_id;
  END IF;

  -- Update new project's total cost
  IF new_project_id IS NOT NULL THEN
    UPDATE public.expense_projects
    SET total_cost = COALESCE((
      SELECT SUM(e.amount)
      FROM public.expenses e
      WHERE e.project_id = new_project_id
    ), 0),
    updated_at = NOW()
    WHERE id = new_project_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on expenses table
DROP TRIGGER IF EXISTS trigger_update_project_total_cost ON public.expenses;
CREATE TRIGGER trigger_update_project_total_cost
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_project_total_cost();

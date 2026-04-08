-- Fix SECURITY DEFINER functions missing fixed search_path
-- This prevents privilege escalation attacks via search_path manipulation

-- Fix create_default_portfolio function
CREATE OR REPLACE FUNCTION public.create_default_portfolio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.crypto_portfolios (user_id, name, description)
  VALUES (NEW.id, 'Main Portfolio', 'My default cryptocurrency portfolio');
  RETURN NEW;
END;
$function$;

-- Fix reorder_cards function
CREATE OR REPLACE FUNCTION public.reorder_cards(card_id uuid, new_list_id uuid, new_position integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update the card
  UPDATE public.kanban_cards
  SET list_id = new_list_id, position = new_position
  WHERE id = card_id;
END;
$function$;
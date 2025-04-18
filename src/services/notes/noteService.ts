
import { supabase } from "@/integrations/supabase/client";
import { TaoNote } from "./types";
import { toast } from "sonner";

export const fetchTaoNotes = async (): Promise<TaoNote[]> => {
  try {
    const { data, error } = await supabase
      .from('tao_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

export const createTaoNote = async (note: Omit<TaoNote, 'id' | 'created_at' | 'updated_at'>): Promise<TaoNote | null> => {
  try {
    const { data, error } = await supabase
      .from('tao_notes')
      .insert([note])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
};

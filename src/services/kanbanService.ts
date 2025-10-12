import { supabase } from "@/integrations/supabase/client";

export interface KanbanBoard {
  id: string;
  title: string;
  description?: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanList {
  id: string;
  title: string;
  board_id: string;
  position: number;
  color?: string;
  created_at: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  list_id: string;
  position: number;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface KanbanLabel {
  id: string;
  name: string;
  color: string;
  board_id: string;
}

export class KanbanService {
  // Board operations
  static async getBoards() {
    const { data, error } = await supabase
      .from('kanban_boards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as KanbanBoard[];
  }

  static async createBoard(board: Partial<KanbanBoard>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('kanban_boards')
      .insert([{ ...board, user_id: user?.id } as any])
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanBoard;
  }

  static async updateBoard(id: string, updates: Partial<KanbanBoard>) {
    const { data, error } = await supabase
      .from('kanban_boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanBoard;
  }

  static async deleteBoard(id: string) {
    const { error } = await supabase
      .from('kanban_boards')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // List operations
  static async getLists(boardId: string) {
    const { data, error } = await supabase
      .from('kanban_lists')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data as KanbanList[];
  }

  static async createList(list: Partial<KanbanList>) {
    const { data, error } = await supabase
      .from('kanban_lists')
      .insert([list as any])
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanList;
  }

  static async updateList(id: string, updates: Partial<KanbanList>) {
    const { data, error } = await supabase
      .from('kanban_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanList;
  }

  static async deleteList(id: string) {
    const { error } = await supabase
      .from('kanban_lists')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Card operations
  static async getCards(listId: string) {
    const { data, error } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('list_id', listId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data as KanbanCard[];
  }

  static async getCardsByBoard(boardId: string) {
    const { data, error } = await supabase
      .from('kanban_cards')
      .select(`
        *,
        kanban_lists!inner(board_id)
      `)
      .eq('kanban_lists.board_id', boardId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data as KanbanCard[];
  }

  static async createCard(card: Partial<KanbanCard>) {
    const { data, error } = await supabase
      .from('kanban_cards')
      .insert([card as any])
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanCard;
  }

  static async updateCard(id: string, updates: Partial<KanbanCard>) {
    const { data, error } = await supabase
      .from('kanban_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanCard;
  }

  static async deleteCard(id: string) {
    const { error } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async moveCard(cardId: string, targetListId: string, newPosition: number) {
    const { data, error } = await supabase
      .from('kanban_cards')
      .update({ 
        list_id: targetListId, 
        position: newPosition 
      })
      .eq('id', cardId)
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanCard;
  }

  static async moveList(listId: string, newPosition: number) {
    const { data, error } = await supabase
      .from('kanban_lists')
      .update({ position: newPosition })
      .eq('id', listId)
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanList;
  }

  // Label operations
  static async getLabels(boardId: string) {
    const { data, error } = await supabase
      .from('kanban_labels')
      .select('*')
      .eq('board_id', boardId);
    
    if (error) throw error;
    return data as KanbanLabel[];
  }

  static async createLabel(label: Partial<KanbanLabel>) {
    const { data, error } = await supabase
      .from('kanban_labels')
      .insert([label as any])
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanLabel;
  }
}

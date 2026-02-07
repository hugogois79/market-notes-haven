import { supabase } from "@/integrations/supabase/client";

export interface KanbanSpace {
  id: string;
  title: string;
  description?: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoard {
  id: string;
  title: string;
  description?: string;
  color: string;
  space_id?: string;
  user_id: string;
  archived: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface KanbanList {
  id: string;
  title: string;
  board_id: string;
  position: number;
  color?: string;
  archived: boolean;
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
  tasks?: Array<{id: string; text: string; completed: boolean}>;
  tags?: string[];
  assigned_to?: string[];
  assigned_external?: string[];
  supervisor_id?: string | null;
  value?: number;
  archived?: boolean;
  completed?: boolean;
  completed_at?: string;
  concluded?: boolean;
  created_at: string;
  updated_at: string;
  attachment_count?: number;
}

export interface KanbanLabel {
  id: string;
  name: string;
  color: string;
  board_id: string;
}

export interface KanbanAttachment {
  id: string;
  card_id: string;
  file_url: string;
  storage_path?: string;
  filename: string;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
}

export class KanbanService {
  // Space operations
  static async getSpaces() {
    const { data, error } = await supabase
      .from('kanban_spaces')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as KanbanSpace[];
  }

  static async createSpace(space: Partial<KanbanSpace>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('kanban_spaces')
      .insert([{ ...space, user_id: user?.id } as any])
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanSpace;
  }

  static async updateSpace(id: string, updates: Partial<KanbanSpace>) {
    const { data, error } = await supabase
      .from('kanban_spaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as KanbanSpace;
  }

  static async deleteSpace(id: string) {
    const { error } = await supabase
      .from('kanban_spaces')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Board operations
  static async getBoards(spaceId?: string) {
    let query = supabase
      .from('kanban_boards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (spaceId !== undefined) {
      if (spaceId === null || spaceId === '') {
        query = query.is('space_id', null);
      } else {
        query = query.eq('space_id', spaceId);
      }
    }
    
    const { data, error } = await query;
    
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
    return data as unknown as KanbanCard[];
  }

  static async getCardsByBoard(boardId: string, includeArchived: boolean = false) {
    // First get the cards
    let query = supabase
      .from('kanban_cards')
      .select(`
        *,
        kanban_lists!inner(board_id)
      `)
      .eq('kanban_lists.board_id', boardId);
    
    if (!includeArchived) {
      query = query.or('concluded.is.null,concluded.eq.false');
    }
    
    const { data: cardsData, error } = await query.order('position', { ascending: true });
    
    if (error) throw error;
    
    // Get attachment counts for all cards
    const cardIds = cardsData?.map(c => c.id) || [];
    
    if (cardIds.length === 0) {
      return [] as KanbanCard[];
    }
    
    const { data: attachmentCounts, error: countError } = await supabase
      .from('kanban_attachments')
      .select('card_id')
      .in('card_id', cardIds);
    
    if (countError) {
      console.error('Error fetching attachment counts:', countError);
      return cardsData as unknown as KanbanCard[];
    }
    
    // Count attachments per card
    const countMap = (attachmentCounts || []).reduce((acc, att) => {
      acc[att.card_id] = (acc[att.card_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Add attachment count to each card
    const cardsWithCounts = cardsData?.map(card => ({
      ...card,
      attachment_count: countMap[card.id] || 0
    }));
    
    return cardsWithCounts as unknown as KanbanCard[];
  }

  static async createCard(card: Partial<KanbanCard>) {
    const { data, error } = await supabase
      .from('kanban_cards')
      .insert([card as any])
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as KanbanCard;
  }

  static async updateCard(id: string, updates: Partial<KanbanCard>) {
    const { data, error } = await supabase
      .from('kanban_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as KanbanCard;
  }

  static async deleteCard(id: string) {
    const { error } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async moveCard(cardId: string, targetListId: string, newPosition: number) {
    // Get the card being moved to find its current list
    const { data: movedCard, error: cardError } = await supabase
      .from('kanban_cards')
      .select('list_id, position')
      .eq('id', cardId)
      .single();
    
    if (cardError) throw cardError;
    
    const sourceListId = movedCard.list_id;
    const oldPosition = movedCard.position;
    
    // Get all cards in the target list (excluding the moved card)
    const { data: targetCards, error: targetError } = await supabase
      .from('kanban_cards')
      .select('id, position')
      .eq('list_id', targetListId)
      .neq('id', cardId)
      .order('position', { ascending: true });
    
    if (targetError) throw targetError;
    
    // If moving within the same list
    if (sourceListId === targetListId) {
      // Reorder cards in the same list
      const updates: { id: string; position: number }[] = [];
      let position = 0;
      
      for (const card of targetCards || []) {
        if (position === newPosition) {
          position++; // Leave space for the moved card
        }
        if (card.position !== position) {
          updates.push({ id: card.id, position });
        }
        position++;
      }
      
      // Update all affected cards
      for (const update of updates) {
        await supabase
          .from('kanban_cards')
          .update({ position: update.position })
          .eq('id', update.id);
      }
    } else {
      // Moving to a different list - shift cards in target list
      const updates: { id: string; position: number }[] = [];
      let position = 0;
      
      for (const card of targetCards || []) {
        if (position === newPosition) {
          position++; // Leave space for the moved card
        }
        if (card.position !== position) {
          updates.push({ id: card.id, position });
        }
        position++;
      }
      
      // Update all affected cards in target list
      for (const update of updates) {
        await supabase
          .from('kanban_cards')
          .update({ position: update.position })
          .eq('id', update.id);
      }
      
      // Also reorder cards in the source list to close the gap
      const { data: sourceCards, error: sourceError } = await supabase
        .from('kanban_cards')
        .select('id, position')
        .eq('list_id', sourceListId)
        .neq('id', cardId)
        .order('position', { ascending: true });
      
      if (!sourceError && sourceCards) {
        let srcPosition = 0;
        for (const card of sourceCards) {
          if (card.position !== srcPosition) {
            await supabase
              .from('kanban_cards')
              .update({ position: srcPosition })
              .eq('id', card.id);
          }
          srcPosition++;
        }
      }
    }
    
    // Finally, update the moved card
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
    return data as unknown as KanbanCard;
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

  // Attachment operations
  static async getAttachments(cardId: string) {
    const { data, error } = await supabase
      .from('kanban_attachments')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as KanbanAttachment[];
  }

  static async uploadAttachment(cardId: string, file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const storagePath = `${cardId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('kanban-attachments')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('kanban-attachments')
      .getPublicUrl(storagePath);

    const { data, error } = await supabase
      .from('kanban_attachments')
      .insert([{
        card_id: cardId,
        file_url: publicUrl,
        storage_path: storagePath,
        filename: file.name,
        file_type: file.type,
        uploaded_by: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data as KanbanAttachment;
  }

  static async deleteAttachment(id: string, fileUrl: string) {
    const fileName = fileUrl.split('/').slice(-2).join('/');
    
    const { error: storageError } = await supabase.storage
      .from('kanban-attachments')
      .remove([fileName]);

    if (storageError) console.error('Error deleting file from storage:', storageError);

    const { error } = await supabase
      .from('kanban_attachments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getSignedDownloadUrl(fileUrl: string, storagePath?: string): Promise<string> {
    // Use storage_path directly if available (new records)
    // Otherwise, extract from public URL (legacy records)
    let filePath = storagePath;
    
    if (!filePath) {
      // Fallback: Extract the file path from the public URL
      // URL format: .../storage/v1/object/public/kanban-attachments/{cardId}/{filename}
      const urlParts = fileUrl.split('/kanban-attachments/');
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL format');
      }
      filePath = decodeURIComponent(urlParts[1]);
    }
    
    const { data, error } = await supabase.storage
      .from('kanban-attachments')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Failed to generate signed URL');
    
    return data.signedUrl;
  }
}

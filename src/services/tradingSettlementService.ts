import { supabase } from "@/integrations/supabase/client";
import { TradingSettlementNote } from "@/types";
import { toast } from "sonner";

// Type for our database trading settlement notes
export interface DbTradingSettlementNote {
  id: string;
  note_id: string;
  trade_date: string;
  settlement_date: string | null;
  asset_symbol: string;
  quantity: number;
  price: number;
  trade_type: 'buy' | 'sell' | 'short' | 'cover';
  fees: number | null;
  pnl: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Convert database trading settlement note to app format
export const dbNoteToTradingSettlementNote = (dbNote: DbTradingSettlementNote): TradingSettlementNote => ({
  id: dbNote.id,
  noteId: dbNote.note_id,
  tradeDate: new Date(dbNote.trade_date),
  settlementDate: dbNote.settlement_date ? new Date(dbNote.settlement_date) : undefined,
  assetSymbol: dbNote.asset_symbol,
  quantity: dbNote.quantity,
  price: dbNote.price,
  tradeType: dbNote.trade_type,
  fees: dbNote.fees ?? undefined,
  pnl: dbNote.pnl ?? undefined,
  notes: dbNote.notes ?? undefined,
  createdAt: new Date(dbNote.created_at),
  updatedAt: new Date(dbNote.updated_at)
});

// Convert app trading settlement note to database format
export const tradingSettlementNoteToDbNote = (note: Partial<TradingSettlementNote>): Partial<DbTradingSettlementNote> => ({
  id: note.id,
  note_id: note.noteId,
  trade_date: note.tradeDate?.toISOString(),
  settlement_date: note.settlementDate?.toISOString() || null,
  asset_symbol: note.assetSymbol,
  quantity: note.quantity,
  price: note.price,
  trade_type: note.tradeType,
  fees: note.fees ?? null,
  pnl: note.pnl ?? null,
  notes: note.notes ?? null
});

// Fetch trading settlement notes for a specific note
export const fetchTradingSettlementNotes = async (noteId: string): Promise<TradingSettlementNote[]> => {
  try {
    const { data, error } = await supabase
      .from('trading_settlement_notes')
      .select('*')
      .eq('note_id', noteId)
      .order('trade_date', { ascending: false });

    if (error) {
      console.error('Error fetching trading settlement notes:', error);
      return [];
    }

    return (data || []).map(dbNote => dbNoteToTradingSettlementNote(dbNote as DbTradingSettlementNote));
  } catch (error) {
    console.error('Error fetching trading settlement notes:', error);
    return [];
  }
};

// Create a new trading settlement note
export const createTradingSettlementNote = async (note: Omit<TradingSettlementNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradingSettlementNote | null> => {
  try {
    const dbNote = tradingSettlementNoteToDbNote(note);
    
    const { data, error } = await supabase
      .from('trading_settlement_notes')
      .insert(dbNote)
      .select()
      .single();

    if (error) {
      console.error('Error creating trading settlement note:', error);
      toast.error('Failed to create trading settlement note');
      return null;
    }

    return dbNoteToTradingSettlementNote(data as DbTradingSettlementNote);
  } catch (error) {
    console.error('Error creating trading settlement note:', error);
    toast.error('Failed to create trading settlement note');
    return null;
  }
};

// Update an existing trading settlement note
export const updateTradingSettlementNote = async (note: Partial<TradingSettlementNote> & { id: string }): Promise<TradingSettlementNote | null> => {
  try {
    const dbNote = tradingSettlementNoteToDbNote(note);
    
    const { data, error } = await supabase
      .from('trading_settlement_notes')
      .update(dbNote)
      .eq('id', note.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating trading settlement note:', error);
      toast.error('Failed to update trading settlement note');
      return null;
    }

    return dbNoteToTradingSettlementNote(data as DbTradingSettlementNote);
  } catch (error) {
    console.error('Error updating trading settlement note:', error);
    toast.error('Failed to update trading settlement note');
    return null;
  }
};

// Delete a trading settlement note
export const deleteTradingSettlementNote = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('trading_settlement_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting trading settlement note:', error);
      toast.error('Failed to delete trading settlement note');
      return false;
    }

    toast.success('Trading settlement note deleted');
    return true;
  } catch (error) {
    console.error('Error deleting trading settlement note:', error);
    toast.error('Failed to delete trading settlement note');
    return false;
  }
};

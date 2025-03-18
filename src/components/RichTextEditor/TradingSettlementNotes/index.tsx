
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingSettlementNote } from "@/types";
import { fetchTradingSettlementNotes, deleteTradingSettlementNote } from "@/services/tradingSettlementService";
import TradingSettlementForm from "./TradingSettlementForm";
import TradingSettlementTable from "./TradingSettlementTable";
import { toast } from "sonner";

interface TradingSettlementNotesProps {
  noteId: string;
}

const TradingSettlementNotes: React.FC<TradingSettlementNotesProps> = ({ noteId }) => {
  const [notes, setNotes] = useState<TradingSettlementNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<TradingSettlementNote | null>(null);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const fetchedNotes = await fetchTradingSettlementNotes(noteId);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Error loading trading settlement notes:", error);
      toast.error("Failed to load trading settlement notes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (noteId) {
      loadNotes();
    }
  }, [noteId]);

  const handleAddNote = () => {
    setIsAddingNote(true);
    setEditingNote(null);
  };

  const handleEditNote = (note: TradingSettlementNote) => {
    setEditingNote(note);
    setIsAddingNote(true);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const success = await deleteTradingSettlementNote(id);
      if (success) {
        setNotes(notes.filter(note => note.id !== id));
      }
    } catch (error) {
      console.error("Error deleting trading settlement note:", error);
    }
  };

  const handleFormCancel = () => {
    setIsAddingNote(false);
    setEditingNote(null);
  };

  const handleFormSuccess = () => {
    setIsAddingNote(false);
    setEditingNote(null);
    loadNotes();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Trading Settlement Notes</CardTitle>
            <CardDescription>
              Record your trades with settlement details
            </CardDescription>
          </div>
          {!isAddingNote && (
            <Button onClick={handleAddNote} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Trade
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAddingNote ? (
          <TradingSettlementForm
            noteId={noteId}
            existingNote={editingNote || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        ) : isLoading ? (
          <div className="text-center py-8">Loading trading notes...</div>
        ) : (
          <TradingSettlementTable
            notes={notes}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TradingSettlementNotes;


import React from "react";
import { Note } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "lucide-react";
import NoteCard from "@/components/NoteCard";

interface CryptoDashboardProps {
  notes: Note[];
  loading: boolean;
}

const CryptoDashboard: React.FC<CryptoDashboardProps> = ({ notes, loading }) => {
  const cryptoNotes = notes.filter(note => note.category === "Crypto");
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Crypto Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader className="h-6 w-6 animate-spin text-primary mr-2" />
          <p>Loading crypto data...</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">
              Found {cryptoNotes.length} crypto-related notes
            </p>
          </div>
          
          {cryptoNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cryptoNotes.map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">No crypto notes found</p>
                <p className="text-sm mt-2">
                  Create notes with the "Crypto" category to see them here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CryptoDashboard;


import { FileText } from "lucide-react";
import NoteCard from "@/components/NoteCard";
import { Note } from "@/types";

interface NotesDisplayProps {
  title: string;
  notes: Note[];
  emptyMessage?: string;
}

const NotesDisplay = ({ title, notes, emptyMessage = "No notes found." }: NotesDisplayProps) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText size={20} className="text-[#1EAEDB]" />
        {title}
      </h2>
      
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
};

export default NotesDisplay;

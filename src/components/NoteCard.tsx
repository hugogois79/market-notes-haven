
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag } from "lucide-react";
import { Note } from "@/types";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  className?: string;
}

const NoteCard = ({ note, className }: NoteCardProps) => {
  const navigate = useNavigate();
  
  // Format date to be more readable
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Extract plain text from HTML content for preview
  const getTextPreview = (htmlContent: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent.substring(0, 150) + (textContent.length > 150 ? "..." : "");
  };

  const handleNoteClick = () => {
    console.log("Navigating to note:", note.id);
    navigate(`/editor/${note.id}`);
  };

  return (
    <Card 
      className={cn(
        "h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 glass-card cursor-pointer",
        className
      )}
      onClick={handleNoteClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-lg line-clamp-2">{note.title}</h3>
          <Badge variant="outline" className="shrink-0">
            {note.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-muted-foreground text-sm line-clamp-3">
          {getTextPreview(note.content)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={14} />
          <span>{formatDate(note.updatedAt)}</span>
        </div>
        {note.tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Tag size={14} className="text-muted-foreground" />
            <div className="flex gap-1.5">
              {note.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs py-0 px-1.5">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs py-0 px-1.5">
                  +{note.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default NoteCard;

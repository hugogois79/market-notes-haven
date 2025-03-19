
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag } from "lucide-react";
import { Note, Token } from "@/types";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getTokensForNote } from "@/services/tokenService";
import TokenBadge from "./TokenBadge";

interface NoteCardProps {
  note: Note;
  className?: string;
  tagMapping?: Record<string, string>;
}

const NoteCard = ({ note, className, tagMapping = {} }: NoteCardProps) => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        const noteTokens = await getTokensForNote(note.id);
        setTokens(noteTokens);
      } catch (error) {
        console.error(`Error fetching tokens for note ${note.id}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (note.id && !note.id.toString().startsWith('temp-')) {
      fetchTokens();
    }
  }, [note.id]);
  
  // Helper to get tag name from ID
  const getTagName = (tagId: string) => {
    return tagMapping[tagId] || tagId;
  };
  
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
    // Handle null/undefined content
    if (!htmlContent) return "";
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent.substring(0, 120) + (textContent.length > 120 ? "..." : "");
  };

  const handleNoteClick = (event: React.MouseEvent) => {
    // Don't navigate if they clicked on a token badge directly
    if ((event.target as HTMLElement).closest('.token-badge')) {
      return;
    }
    
    // Use timeout to ensure the navigation happens after the event is processed
    setTimeout(() => {
      navigate(`/editor/${note.id}`);
    }, 10);
  };

  return (
    <Card 
      className={cn(
        "h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 glass-card cursor-pointer",
        className
      )}
      onClick={handleNoteClick}
      data-note-id={note.id}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-base line-clamp-2">{note.title || "Untitled Note"}</h3>
          {note.category && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {note.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-muted-foreground text-xs line-clamp-3">
          {getTextPreview(note.content)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex flex-wrap gap-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mr-auto">
          <Calendar size={14} />
          <span>{formatDate(note.updatedAt || new Date())}</span>
        </div>
        
        {/* Token badges */}
        {tokens && tokens.length > 0 && (
          <div className="flex flex-wrap gap-1 w-full mt-2">
            {tokens.map(token => (
              <TokenBadge key={token.id} token={token} className="token-badge" />
            ))}
          </div>
        )}
        
        {/* Tags - displayed right after tokens */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 w-full mt-1">
            {note.tags.map((tagId) => (
              <Badge key={tagId} className="text-xs py-0.5 px-2 bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/90 flex items-center gap-1">
                <Tag size={10} />
                {getTagName(tagId)}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Note ID/Serial Number displayed in small text */}
        <div className="w-full mt-1">
          <span className="text-[10px] text-muted-foreground block truncate">
            ID: {note.id}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NoteCard;

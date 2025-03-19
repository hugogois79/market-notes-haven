
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
  selectedTokenIds?: string[] | null;
  onTokenMatch?: (noteId: string, tokenId: string, matches: boolean) => void;
}

const NoteCard = ({ 
  note, 
  className, 
  tagMapping = {},
  selectedTokenIds = null,
  onTokenMatch
}: NoteCardProps) => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        if (!note.id || note.id.toString().startsWith('temp-')) {
          setTokens([]);
          setIsLoading(false);
          // Report that this note doesn't match if we're filtering by token
          if (selectedTokenIds && selectedTokenIds.length > 0 && onTokenMatch) {
            selectedTokenIds.forEach(tokenId => {
              onTokenMatch(note.id, tokenId, false);
            });
          }
          return;
        }
        
        const noteTokens = await getTokensForNote(note.id);
        console.log(`Fetched tokens for note ${note.id}:`, noteTokens);
        setTokens(noteTokens);
        
        // If we're filtering by token, report whether this note matches each selected token
        if (selectedTokenIds && selectedTokenIds.length > 0 && onTokenMatch) {
          selectedTokenIds.forEach(tokenId => {
            const hasMatchingToken = noteTokens.some(token => token.id === tokenId);
            onTokenMatch(note.id, tokenId, hasMatchingToken);
          });
        }
      } catch (error) {
        console.error(`Error fetching tokens for note ${note.id}:`, error);
        setTokens([]);
        // Report no match on error
        if (selectedTokenIds && selectedTokenIds.length > 0 && onTokenMatch) {
          selectedTokenIds.forEach(tokenId => {
            onTokenMatch(note.id, tokenId, false);
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTokens();
  }, [note.id, selectedTokenIds, onTokenMatch]);
  
  // Helper to get tag name from ID
  const getTagName = (tagId: string) => {
    return tagMapping[tagId] || tagId;
  };
  
  // Format date to be more readable
  const formatDate = (date: Date) => {
    if (!date) return "No date";
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
    return textContent.substring(0, 75) + (textContent.length > 75 ? "..." : "");
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

  // Check if the card is in list view mode based on className
  const isListView = className?.includes("flex-row");

  return (
    <Card 
      className={cn(
        "h-auto overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 glass-card cursor-pointer note-card-compact",
        isListView && "note-card-list",
        className
      )}
      onClick={handleNoteClick}
      data-note-id={note.id}
    >
      <CardHeader className={cn("p-2 pb-0", isListView && "p-1.5 pb-0")}>
        <div className="flex justify-between items-start gap-2">
          <h3 className={cn("font-medium text-sm line-clamp-1", isListView && "text-xs")}>
            {note.title || "Untitled Note"}
          </h3>
          {note.category && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {note.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn("p-2 pt-1 pb-0", isListView && "p-1.5 pt-0.5 pb-0")}>
        <p className={cn("text-muted-foreground text-xs line-clamp-2", isListView && "line-clamp-1 text-[10px]")}>
          {getTextPreview(note.content)}
        </p>
      </CardContent>
      <CardFooter className={cn("p-2 pt-1 flex flex-wrap gap-y-1 items-center", isListView && "p-1.5 pt-0.5 gap-y-0.5")}>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-auto">
          <Calendar size={isListView ? 10 : 12} />
          <span className={cn(isListView && "text-[10px]")}>
            {formatDate(note.updatedAt || new Date())}
          </span>
        </div>
        
        {/* Combined tags and tokens section to save space */}
        <div className={cn("flex flex-wrap items-center gap-1 w-full mt-1", isListView && "mt-0.5 gap-0.5")}>
          {/* Tags */}
          {note.tags && note.tags.length > 0 && note.tags.map((tagId) => (
            <Badge 
              key={tagId} 
              className={cn(
                "text-xs py-0 px-1.5 bg-[#0A3A5C] text-white hover:bg-[#0A3A5C]/90 flex items-center gap-1",
                isListView && "text-[9px] py-0 px-1"
              )}
            >
              <Tag size={isListView ? 7 : 8} />
              {getTagName(tagId)}
            </Badge>
          ))}
          
          {/* Tokens */}
          {tokens && tokens.length > 0 && tokens.map(token => (
            <TokenBadge 
              key={token.id} 
              token={token} 
              className={cn(
                "token-badge text-xs py-0",
                isListView && "text-[9px] py-0 px-1",
                selectedTokenIds?.includes(token.id) ? "ring-1 ring-offset-1 ring-primary" : ""
              )} 
            />
          ))}
        </div>
        
        {/* Note ID in small text */}
        <div className="w-full mt-0">
          <span className={cn("text-[8px] text-muted-foreground block truncate", isListView && "text-[7px]")}>
            ID: {note.id}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NoteCard;

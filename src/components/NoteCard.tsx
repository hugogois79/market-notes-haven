
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag } from "lucide-react";
import { Note, Token } from "@/types";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getTokensForNote } from "@/services/tokenService";
import TokenBadge from "./TokenBadge";
import { fetchTags } from "@/services/tagService";

interface NoteCardProps {
  note: Note;
  className?: string;
}

const NoteCard = ({ note, className }: NoteCardProps) => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tagNameMap, setTagNameMap] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const fetchTokens = async () => {
      const noteTokens = await getTokensForNote(note.id);
      setTokens(noteTokens);
    };
    
    fetchTokens();
    
    // Fetch tags to map IDs to names
    const loadTags = async () => {
      try {
        const tags = await fetchTags();
        const tagMap: Record<string, string> = {};
        tags.forEach(tag => {
          tagMap[tag.id] = tag.name;
        });
        setTagNameMap(tagMap);
      } catch (error) {
        console.error("Error loading tag mapping:", error);
      }
    };
    
    loadTags();
  }, [note.id]);
  
  // Helper to get tag name from ID
  const getTagName = (tagId: string) => {
    return tagNameMap[tagId] || tagId;
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
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent.substring(0, 150) + (textContent.length > 150 ? "..." : "");
  };

  const handleNoteClick = () => {
    console.log("Navigating to note:", note.id);
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
        
        {tokens.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {tokens.map(token => (
              <TokenBadge key={token.id} token={token} />
            ))}
          </div>
        )}
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
              {note.tags.slice(0, 2).map((tagId) => (
                <Badge key={tagId} variant="secondary" className="text-xs py-0 px-1.5">
                  {getTagName(tagId)}
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

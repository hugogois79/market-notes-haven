
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Save,
  Clock,
  Tags as TagsIcon,
  X,
  ChevronDown,
  Coins,
} from "lucide-react";
import { Note, Token } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchTokens, linkTokenToNote, unlinkTokenFromNote } from "@/services/tokenService";

interface RichTextEditorProps {
  note?: Note;
  onSave?: (note: Note) => Promise<Note | null>;
  categories?: string[];
  linkedTokens?: Token[];
}

const RichTextEditor = ({ note, onSave, categories = [], linkedTokens = [] }: RichTextEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState(note?.category || "General");
  const [lastSaved, setLastSaved] = useState<Date | null>(note?.updatedAt || null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>(linkedTokens || []);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const initialContentRef = useRef<string>("");

  // Ensure we have at least the General category
  const allCategories = ["General", ...categories.filter(c => c !== "General")];

  // Update state when note prop changes
  useEffect(() => {
    console.log("RichTextEditor: note changed", note);
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setTags(note.tags || []);
      setCategory(note.category || "General");
      setLastSaved(note.updatedAt || null);
    }
  }, [note]);

  // Load tokens
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoadingTokens(true);
      try {
        const fetchedTokens = await fetchTokens();
        setTokens(fetchedTokens);
      } catch (error) {
        console.error("Error loading tokens:", error);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, []);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      if (note?.content) {
        console.log('Setting editor content from note:', note.content);
        editorRef.current.innerHTML = note.content;
        initialContentRef.current = note.content;
        setContent(note.content);
      } else {
        console.log('Setting empty editor content for new note');
        editorRef.current.innerHTML = "";
        initialContentRef.current = "";
        setContent("");
      }
    } else {
      console.log('Editor ref not available');
    }
  }, [note]);

  // Update linked tokens when prop changes
  useEffect(() => {
    setSelectedTokens(linkedTokens || []);
  }, [linkedTokens]);

  // Handle content changes
  const handleContentChange = () => {
    if (!editorRef.current) return;
    
    const newContent = editorRef.current.innerHTML;
    
    // Only update if content has actually changed
    if (newContent !== content) {
      console.log('Content changed:', newContent);
      setContent(newContent);
    }
  };

  // Format commands
  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      // Focus back on the editor after applying format
      editorRef.current.focus();
      // Trigger content change after a brief delay to ensure command is applied
      setTimeout(() => {
        handleContentChange();
      }, 10);
    }
  };

  // Handle adding tags
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (tags.includes(tagInput.trim())) {
      toast.error("Tag already exists");
      return;
    }
    
    setTags([...tags, tagInput.trim()]);
    setTagInput("");
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle category selection
  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
  };

  // Handle token selection
  const handleTokenSelect = (tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;
    
    if (selectedTokens.some(t => t.id === tokenId)) {
      // Token already selected, remove it
      setSelectedTokens(selectedTokens.filter(t => t.id !== tokenId));
    } else {
      // Add token to selected tokens
      setSelectedTokens([...selectedTokens, token]);
    }
  };

  // Handle token removal
  const handleRemoveToken = (tokenId: string) => {
    setSelectedTokens(selectedTokens.filter(t => t.id !== tokenId));
  };

  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }
    
    if (!editorRef.current) return;
    
    const currentContent = editorRef.current.innerHTML;
    console.log('Saving content:', currentContent);
    
    const updatedNote: Note = {
      id: note?.id || Date.now().toString(),
      title,
      content: currentContent,
      tags,
      category,
      createdAt: note?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    const savedNote = await onSave?.(updatedNote);
    
    if (savedNote) {
      console.log("Note saved successfully:", savedNote.id);
      initialContentRef.current = currentContent; // Update reference content after successful save
      
      // Update token associations
      try {
        // First, identify previous and current token ids
        const previousTokenIds = linkedTokens.map(t => t.id);
        const currentTokenIds = selectedTokens.map(t => t.id);
        
        console.log("Previous token IDs:", previousTokenIds);
        console.log("Current token IDs:", currentTokenIds);
        
        // Find tokens to remove (in previous but not in current)
        const tokensToRemove = previousTokenIds.filter(id => !currentTokenIds.includes(id));
        
        // Find tokens to add (in current but not in previous)
        const tokensToAdd = currentTokenIds.filter(id => !previousTokenIds.includes(id));
        
        console.log("Tokens to remove:", tokensToRemove);
        console.log("Tokens to add:", tokensToAdd);
        
        // Process removals
        for (const tokenId of tokensToRemove) {
          console.log(`Unlinking token ${tokenId} from note ${savedNote.id}`);
          const success = await unlinkTokenFromNote(savedNote.id, tokenId);
          if (!success) {
            console.error(`Failed to unlink token ${tokenId}`);
          }
        }
        
        // Process additions
        for (const tokenId of tokensToAdd) {
          console.log(`Linking token ${tokenId} to note ${savedNote.id}`);
          const success = await linkTokenToNote(savedNote.id, tokenId);
          if (!success) {
            console.error(`Failed to link token ${tokenId}`);
          }
        }
        
        // Only show a success toast if we had tokens to link/unlink
        if (tokensToAdd.length > 0 || tokensToRemove.length > 0) {
          toast.success("Token associations updated");
        }
      } catch (error) {
        console.error("Error updating token associations:", error);
        toast.error("Failed to update token associations");
      }
      
      setLastSaved(new Date());
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Editor Header */}
      <div className="mb-4 space-y-4">
        <Input
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
        />
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-sm text-muted-foreground">
            <Clock size={14} />
            <span>
              {lastSaved 
                ? `Last saved: ${lastSaved.toLocaleTimeString()}`
                : "Not saved yet"}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-8">
                <TagsIcon size={14} />
                <span>{category}</span>
                <ChevronDown size={14} className="opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {allCategories.map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={cn("cursor-pointer", {
                    "font-medium": cat === category,
                  })}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Token Selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Coins size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Linked Tokens</span>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {selectedTokens.map(token => (
              <Badge key={token.id} variant="secondary" className="px-3 py-1 text-sm gap-2">
                {token.symbol} - {token.name}
                <button onClick={() => handleRemoveToken(token.id)} className="opacity-70 hover:opacity-100">
                  <X size={12} />
                </button>
              </Badge>
            ))}
            
            <Select onValueChange={handleTokenSelect}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Link token..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTokens ? (
                  <SelectItem value="loading" disabled>Loading tokens...</SelectItem>
                ) : tokens.length === 0 ? (
                  <SelectItem value="none" disabled>No tokens available</SelectItem>
                ) : (
                  tokens
                    .filter(token => !selectedTokens.some(t => t.id === token.id))
                    .map(token => (
                      <SelectItem key={token.id} value={token.id}>
                        {token.symbol} - {token.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Tag Input */}
        <div className="flex flex-wrap gap-2 items-center">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm gap-2">
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="opacity-70 hover:opacity-100">
                <X size={12} />
              </button>
            </Badge>
          ))}
          
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="h-8 w-28 text-sm"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddTag} 
              className="h-8"
            >
              Add
            </Button>
          </div>
        </div>
      </div>
      
      {/* Formatting Toolbar */}
      <div className="bg-card glass-card rounded-md mb-4 p-1 flex flex-wrap items-center gap-1 sticky top-0 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("bold")}>
                <Bold size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("italic")}>
                <Italic size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("formatBlock", "<h1>")}>
                <Heading1 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("formatBlock", "<h2>")}>
                <Heading2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("formatBlock", "<h3>")}>
                <Heading3 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("insertUnorderedList")}>
                <List size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("insertOrderedList")}>
                <ListOrdered size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => execCommand("formatBlock", "<blockquote>")}>
                <Quote size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  const url = prompt("Enter link URL");
                  if (url) execCommand("createLink", url);
                }}
              >
                <LinkIcon size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Link</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  const url = prompt("Enter image URL");
                  if (url) execCommand("insertImage", url);
                }}
              >
                <ImageIcon size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Image</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => execCommand("formatBlock", "<pre>")}
              >
                <Code size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>
          
          <div className="ml-auto">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSave}
              className="gap-2"
            >
              <Save size={16} />
              Save
            </Button>
          </div>
        </TooltipProvider>
      </div>
      
      {/* Editor Content */}
      <div 
        ref={editorRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 rounded-lg border border-border/50 focus:outline-none note-content editable min-h-[300px] animate-fade-in",
          "prose prose-sm md:prose-base dark:prose-invert max-w-none"
        )}
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;

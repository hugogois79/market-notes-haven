
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
} from "lucide-react";
import { Note } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RichTextEditorProps {
  note?: Note;
  onSave?: (note: Note) => void;
  categories?: string[];
}

const RichTextEditor = ({ note, onSave, categories = [] }: RichTextEditorProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState(note?.category || "General");
  const [lastSaved, setLastSaved] = useState<Date | null>(note?.updatedAt || null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure we have at least the General category
  const allCategories = ["General", ...categories.filter(c => c !== "General")];

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  // Handle content changes and autosave
  const handleContentChange = () => {
    if (!editorRef.current) return;
    
    setContent(editorRef.current.innerHTML);
    
    // Setup autosave
    setIsAutosaving(true);
    
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    autosaveTimeoutRef.current = setTimeout(() => {
      handleSave();
      setIsAutosaving(false);
    }, 2000);
  };

  // Format commands
  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleContentChange();
    if (editorRef.current) editorRef.current.focus();
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

  // Handle save
  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }
    
    const updatedNote: Note = {
      id: note?.id || Date.now().toString(),
      title,
      content: editorRef.current?.innerHTML || "",
      tags,
      category,
      createdAt: note?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    onSave?.(updatedNote);
    setLastSaved(new Date());
    toast.success("Note saved successfully");
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
            {isAutosaving && <span className="ml-1 text-primary">(Saving...)</span>}
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
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default RichTextEditor;

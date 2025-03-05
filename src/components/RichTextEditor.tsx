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
  Plus,
  Paperclip,
  File as FileIcon,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Note, Token, Tag as TagType } from "@/types";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { fetchTags, createTag, getTagsForNote, linkTagToNote, unlinkTagFromNote } from "@/services/tagService";
import { uploadNoteAttachment, deleteNoteAttachment } from "@/services/supabaseService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [linkedTags, setLinkedTags] = useState<TagType[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(note?.attachment_url);
  const [isUploading, setIsUploading] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialContentRef = useRef<string>("");

  // Ensure we have at least the General category
  const allCategories = ["General", ...categories.filter(c => c !== "General")];

  // Update state when note prop changes
  useEffect(() => {
    console.log("RichTextEditor: note changed", note);
    if (note) {
      setTitle(note.title || "");
      setTags(note.tags || []);
      setCategory(note.category || "General");
      setLastSaved(note.updatedAt || null);
      
      // Handle content separately to avoid potential issues
      const noteContent = note.content || "";
      setContent(noteContent);
      console.log("Setting content from note:", noteContent);
      
      // Set the editor content directly if the ref is available
      if (editorRef.current) {
        console.log("Setting editor innerHTML directly");
        editorRef.current.innerHTML = noteContent;
        initialContentRef.current = noteContent;
      }
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

  // Load available tags
  useEffect(() => {
    const fetchAllTags = async () => {
      setIsLoadingTags(true);
      try {
        const allTags = await fetchTags();
        setAvailableTags(allTags);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setIsLoadingTags(false);
      }
    };
    
    fetchAllTags();
  }, []);
  
  // Load tags for this note
  useEffect(() => {
    const fetchNoteTagsData = async () => {
      if (!note || !note.id || note.id.toString().startsWith("temp-")) return;
      
      try {
        const noteTags = await getTagsForNote(note.id);
        setLinkedTags(noteTags);
        
        // Update our tags string array for backward compatibility
        setTags(noteTags.map(tag => tag.name));
      } catch (error) {
        console.error("Error fetching tags for note:", error);
      }
    };
    
    fetchNoteTagsData();
  }, [note]);

  // Update linked tokens when prop changes
  useEffect(() => {
    setSelectedTokens(linkedTokens || []);
  }, [linkedTokens]);

  // Update attachment when note changes
  useEffect(() => {
    if (note?.attachment_url) {
      setAttachmentUrl(note.attachment_url);
    } else {
      setAttachmentUrl(undefined);
    }
  }, [note?.attachment_url]);

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
  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    
    // Check if tag with this name already exists
    const existingTagIndex = availableTags.findIndex(
      tag => tag.name.toLowerCase() === tagInput.trim().toLowerCase()
    );
    
    if (existingTagIndex !== -1) {
      // Tag exists, check if it's already linked to this note
      const existingTag = availableTags[existingTagIndex];
      const isTagAlreadyLinked = linkedTags.some(tag => tag.id === existingTag.id);
      
      if (isTagAlreadyLinked) {
        toast.error(`Tag "${existingTag.name}" is already added to this note`);
        setTagInput("");
        return;
      }
      
      // Add existing tag
      setLinkedTags(prev => [...prev, existingTag]);
      setTags(prev => [...prev, existingTag.name]);
      setTagInput("");
      toast.success(`Added tag: ${existingTag.name}`);
    } else {
      // Create new tag
      const newTag = await createTag(tagInput.trim());
      if (newTag) {
        setLinkedTags(prev => [...prev, newTag]);
        setTags(prev => [...prev, newTag.name]);
        setTagInput("");
        toast.success(`Created and added new tag: ${newTag.name}`);
        
        // Add to available tags
        setAvailableTags(prev => [...prev, newTag]);
      }
    }
  };

  // Handle selecting existing tag
  const handleSelectTag = (tag: TagType) => {
    const isTagAlreadyLinked = linkedTags.some(t => t.id === tag.id);
    
    if (isTagAlreadyLinked) {
      toast.error(`Tag "${tag.name}" is already added to this note`);
      return;
    }
    
    setLinkedTags(prev => [...prev, tag]);
    setTags(prev => [...prev, tag.name]);
    toast.success(`Added tag: ${tag.name}`);
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove: TagType | string) => {
    if (typeof tagToRemove === 'string') {
      // Find the tag object by name
      const tagObj = linkedTags.find(t => t.name === tagToRemove);
      if (tagObj) {
        setLinkedTags(prev => prev.filter(tag => tag.id !== tagObj.id));
      }
      setTags(prev => prev.filter(tag => tag !== tagToRemove));
    } else {
      // We have the tag object directly
      setLinkedTags(prev => prev.filter(tag => tag.id !== tagToRemove.id));
      setTags(prev => prev.filter(tag => tag !== tagToRemove.name));
    }
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

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      
      setAttachmentFile(file);
      toast.info(`File "${file.name}" selected`);
    }
  };

  // Trigger file input click
  const handleAttachFileClick = () => {
    fileInputRef.current?.click();
  };

  // Remove attachment
  const handleRemoveAttachment = async () => {
    if (attachmentUrl && note?.id && !note.id.toString().startsWith("temp-")) {
      try {
        await deleteNoteAttachment(attachmentUrl);
      } catch (error) {
        console.error("Error deleting attachment:", error);
      }
    }
    
    setAttachmentFile(null);
    setAttachmentUrl(undefined);
    toast.success("Attachment removed");
  };

  // Upload attachment
  const uploadAttachment = async (noteId: string): Promise<string | undefined> => {
    if (!attachmentFile) {
      return attachmentUrl;
    }
    
    setIsUploading(true);
    
    try {
      const url = await uploadNoteAttachment(attachmentFile, noteId);
      if (url) {
        toast.success("File uploaded successfully");
        return url;
      } else {
        toast.error("Failed to upload file");
        return attachmentUrl;
      }
    } catch (error) {
      console.error("Error uploading attachment:", error);
      toast.error("Failed to upload file");
      return attachmentUrl;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }
    
    if (!editorRef.current) return;
    
    // Get content directly from the editor element
    const currentContent = editorRef.current.innerHTML;
    console.log('Saving content:', currentContent);
    
    let noteId = note?.id || Date.now().toString();
    // First upload attachment if there's a new file and the note has a real ID
    let newAttachmentUrl = attachmentUrl;
    
    // For existing notes, we can upload files directly
    if (!noteId.toString().startsWith("temp-") && attachmentFile) {
      newAttachmentUrl = await uploadAttachment(noteId);
    }
    
    const updatedNote: Note = {
      id: noteId,
      title,
      content: currentContent,
      tags,
      category,
      createdAt: note?.createdAt || new Date(),
      updatedAt: new Date(),
      attachment_url: newAttachmentUrl,
    };
    
    const savedNote = await onSave?.(updatedNote);
    
    if (savedNote) {
      console.log("Note saved successfully:", savedNote.id);
      console.log("Saved note content:", savedNote.content);
      
      // If this was a new note and we have an attachment to upload
      if ((noteId.toString().startsWith("temp-") || noteId !== savedNote.id) && attachmentFile) {
        // Upload the attachment with the new note ID
        const attachmentUrl = await uploadAttachment(savedNote.id);
        
        if (attachmentUrl) {
          // Update the note with the attachment URL
          const noteWithAttachment: Note = {
            ...savedNote,
            attachment_url: attachmentUrl,
          };
          
          // Save again with the attachment URL
          const finalSavedNote = await onSave?.(noteWithAttachment);
          if (finalSavedNote) {
            setAttachmentUrl(attachmentUrl);
            setAttachmentFile(null);
          }
        }
      } else {
        // For existing notes, the attachment URL is already set
        setAttachmentFile(null);
      }
      
      // Update the initial content reference after successful save
      initialContentRef.current = currentContent;
      
      // Update tag associations
      try {
        // First, identify previous and current tag ids
        const previousTagIds = linkedTags.map(t => t.id);
        
        // Get fresh tags data
        const currentTags = await getTagsForNote(savedNote.id);
        const currentTagIds = currentTags.map(t => t.id);
        
        // Find all tags that have been added to the note
        const tagsToAdd = linkedTags.filter(tag => !currentTagIds.includes(tag.id));
        
        // Find all tags that have been removed from the note
        const tagsToRemove = currentTags.filter(tag => !linkedTags.some(t => t.id === tag.id));
        
        console.log("Tags to add:", tagsToAdd);
        console.log("Tags to remove:", tagsToRemove);
        
        // Process removals
        for (const tag of tagsToRemove) {
          console.log(`Unlinking tag ${tag.name} from note ${savedNote.id}`);
          await unlinkTagFromNote(savedNote.id, tag.id);
        }
        
        // Process additions
        for (const tag of tagsToAdd) {
          console.log(`Linking tag ${tag.name} to note ${savedNote.id}`);
          await linkTagToNote(savedNote.id, tag.id);
        }
      } catch (error) {
        console.error("Error updating tag associations:", error);
        toast.error("Failed to update tag associations");
      }
      
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

  // Get tags not already selected
  const getAvailableTagsForSelection = () => {
    return availableTags.filter(tag => !linkedTags.some(t => t.id === tag.id));
  };

  // Function to get file name from URL
  const getFilenameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      // Decode URI components to handle special characters
      return decodeURIComponent(filename);
    } catch (error) {
      return "Attachment";
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
        
        {/* File Attachment Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Paperclip size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Attachment</span>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {attachmentFile ? (
              <Badge variant="secondary" className="px-3 py-1 text-sm gap-2">
                <FileIcon size={14} />
                {attachmentFile.name}
                <button 
                  onClick={() => setAttachmentFile(null)} 
                  className="opacity-70 hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </Badge>
            ) : attachmentUrl ? (
              <div className="flex gap-2 items-center">
                <Badge variant="secondary" className="px-3 py-1 text-sm gap-2">
                  <FileIcon size={14} />
                  {getFilenameFromUrl(attachmentUrl)}
                  <a 
                    href={attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="opacity-70 hover:opacity-100 ml-1"
                  >
                    <ExternalLink size={12} />
                  </a>
                </Badge>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove attachment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the file attachment from this note. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRemoveAttachment}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAttachFileClick}
                className="gap-2 h-8"
              >
                <Paperclip size={14} />
                Attach File
              </Button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (max 10MB)
          </div>
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <TagsIcon size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Tags</span>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {linkedTags.map(tag => (
              <Badge key={tag.id} variant="secondary" className="px-3 py-1 text-sm gap-2">
                {tag.name}
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
              
              {/* Tag Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <TagsIcon size={14} className="mr-1" />
                    Choose Tags
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-2">
                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-medium">Available Tags</div>
                    
                    {isLoadingTags ? (
                      <div className="text-sm text-muted-foreground py-2">Loading tags...</div>
                    ) : getAvailableTagsForSelection().length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">No additional tags available</div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {getAvailableTagsForSelection().map(tag => (
                          <Badge 
                            key={tag.id} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-secondary transition-colors px-3 py-1 flex items-center gap-1"
                            onClick={() => handleSelectTag(tag)}
                          >
                            <Plus size={10} />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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

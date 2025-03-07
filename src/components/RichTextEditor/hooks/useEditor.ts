import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Note, Token, Tag as TagType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { 
  fetchTokens, 
  linkTokenToNote, 
  unlinkTokenFromNote, 
  getTokensForNote 
} from "@/services/tokenService";
import { 
  fetchTags, 
  createTag, 
  getTagsForNote, 
  linkTagToNote, 
  unlinkTagFromNote 
} from "@/services/tagService";
import { 
  uploadNoteAttachment, 
  deleteNoteAttachment 
} from "@/services/supabaseService";

export const useEditor = (
  note?: Note,
  onSave?: (note: Note) => Promise<Note | null>,
  linkedTokens: Token[] = []
) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [summary, setSummary] = useState(note?.summary || "");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
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

  // Update state when note prop changes
  useEffect(() => {
    console.log("RichTextEditor: note changed", note);
    if (note) {
      setTitle(note.title || "");
      setTags(note.tags || []);
      setCategory(note.category || "General");
      setLastSaved(note.updatedAt || null);
      setSummary(note.summary || "");
      
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

  // Generate AI summary for the note content
  const generateSummary = async () => {
    if (!editorRef.current || !editorRef.current.innerHTML.trim()) {
      toast.error("Add some content to your note first");
      return;
    }

    try {
      setIsGeneratingSummary(true);
      
      const response = await supabase.functions.invoke('summarize-note', {
        body: {
          content: editorRef.current.innerHTML,
          maxLength: 150
        }
      });

      if (response.error) {
        console.error("Error generating summary:", response.error);
        toast.error("Failed to generate summary");
        return;
      }

      if (response.data?.summary) {
        setSummary(response.data.summary);
        toast.success("Summary generated");
      } else {
        toast.info("Couldn't generate a meaningful summary. Try adding more content.");
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsGeneratingSummary(false);
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
    
    // Store the current summary value before saving
    const currentSummary = summary;
    
    const updatedNote: Note = {
      id: noteId,
      title,
      content: currentContent,
      summary: currentSummary, // Use the stored summary value
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
      console.log("Saved note summary:", savedNote.summary);
      
      // Make sure we keep the summary after saving
      if (savedNote.summary) {
        setSummary(savedNote.summary);
      } else {
        // If for some reason the saved note doesn't have a summary, keep our current one
        setSummary(currentSummary);
      }
      
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

  return {
    title,
    setTitle,
    content,
    summary,
    setSummary,
    isGeneratingSummary,
    tags,
    tagInput,
    setTagInput,
    category,
    lastSaved,
    tokens,
    selectedTokens,
    isLoadingTokens,
    availableTags,
    isLoadingTags,
    linkedTags,
    attachmentFile,
    setAttachmentFile,
    attachmentUrl,
    isUploading,
    editorRef,
    fileInputRef,
    handleContentChange,
    generateSummary,
    execCommand,
    handleAddTag,
    handleSelectTag,
    handleRemoveTag,
    handleCategorySelect,
    handleTokenSelect,
    handleRemoveToken,
    handleFileChange,
    handleAttachFileClick,
    handleRemoveAttachment,
    handleSave,
    getAvailableTagsForSelection,
    getFilenameFromUrl
  };
};

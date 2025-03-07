
import React, { useState, useRef, useEffect } from "react";
import EditorHeader from "./EditorHeader";
import AttachmentSection from "./AttachmentSection";
import TokenSection from "./TokenSection";
import TagsSection from "./TagsSection";
import FormattingToolbar from "./FormattingToolbar";
import TableDialog from "./TableDialog";
import EditorContent from "./EditorContent";
import { useEditor } from "./hooks/useEditor";
import { Note, Tag, Token } from "@/types";

interface RichTextEditorProps {
  note: Note;
  onSave: (updatedNote: Partial<Note>) => void;
  onTitleChange: (title: string) => void;
  onCategoryChange: (category: string) => void;
  tokens: Token[];
  tags: Tag[];
  isLoadingTokens?: boolean;
  isLoadingTags?: boolean;
  isPrintMode?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  note,
  onSave,
  onTitleChange,
  onCategoryChange,
  tokens = [],
  tags = [],
  isLoadingTokens = false,
  isLoadingTags = false,
  isPrintMode = false,
}) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category || "");
  const [linkedTokens, setLinkedTokens] = useState<Token[]>(note.tokens || []);
  const [linkedTags, setLinkedTags] = useState<Tag[]>(note.tags?.map((tagName) => ({ id: tagName, name: tagName })) || []);
  const [tagInput, setTagInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const { execCommand, formatTableCells } = useEditor(editorRef);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      onSave({ content: newContent });
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onTitleChange(newTitle);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    onCategoryChange(newCategory);
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;

    // Check if tag already exists in linked tags
    const tagExists = linkedTags.some(
      (tag) => typeof tag === "string" 
        ? tag.toLowerCase() === tagInput.toLowerCase() 
        : tag.name.toLowerCase() === tagInput.toLowerCase()
    );

    if (!tagExists) {
      // Find if tag exists in the database
      const existingTag = tags.find(
        (tag) => tag.name.toLowerCase() === tagInput.toLowerCase()
      );

      if (existingTag) {
        setLinkedTags([...linkedTags, existingTag]);
      } else {
        // Create a new tag
        const newTag = { id: tagInput, name: tagInput };
        setLinkedTags([...linkedTags, newTag]);
      }

      // Update note with new tags
      const updatedTags = [...linkedTags, existingTag || { id: tagInput, name: tagInput }];
      onSave({ 
        tags: updatedTags.map(tag => typeof tag === "string" ? tag : tag.name) 
      });
    }

    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string | Tag) => {
    const tagId = typeof tagToRemove === "string" ? tagToRemove : tagToRemove.id;
    const updatedTags = linkedTags.filter(tag => 
      typeof tag === "string" ? tag !== tagId : tag.id !== tagId
    );
    setLinkedTags(updatedTags);
    onSave({ 
      tags: updatedTags.map(tag => typeof tag === "string" ? tag : tag.name) 
    });
  };
  
  const handleSelectTag = (tag: Tag) => {
    const tagExists = linkedTags.some(
      (t) => typeof t === "string" ? t === tag.id : t.id === tag.id
    );
    
    if (!tagExists) {
      const updatedTags = [...linkedTags, tag];
      setLinkedTags(updatedTags);
      onSave({ 
        tags: updatedTags.map(t => typeof t === "string" ? t : t.name) 
      });
    }
  };

  const getAvailableTagsForSelection = () => {
    return tags.filter(tag => 
      !linkedTags.some(linkedTag => 
        typeof linkedTag === "string" 
          ? linkedTag === tag.id 
          : linkedTag.id === tag.id
      )
    ).slice(0, 10); // Limit to 10 suggestions
  };

  const handleAddToken = () => {
    if (!tokenInput.trim()) return;

    // Check if token exists
    const token = tokens.find(
      t => t.symbol.toLowerCase() === tokenInput.toLowerCase() || 
           t.name.toLowerCase() === tokenInput.toLowerCase()
    );

    if (token) {
      const tokenExists = linkedTokens.some(t => t.id === token.id);
      
      if (!tokenExists) {
        const updatedTokens = [...linkedTokens, token];
        setLinkedTokens(updatedTokens);
      }
    }
    
    setTokenInput("");
  };

  const handleRemoveToken = (tokenId: string) => {
    const updatedTokens = linkedTokens.filter(token => token.id !== tokenId);
    setLinkedTokens(updatedTokens);
  };

  const handleTokenSelect = (tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;
    
    const tokenExists = linkedTokens.some(t => t.id === tokenId);
    if (!tokenExists) {
      setLinkedTokens([...linkedTokens, token]);
    }
  };

  const handleCreateTable = () => {
    let tableHTML = '<table class="border-collapse w-full my-4">';
    tableHTML += '<thead><tr>';
    
    // Create header row
    for (let j = 0; j < cols; j++) {
      tableHTML += '<th class="border border-border p-2 text-left">Header ' + (j + 1) + '</th>';
    }
    
    tableHTML += '</tr></thead><tbody>';
    
    // Create data rows
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHTML += '<td class="border border-border p-2">Cell ' + (i + 1) + '-' + (j + 1) + '</td>';
      }
      tableHTML += '</tr>';
    }
    
    tableHTML += '</tbody></table>';
    
    execCommand('insertHTML', tableHTML);
    setIsTableDialogOpen(false);
  };
  
  return (
    <div className={`flex flex-col ${isPrintMode ? '' : 'h-full'}`}>
      <EditorHeader 
        title={title}
        category={category}
        onTitleChange={handleTitleChange}
        onCategoryChange={handleCategoryChange}
        isPrintMode={isPrintMode}
      />
      
      {!isPrintMode && (
        <div className="flex-1 flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex-1 flex flex-col">
            <FormattingToolbar 
              execCommand={execCommand} 
              setIsTableDialogOpen={setIsTableDialogOpen}
              formatTableCells={formatTableCells}
            />
            
            <EditorContent 
              editorRef={editorRef} 
              handleContentChange={handleContentChange} 
            />
          </div>
          
          <div className="w-full md:w-56 lg:w-72 flex flex-col gap-4">
            <TokenSection
              tokens={tokens}
              selectedTokens={linkedTokens}
              handleTokenSelect={handleTokenSelect}
              handleRemoveToken={handleRemoveToken}
              isLoadingTokens={isLoadingTokens}
            />
            
            <TagsSection
              linkedTags={linkedTags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              handleAddTag={handleAddTag}
              handleRemoveTag={handleRemoveTag}
              handleSelectTag={handleSelectTag}
              isLoadingTags={isLoadingTags}
              getAvailableTagsForSelection={getAvailableTagsForSelection}
            />
            
            <AttachmentSection noteId={note.id} />
          </div>
        </div>
      )}
      
      {isPrintMode && (
        <div 
          className="rich-text-editor mt-4" 
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      )}
      
      <TableDialog 
        isOpen={isTableDialogOpen}
        onClose={() => setIsTableDialogOpen(false)}
        rows={rows}
        cols={cols}
        setRows={setRows}
        setCols={setCols}
        onCreateTable={handleCreateTable}
      />
    </div>
  );
};

export default RichTextEditor;

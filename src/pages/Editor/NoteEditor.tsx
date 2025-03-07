
import React from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { Note, Token, Tag } from "@/types";

interface NoteEditorProps {
  currentNote: Note;
  onSave: (updatedFields: Partial<Note>) => Promise<void>;
  linkedTokens: Token[];
  allTags: Tag[];
}

const NoteEditor: React.FC<NoteEditorProps> = ({ 
  currentNote, 
  onSave, 
  linkedTokens,
  allTags
}) => {
  // Handle title change
  const handleTitleChange = (title: string) => {
    onSave({ title });
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    onSave({ category });
  };

  // Convert tag IDs to tag objects
  const getTagObjects = () => {
    return currentNote.tags.map(tagId => {
      const foundTag = allTags.find(t => t.id === tagId);
      return foundTag || { id: tagId, name: tagId };
    });
  };

  return (
    <div className="flex-1">
      <RichTextEditor 
        title={currentNote.title}
        content={currentNote.content}
        category={currentNote.category || "General"}
        onTitleChange={handleTitleChange}
        onContentChange={(content) => onSave({ content })}
        onCategoryChange={handleCategoryChange}
        linkedTags={getTagObjects()}
        onTagsChange={(tags) => onSave({ tags: tags.map(t => typeof t === 'string' ? t : t.id) })}
        linkedTokens={linkedTokens}
        onTokensChange={(tokens) => onSave({ tokens })}
        noteId={currentNote.id}
        attachment_url={currentNote.attachment_url}
        onAttachmentChange={(url) => onSave({ attachment_url: url || undefined })}
      />
    </div>
  );
};

export default NoteEditor;

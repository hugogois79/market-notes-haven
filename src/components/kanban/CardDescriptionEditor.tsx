import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import DOMPurify from 'dompurify';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Undo,
  Redo,
  RemoveFormatting,
} from 'lucide-react';

interface CardDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/30">
      {/* Text formatting */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
        className="h-7 w-7 p-0"
      >
        <Bold className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
        className="h-7 w-7 p-0"
      >
        <Italic className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Underline"
        className="h-7 w-7 p-0"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strikethrough"
        className="h-7 w-7 p-0"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Headings */}
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Heading 1"
        className="h-7 w-7 p-0"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Heading 2"
        className="h-7 w-7 p-0"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="Heading 3"
        className="h-7 w-7 p-0"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Lists */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
        className="h-7 w-7 p-0"
      >
        <List className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered List"
        className="h-7 w-7 p-0"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Toggle>

      {/* Blockquote */}
      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Blockquote"
        className="h-7 w-7 p-0"
      >
        <Quote className="h-3.5 w-3.5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Table */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => {
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        }}
        aria-label="Insert Table"
        className="h-7 w-7 p-0"
      >
        <TableIcon className="h-3.5 w-3.5" />
      </Toggle>

      {/* Clear formatting */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        aria-label="Clear Formatting"
        className="h-7 w-7 p-0"
      >
        <RemoveFormatting className="h-3.5 w-3.5" />
      </Toggle>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Undo / Redo */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
        className="h-7 w-7 p-0"
      >
        <Undo className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
        className="h-7 w-7 p-0"
      >
        <Redo className="h-3.5 w-3.5" />
      </Toggle>
    </div>
  );
};

const CardDescriptionEditor: React.FC<CardDescriptionEditorProps> = ({
  value,
  onChange,
  placeholder = 'Add a more detailed description...',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Sanitize output
      const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'div', 'span', 'strong', 'em', 'u', 's',
          'h1', 'h2', 'h3',
          'ul', 'ol', 'li',
          'blockquote', 'code', 'pre',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'br', 'hr',
        ],
        ALLOWED_ATTR: ['class', 'style', 'colspan', 'rowspan', 'colwidth'],
      });
      onChange(sanitized);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
  });

  // Sync external value changes (e.g. when switching cards)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Only update if the content is genuinely different to avoid cursor jumps
      const editorEmpty = editor.getHTML() === '<p></p>';
      const valueEmpty = !value || value === '<p></p>';
      if (editorEmpty && valueEmpty) return;

      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div className="rounded-md border bg-background overflow-hidden card-description-editor">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <style>{`
        .card-description-editor .tiptap {
          min-height: 120px;
        }
        .card-description-editor .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .card-description-editor .tiptap table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.5rem 0;
        }
        .card-description-editor .tiptap table td,
        .card-description-editor .tiptap table th {
          border: 1px solid hsl(var(--border));
          padding: 0.25rem 0.5rem;
          min-width: 80px;
        }
        .card-description-editor .tiptap table th {
          background: hsl(var(--muted));
          font-weight: 600;
        }
        .card-description-editor .tiptap blockquote {
          border-left: 3px solid hsl(var(--border));
          padding-left: 0.75rem;
          margin: 0.5rem 0;
          color: hsl(var(--muted-foreground));
        }
        .card-description-editor .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .card-description-editor .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .card-description-editor .tiptap h1 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0.5rem 0;
        }
        .card-description-editor .tiptap h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.4rem 0;
        }
        .card-description-editor .tiptap h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0.3rem 0;
        }
        .card-description-editor .tiptap code {
          background: hsl(var(--muted));
          padding: 0.1rem 0.3rem;
          border-radius: 0.25rem;
          font-size: 0.85em;
        }
        .card-description-editor .tiptap pre {
          background: hsl(var(--muted));
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
          overflow-x: auto;
        }
        .card-description-editor .tiptap pre code {
          background: none;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default CardDescriptionEditor;

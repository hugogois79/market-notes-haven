
import React from "react";
import { List, ListOrdered, CheckSquare } from "lucide-react";
import ToolbarButton from "./ToolbarButton";

interface ListFormattingSectionProps {
  formatUnorderedList?: () => void;
  formatOrderedList?: () => void;
  insertCheckbox?: () => void;
  execCommand?: (command: string, value?: string) => void;
  editorRef?: React.RefObject<HTMLDivElement>;
}

const ListFormattingSection: React.FC<ListFormattingSectionProps> = ({
  formatUnorderedList,
  formatOrderedList,
  insertCheckbox,
  execCommand,
  editorRef
}) => {
  const handleBulletList = () => {
    if (formatUnorderedList) {
      formatUnorderedList();
    } else if (execCommand) {
      execCommand('insertUnorderedList');
    }
  };

  const handleNumberedList = () => {
    if (formatOrderedList) {
      formatOrderedList();
    } else if (execCommand) {
      execCommand('insertOrderedList');
    }
  };

  const handleCheckbox = () => {
    if (insertCheckbox) {
      insertCheckbox();
    } else if (execCommand) {
      execCommand('insertHTML', '<input type="checkbox" class="editor-checkbox" contenteditable="false"> <span>Checkbox item</span>');
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton 
        icon={List} 
        onClick={handleBulletList} 
        tooltip="Bullet List"
      />
      <ToolbarButton 
        icon={ListOrdered} 
        onClick={handleNumberedList} 
        tooltip="Numbered List"
      />
      {insertCheckbox && (
        <ToolbarButton 
          icon={CheckSquare} 
          onClick={handleCheckbox} 
          tooltip="Add Checkbox"
        />
      )}
    </div>
  );
};

export default ListFormattingSection;

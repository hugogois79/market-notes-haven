
import React from "react";
import { List, ListOrdered } from "lucide-react";
import ToolbarButton from "./ToolbarButton";

interface ListFormattingSectionProps {
  execCommand: (command: string, value?: string) => void;
  editorRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

const ListFormattingSection: React.FC<ListFormattingSectionProps> = ({
  execCommand,
  editorRef,
  className
}) => {
  const handleBulletList = () => {
    execCommand('insertUnorderedList');
  };

  const handleNumberedList = () => {
    execCommand('insertOrderedList');
  };

  return (
    <div className={`flex items-center gap-0.5 ${className || ''}`}>
      <ToolbarButton 
        icon={List} 
        onClick={handleBulletList} 
        tooltip="Bullet List"
        className="text-blue-500 hover:bg-blue-50"
      />
      <ToolbarButton 
        icon={ListOrdered} 
        onClick={handleNumberedList} 
        tooltip="Numbered List"
        className="text-blue-500 hover:bg-blue-50"
      />
    </div>
  );
};

export default ListFormattingSection;

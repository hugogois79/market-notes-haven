
import React from "react";
import ToolbarButton from "./ToolbarButton";
import ToolbarDivider from "./ToolbarDivider";
import { List, ListOrdered, Square } from "lucide-react";

interface ListFormattingSectionProps {
  formatUnorderedList: () => void;
  formatOrderedList: () => void;
  insertCheckbox: () => void;
}

const ListFormattingSection = ({
  formatUnorderedList,
  formatOrderedList,
  insertCheckbox
}: ListFormattingSectionProps) => {
  return (
    <>
      <ToolbarButton 
        icon={List} 
        onClick={formatUnorderedList} 
        tooltip="Bullet List" 
      />
      <ToolbarButton 
        icon={ListOrdered} 
        onClick={formatOrderedList} 
        tooltip="Numbered List" 
        className="text-emphasis"  // Add emphasis to improve visibility
      />
      <ToolbarButton 
        icon={Square} 
        onClick={insertCheckbox} 
        tooltip="Checkbox" 
      />
      <ToolbarDivider />
    </>
  );
};

export default ListFormattingSection;

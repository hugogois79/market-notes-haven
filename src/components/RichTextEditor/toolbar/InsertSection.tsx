import React, { useState } from "react";
import ToolbarButton from "./ToolbarButton";
import { Link, Image, Table, Text, SeparatorHorizontal, CheckSquare, List, ListOrdered } from "lucide-react";
import ImageUploader from "../components/ImageUploader";

interface InsertSectionProps {
  formatLink?: () => void;
  formatImage?: () => void;
  insertTable?: () => void;
  formatTableCells?: (alignment: string) => void;
  insertVerticalSeparator?: () => void;
  onInsertTable?: () => void;
  onInsertCheckbox?: () => void;
  onInsertSeparator?: () => void;
  formatNormalText?: () => void;
  formatUnorderedList?: () => void;
  formatOrderedList?: () => void;
}

const InsertSection: React.FC<InsertSectionProps> = ({
  formatLink,
  formatImage,
  insertTable,
  formatTableCells,
  insertVerticalSeparator,
  onInsertTable,
  onInsertCheckbox,
  onInsertSeparator,
  formatNormalText,
  formatUnorderedList,
  formatOrderedList
}) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  const handleInsertTable = () => {
    if (insertTable) {
      insertTable();
    } else if (onInsertTable) {
      onInsertTable();
    }
  };

  const handleInsertSeparator = () => {
    if (insertVerticalSeparator) {
      insertVerticalSeparator();
    } else if (onInsertSeparator) {
      onInsertSeparator();
    }
  };
  
  const handleImageButtonClick = () => {
    if (formatImage) {
      // If we're using the legacy method, just call it directly
      formatImage();
    } else {
      // Otherwise open our enhanced dialog
      setImageDialogOpen(true);
    }
  };
  
  const handleInsertImage = (url: string) => {
    if (url) {
      document.execCommand("insertImage", false, url);
    }
  };

  const handleBulletList = () => {
    if (formatUnorderedList) {
      formatUnorderedList();
    }
  };

  const handleNumberedList = () => {
    if (formatOrderedList) {
      formatOrderedList();
    }
  };

  return (
    <>
      <div className="flex items-center gap-0.5">
        {formatLink && <ToolbarButton icon={Link} onClick={formatLink} tooltip="Insert Link" />}
        <ToolbarButton icon={Image} onClick={handleImageButtonClick} tooltip="Insert Image" />
        <ToolbarButton icon={Table} onClick={handleInsertTable} tooltip="Insert Table" />
        {formatTableCells && (
          <ToolbarButton 
            icon={Text} 
            onClick={() => formatTableCells('left')}
            tooltip="Format Table Cells" 
          />
        )}
        <ToolbarButton 
          icon={SeparatorHorizontal} 
          onClick={handleInsertSeparator} 
          tooltip="Insert Separator (Alt+S)" 
        />
        {formatUnorderedList && (
          <ToolbarButton 
            icon={List} 
            onClick={handleBulletList}
            tooltip="Bullet List (Alt+U)" 
          />
        )}
        {formatOrderedList && (
          <ToolbarButton 
            icon={ListOrdered} 
            onClick={handleNumberedList}
            tooltip="Numbered List (Alt+O)" 
          />
        )}
        {formatNormalText && (
          <ToolbarButton 
            icon={Text} 
            onClick={formatNormalText}
            tooltip="Normal Text" 
          />
        )}
      </div>
      
      {/* Use our standalone ImageUploader component */}
      <ImageUploader
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onImageInsert={handleInsertImage}
      />
    </>
  );
};

export default InsertSection;

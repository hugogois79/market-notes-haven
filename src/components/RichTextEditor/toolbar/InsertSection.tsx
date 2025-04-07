import React from "react";
import ToolbarButton from "./ToolbarButton";
import { Link, Image, Table, Text, SeparatorVertical, CheckSquare } from "lucide-react";
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
}

const InsertSection: React.FC<InsertSectionProps> = ({
  formatLink,
  formatImage,
  insertTable,
  formatTableCells,
  insertVerticalSeparator,
  onInsertTable,
  onInsertCheckbox,
  onInsertSeparator
}) => {
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  
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
        <ToolbarButton icon={SeparatorVertical} onClick={handleInsertSeparator} tooltip="Insert Separator" />
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

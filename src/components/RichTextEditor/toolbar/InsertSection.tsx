
import React from "react";
import ToolbarButton from "./ToolbarButton";
import { Link, Image, Table, Text, SeparatorVertical, CheckSquare } from "lucide-react";

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

  return (
    <div className="flex items-center gap-0.5">
      {formatLink && <ToolbarButton icon={Link} onClick={formatLink} tooltip="Insert Link" />}
      {formatImage && <ToolbarButton icon={Image} onClick={formatImage} tooltip="Insert Image" />}
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
  );
};

export default InsertSection;

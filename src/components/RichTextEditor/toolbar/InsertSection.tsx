
import React from "react";
import ToolbarButton from "./ToolbarButton";
import { Link, Image, Table, Text, SeparatorVertical } from "lucide-react";

interface InsertSectionProps {
  formatLink: () => void;
  formatImage: () => void;
  insertTable: () => void;
  formatTableCells: (alignment: string) => void; // Updated to accept string parameter
  insertVerticalSeparator: () => void;
}

const InsertSection = ({
  formatLink,
  formatImage,
  insertTable,
  formatTableCells,
  insertVerticalSeparator
}: InsertSectionProps) => {
  return (
    <>
      <ToolbarButton icon={Link} onClick={formatLink} tooltip="Insert Link" />
      <ToolbarButton icon={Image} onClick={formatImage} tooltip="Insert Image" />
      <ToolbarButton icon={Table} onClick={insertTable} tooltip="Insert Table" />
      <ToolbarButton 
        icon={Text} 
        onClick={() => formatTableCells('left')} // Pass a default alignment
        tooltip="Format Table Cells" 
      />
      <ToolbarButton icon={SeparatorVertical} onClick={insertVerticalSeparator} tooltip="Insert Separator" />
    </>
  );
};

export default InsertSection;

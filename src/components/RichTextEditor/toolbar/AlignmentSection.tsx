
import React from "react";
import ToolbarButton from "./ToolbarButton";
import ToolbarDivider from "./ToolbarDivider";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface AlignmentSectionProps {
  formatAlignLeft: () => void;
  formatAlignCenter: () => void;
  formatAlignRight: () => void;
}

const AlignmentSection = ({
  formatAlignLeft,
  formatAlignCenter,
  formatAlignRight
}: AlignmentSectionProps) => {
  return (
    <>
      <ToolbarButton icon={AlignLeft} onClick={formatAlignLeft} tooltip="Align Left" />
      <ToolbarButton icon={AlignCenter} onClick={formatAlignCenter} tooltip="Align Center" />
      <ToolbarButton icon={AlignRight} onClick={formatAlignRight} tooltip="Align Right" />
      <ToolbarDivider />
    </>
  );
};

export default AlignmentSection;

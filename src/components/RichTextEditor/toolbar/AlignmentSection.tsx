
import React from "react";
import ToolbarButton from "./ToolbarButton";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";

interface AlignmentSectionProps {
  formatAlignLeft?: () => void;
  formatAlignCenter?: () => void;
  formatAlignRight?: () => void;
  formatAlignJustify?: () => void;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onAlignJustify?: () => void;
}

const AlignmentSection: React.FC<AlignmentSectionProps> = ({
  formatAlignLeft,
  formatAlignCenter,
  formatAlignRight,
  formatAlignJustify,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignJustify
}) => {
  const handleAlignLeft = () => {
    if (formatAlignLeft) {
      formatAlignLeft();
    } else if (onAlignLeft) {
      onAlignLeft();
    }
  };

  const handleAlignCenter = () => {
    if (formatAlignCenter) {
      formatAlignCenter();
    } else if (onAlignCenter) {
      onAlignCenter();
    }
  };

  const handleAlignRight = () => {
    if (formatAlignRight) {
      formatAlignRight();
    } else if (onAlignRight) {
      onAlignRight();
    }
  };

  const handleAlignJustify = () => {
    if (formatAlignJustify) {
      formatAlignJustify();
    } else if (onAlignJustify) {
      onAlignJustify();
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton icon={AlignLeft} onClick={handleAlignLeft} tooltip="Align Left" />
      <ToolbarButton icon={AlignCenter} onClick={handleAlignCenter} tooltip="Align Center" />
      <ToolbarButton icon={AlignRight} onClick={handleAlignRight} tooltip="Align Right" />
      <ToolbarButton icon={AlignJustify} onClick={handleAlignJustify} tooltip="Justify" />
    </div>
  );
};

export default AlignmentSection;

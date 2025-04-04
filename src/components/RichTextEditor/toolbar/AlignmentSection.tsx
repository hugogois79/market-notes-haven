
import React from "react";
import ToolbarButton from "./ToolbarButton";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface AlignmentSectionProps {
  formatAlignLeft?: () => void;
  formatAlignCenter?: () => void;
  formatAlignRight?: () => void;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
}

const AlignmentSection: React.FC<AlignmentSectionProps> = ({
  formatAlignLeft,
  formatAlignCenter,
  formatAlignRight,
  onAlignLeft,
  onAlignCenter,
  onAlignRight
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

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton icon={AlignLeft} onClick={handleAlignLeft} tooltip="Align Left" />
      <ToolbarButton icon={AlignCenter} onClick={handleAlignCenter} tooltip="Align Center" />
      <ToolbarButton icon={AlignRight} onClick={handleAlignRight} tooltip="Align Right" />
    </div>
  );
};

export default AlignmentSection;

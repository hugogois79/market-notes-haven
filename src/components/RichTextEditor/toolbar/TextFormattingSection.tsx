
import React from "react";
import ToolbarButton from "./ToolbarButton";
import ToolbarDivider from "./ToolbarDivider";
import { Bold, Italic, Underline, Strikethrough, Highlighter } from "lucide-react";

interface TextFormattingSectionProps {
  formatBold?: () => void;
  formatItalic?: () => void;
  underlineText?: () => void;
  formatStrikethrough?: () => void;
  highlightText?: () => void;
  boldText?: () => void;
  italicText?: () => void;
}

const TextFormattingSection: React.FC<TextFormattingSectionProps> = ({
  formatBold,
  formatItalic,
  underlineText,
  formatStrikethrough,
  highlightText,
  boldText,
  italicText
}) => {
  const handleBold = () => {
    if (formatBold) formatBold();
    else if (boldText) boldText();
  };

  const handleItalic = () => {
    if (formatItalic) formatItalic();
    else if (italicText) italicText();
  };

  const handleUnderline = () => {
    if (underlineText) underlineText();
  };

  const handleStrikethrough = () => {
    if (formatStrikethrough) formatStrikethrough();
  };

  const handleHighlight = () => {
    if (highlightText) highlightText();
  };

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton icon={Bold} onClick={handleBold} tooltip="Bold (Ctrl+B)" />
      <ToolbarButton icon={Italic} onClick={handleItalic} tooltip="Italic (Ctrl+I)" />
      <ToolbarButton icon={Underline} onClick={handleUnderline} tooltip="Underline (Ctrl+U)" />
      {formatStrikethrough && (
        <ToolbarButton icon={Strikethrough} onClick={handleStrikethrough} tooltip="Strikethrough" />
      )}
      {highlightText && (
        <ToolbarButton icon={Highlighter} onClick={handleHighlight} tooltip="Highlight Text" />
      )}
    </div>
  );
};

export default TextFormattingSection;

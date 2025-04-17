
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
  yellowUnderlineText?: () => void;
}

const TextFormattingSection: React.FC<TextFormattingSectionProps> = ({
  formatBold,
  formatItalic,
  underlineText,
  formatStrikethrough,
  highlightText,
  boldText,
  italicText,
  yellowUnderlineText
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

  const handleYellowUnderline = () => {
    if (yellowUnderlineText) yellowUnderlineText();
  };

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton icon={Bold} onClick={handleBold} tooltip="Bold (Alt+B)" />
      <ToolbarButton icon={Italic} onClick={handleItalic} tooltip="Italic (Alt+I)" />
      <ToolbarButton icon={Underline} onClick={handleUnderline} tooltip="Underline (Alt+U)" />
      {formatStrikethrough && (
        <ToolbarButton icon={Strikethrough} onClick={handleStrikethrough} tooltip="Strikethrough" />
      )}
      {highlightText && (
        <ToolbarButton icon={Highlighter} onClick={handleHighlight} tooltip="Highlight Text (Alt+H)" />
      )}
      {yellowUnderlineText && (
        <ToolbarButton 
          icon={Underline} 
          onClick={handleYellowUnderline} 
          tooltip="Yellow Underline (Alt+Y)" 
          className="text-orange-500" 
        />
      )}
    </div>
  );
};

export default TextFormattingSection;

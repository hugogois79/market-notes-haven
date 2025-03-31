
import React from "react";
import ToolbarButton from "./ToolbarButton";
import ToolbarDivider from "./ToolbarDivider";
import { Bold, Italic, Underline, Strikethrough, Highlighter } from "lucide-react";

interface TextFormattingSectionProps {
  formatBold: () => void;
  formatItalic: () => void;
  underlineText: () => void;
  formatStrikethrough: () => void;
  highlightText: () => void;
}

const TextFormattingSection = ({
  formatBold,
  formatItalic,
  underlineText,
  formatStrikethrough,
  highlightText
}: TextFormattingSectionProps) => {
  return (
    <>
      <ToolbarButton icon={Bold} onClick={formatBold} tooltip="Bold (Ctrl+B)" />
      <ToolbarButton icon={Italic} onClick={formatItalic} tooltip="Italic (Ctrl+I)" />
      <ToolbarButton icon={Underline} onClick={underlineText} tooltip="Underline (Ctrl+U)" />
      <ToolbarButton icon={Strikethrough} onClick={formatStrikethrough} tooltip="Strikethrough" />
      <ToolbarButton icon={Highlighter} onClick={highlightText} tooltip="Highlight Text" />
      <ToolbarDivider />
    </>
  );
};

export default TextFormattingSection;

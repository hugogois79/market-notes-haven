
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EditorHeaderProps {
  title: string;
  category: string;
  onTitleChange: (title: string) => void;
  onCategoryChange: (category: string) => void;
  isPrintMode?: boolean;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  category,
  onTitleChange,
  onCategoryChange,
  isPrintMode = false,
}) => {
  // Create a separate handler for title changes to ensure events are processed correctly
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Title changed to:", e.target.value);
    // Ensure the value is passed directly to the parent component
    onTitleChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      {isPrintMode ? (
        <h1 className="text-2xl font-bold">{title}</h1>
      ) : (
        <div>
          <Label htmlFor="title" className="text-sm font-medium">
            Title
          </Label>
          <Input
            id="title"
            value={title || ""}
            onChange={handleTitleChange}
            placeholder="Note title"
            className="text-lg font-medium"
            autoFocus
          />
        </div>
      )}

      {!isPrintMode && (
        <div>
          <Label htmlFor="category" className="text-sm font-medium">
            Category
          </Label>
          <Select
            value={category}
            onValueChange={onCategoryChange}
          >
            <SelectTrigger id="category" className="w-full md:w-60">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Research">Research</SelectItem>
              <SelectItem value="Ideas">Ideas</SelectItem>
              <SelectItem value="Analysis">Analysis</SelectItem>
              <SelectItem value="Project">Project</SelectItem>
              <SelectItem value="Meeting">Meeting</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default EditorHeader;

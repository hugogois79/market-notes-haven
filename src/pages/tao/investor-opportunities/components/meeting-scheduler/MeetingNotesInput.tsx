
import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface MeetingNotesInputProps {
  notes: string;
  onNotesChange: (value: string) => void;
}

const MeetingNotesInput: React.FC<MeetingNotesInputProps> = ({
  notes,
  onNotesChange,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Meeting Notes</label>
      <Textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Add agenda items or other notes..."
        rows={3}
      />
    </div>
  );
};

export default MeetingNotesInput;

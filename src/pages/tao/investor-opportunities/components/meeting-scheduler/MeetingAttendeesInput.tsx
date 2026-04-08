
import React from "react";
import { Input } from "@/components/ui/input";

interface MeetingAttendeesInputProps {
  attendees: string;
  onAttendeesChange: (value: string) => void;
}

const MeetingAttendeesInput: React.FC<MeetingAttendeesInputProps> = ({
  attendees,
  onAttendeesChange,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Attendees (comma separated)</label>
      <Input
        value={attendees}
        onChange={(e) => onAttendeesChange(e.target.value)}
        placeholder="e.g. John Doe, Jane Smith"
      />
    </div>
  );
};

export default MeetingAttendeesInput;


import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface MeetingTimeSelectorProps {
  time: string;
  onTimeChange: (value: string) => void;
}

const MeetingTimeSelector: React.FC<MeetingTimeSelectorProps> = ({
  time,
  onTimeChange,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Time</label>
      <Select
        value={time}
        onValueChange={onTimeChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="09:00">9:00 AM</SelectItem>
          <SelectItem value="10:00">10:00 AM</SelectItem>
          <SelectItem value="11:00">11:00 AM</SelectItem>
          <SelectItem value="13:00">1:00 PM</SelectItem>
          <SelectItem value="14:00">2:00 PM</SelectItem>
          <SelectItem value="15:00">3:00 PM</SelectItem>
          <SelectItem value="16:00">4:00 PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default MeetingTimeSelector;

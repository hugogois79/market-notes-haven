
import React from 'react';
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerFieldProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({ date, onDateChange }) => {
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="date">Contact Date</Label>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {format(date, "PPP")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              if (newDate) {
                onDateChange(newDate);
                setCalendarOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerField;

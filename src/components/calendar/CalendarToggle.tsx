import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CalendarToggleProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export default function CalendarToggle({ isActive, onClick, className }: CalendarToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="icon"
          onClick={onClick}
          className={cn(
            "h-9 w-9 transition-colors",
            isActive && "bg-primary text-primary-foreground",
            className
          )}
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{isActive ? "Esconder calendário" : "Mostrar calendário"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

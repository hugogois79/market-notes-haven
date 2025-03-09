
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
  isExpanded: boolean;
  toggleExpand: () => void;
  isMobile: boolean;
}

export const SidebarHeader = ({ isExpanded, toggleExpand, isMobile }: SidebarHeaderProps) => {
  return (
    <div className={cn(
      "p-4 border-b border-border/50 flex items-center justify-between",
      isExpanded ? "px-6" : "px-4"
    )}>
      {isExpanded && (
        <div className="font-semibold text-xl">Navigation</div>
      )}
      
      {!isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            // Prevent event bubbling
            e.stopPropagation();
            toggleExpand();
          }}
          className="text-secondary-foreground hover:bg-blue-700/50"
        >
          {isExpanded ? 
            <ChevronLeft size={20} /> : 
            <ChevronRight size={20} />
          }
        </Button>
      )}
    </div>
  );
};


import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewNoteButtonProps {
  isExpanded: boolean;
  isMobile: boolean;
  onMobileClose: () => void;
}

export const NewNoteButton = ({ isExpanded, isMobile, onMobileClose }: NewNoteButtonProps) => {
  return (
    <div className={cn("p-4", isExpanded ? "px-4" : "px-3")}>
      <Link to="/editor/new" onClick={() => isMobile && onMobileClose()}>
        <Button 
          className={cn(
            "bg-brand text-white hover:bg-brand-dark flex items-center gap-2 w-full",
            !isExpanded && "justify-center px-0"
          )}
        >
          <Plus size={18} />
          {isExpanded && <span>New Note</span>}
        </Button>
      </Link>
    </div>
  );
};

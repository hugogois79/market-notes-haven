
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  isExpanded: boolean;
  isMobile: boolean;
  onMobileClose: () => void;
}

export const SidebarFooter = ({ isExpanded, isMobile, onMobileClose }: SidebarFooterProps) => {
  return (
    <div className={cn(
      "p-4 border-t border-border/50 space-y-4",
      !isExpanded && "px-3"
    )}>
      {/* Logo near settings */}
      {isExpanded ? (
        <div className="flex items-center gap-3 px-3 py-2.5">
          <span className="font-bold text-xl tracking-tight text-brand">GVVC</span>
          <span className="font-semibold">MarketNotes</span>
        </div>
      ) : (
        <div className="flex items-center justify-center py-2.5">
          <span className="font-bold text-xl tracking-tight text-brand">GV</span>
        </div>
      )}
      
      <Link
        to="/settings"
        onClick={() => isMobile && onMobileClose()}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-brand",
          "text-[#9F9EA1]", // Lighter silver color from context
          !isExpanded && "justify-center px-2"
        )}
        title={!isExpanded ? "Settings" : ""}
      >
        <Settings size={20} />
        {isExpanded && <span>Settings</span>}
      </Link>
    </div>
  );
};

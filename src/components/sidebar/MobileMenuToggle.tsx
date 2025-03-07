
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuToggleProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const MobileMenuToggle = ({ isOpen, toggleSidebar }: MobileMenuToggleProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border/50"
      onClick={toggleSidebar}
    >
      {isOpen ? <X size={20} /> : <Menu size={20} />}
    </Button>
  );
};

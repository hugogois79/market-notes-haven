import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  SidebarHeader, 
  SidebarNav, 
  SidebarFooter,
  NewNoteButton,
  MobileMenuToggle
} from "@/components/sidebar";

const Sidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Effect to handle hover state changes
  useEffect(() => {
    if (isHovering && !isExpanded && !isMobile) {
      const timer = setTimeout(() => {
        setIsExpanded(true);
      }, 300); // Delay expansion to prevent flicker
      
      return () => clearTimeout(timer);
    }
  }, [isHovering, isExpanded, isMobile]);

  // Handle mouse enter/leave for desktop
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovering(false);
      if (!isExpanded) {
        // Keep collapsed if it was collapsed manually
        setIsExpanded(false);
      }
    }
  };

  return (
    <>
      {/* Mobile menu toggle */}
      {isMobile && <MobileMenuToggle isOpen={isOpen} toggleSidebar={toggleSidebar} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen bg-brand-dark text-secondary-foreground flex flex-col border-r border-border transition-all duration-300 ease-in-out z-40",
          isMobile
            ? isOpen
              ? "fixed inset-y-0 left-0 animate-slide-in-left w-72"
              : "fixed inset-y-0 -left-80 w-72"
            : isExpanded
              ? "fixed left-0 top-0 w-72"
              : "fixed left-0 top-0 w-20"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Navigation header */}
        <SidebarHeader 
          isExpanded={isExpanded} 
          toggleExpand={toggleExpand} 
          isMobile={isMobile} 
        />

        {/* New note button */}
        <NewNoteButton 
          isExpanded={isExpanded} 
          isMobile={isMobile} 
          onMobileClose={() => setIsOpen(false)} 
        />

        {/* Navigation */}
        <SidebarNav 
          isExpanded={isExpanded} 
          isMobile={isMobile} 
          onMobileClose={() => setIsOpen(false)} 
        />

        {/* Bottom area with logo and settings */}
        <SidebarFooter 
          isExpanded={isExpanded} 
          isMobile={isMobile} 
          onMobileClose={() => setIsOpen(false)} 
        />
      </aside>
    </>
  );
};

export default Sidebar;

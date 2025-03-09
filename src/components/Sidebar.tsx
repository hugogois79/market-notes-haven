
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
  const [expandedByHover, setExpandedByHover] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Effect to handle hover state changes
  useEffect(() => {
    let timer: number | null = null;
    
    if (isHovering && !isExpanded && !isMobile) {
      // Expand when hovering over collapsed sidebar - with 3 seconds delay
      timer = window.setTimeout(() => {
        setIsExpanded(true);
        setExpandedByHover(true); // Mark as expanded by hover
      }, 3000); // 3 second delay before expansion
    } else if (!isHovering && expandedByHover && !isMobile) {
      // Only collapse if it was expanded due to hover
      timer = window.setTimeout(() => {
        // Check if user is still not hovering before collapsing
        if (!isHovering) {
          setIsExpanded(false);
          setExpandedByHover(false);
        }
      }, 300);
    }
    
    // Dispatch custom event for layout adjustments
    const event = new CustomEvent('sidebar-resize', { 
      detail: { expanded: isExpanded } 
    });
    window.dispatchEvent(event);
    
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [isHovering, isExpanded, expandedByHover, isMobile]);

  // Handle mouse enter/leave for desktop
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovering(false);
    }
  };

  // Track manual expansions vs hover-triggered ones
  const handleManualToggle = () => {
    // This is called when user explicitly clicks the toggle button
    setExpandedByHover(false); // Reset the hover state
    setIsExpanded(!isExpanded); // Toggle the expanded state manually
  };

  return (
    <>
      {/* Mobile menu toggle */}
      {isMobile && <MobileMenuToggle isOpen={isOpen} toggleSidebar={toggleSidebar} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen bg-[#0A3A5C] text-white flex flex-col border-r border-border transition-all duration-300 ease-in-out z-40",
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
          toggleExpand={handleManualToggle} 
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

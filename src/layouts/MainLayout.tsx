import Sidebar from "@/components/Sidebar";
import { useState, ReactNode, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Outlet, useLocation } from "react-router-dom";
import { useCalendarWidgetSettings } from "@/hooks/useCalendarWidgetSettings";
import DailyCalendarWidget from "@/components/calendar/DailyCalendarWidget";
import CalendarToggle from "@/components/calendar/CalendarToggle";
import { TooltipProvider } from "@/components/ui/tooltip";

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { isVisible: calendarWidgetVisible, toggle: toggleCalendarWidget, hide: hideCalendarWidget } = useCalendarWidgetSettings();

  // Only show widget on kanban board pages
  const isKanbanBoard = /^\/kanban\/[^/]+$/.test(location.pathname);

  useEffect(() => {
    const handleSidebarResize = (e: CustomEvent) => {
      setSidebarExpanded(e.detail.expanded);
    };

    window.addEventListener('sidebar-resize' as any, handleSidebarResize);
    
    return () => {
      window.removeEventListener('sidebar-resize' as any, handleSidebarResize);
    };
  }, []);

  // Hide widget on mobile or if not on kanban board page
  const showWidget = calendarWidgetVisible && !isMobile && isKanbanBoard;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background overflow-hidden w-full">
        <div className={`transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden md:block'} fixed left-0 top-0 h-full z-40`}>
          <Sidebar />
        </div>
        
        <div className={`flex-1 flex flex-col w-full transition-all duration-300 ${
          sidebarOpen ? 
            (isMobile ? 'md:ml-80' : (sidebarExpanded ? 'md:ml-80' : 'md:ml-24')) 
            : 'ml-0'
        }`}>
          {/* Calendar toggle button - fixed position, only on kanban board pages */}
          {!isMobile && isKanbanBoard && (
            <div className="fixed top-4 right-4 z-50">
              <CalendarToggle
                isActive={calendarWidgetVisible}
                onClick={toggleCalendarWidget}
              />
            </div>
          )}
          
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto w-full">
              {children || <Outlet />}
            </main>
            
            {/* Calendar Widget */}
            {showWidget && (
              <div className="h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out animate-in slide-in-from-right">
                <DailyCalendarWidget onClose={hideCalendarWidget} />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MainLayout;

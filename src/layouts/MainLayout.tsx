
import Sidebar from "@/components/Sidebar";
import { useState, ReactNode, useEffect } from "react";
import UserProfileButton from "@/components/UserProfileButton";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Listen for changes in the sidebar expanded/collapsed state
  useEffect(() => {
    const handleSidebarResize = (e: CustomEvent) => {
      setSidebarExpanded(e.detail.expanded);
    };

    window.addEventListener('sidebar-resize' as any, handleSidebarResize);
    
    return () => {
      window.removeEventListener('sidebar-resize' as any, handleSidebarResize);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background overflow-hidden w-full">
      <div className={`transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden md:block'} fixed left-0 top-0 h-full z-40`}>
        <Sidebar />
      </div>
      
      <div className={`flex-1 flex flex-col w-full transition-all duration-300 ${
        sidebarOpen ? 
          (isMobile ? 'md:ml-80' : (sidebarExpanded ? 'md:ml-80' : 'md:ml-24')) 
          : 'ml-0'
      }`}>
        <header className="h-14 px-4 border-b flex items-center justify-end">
          <div className="flex items-center">
            <UserProfileButton />
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

import Sidebar from "@/components/Sidebar";
import { useState, ReactNode, useEffect } from "react";
import UserProfileButton from "@/components/UserProfileButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const handleSidebarResize = (e: CustomEvent) => {
      setSidebarExpanded(e.detail.expanded);
    };

    window.addEventListener('sidebar-resize' as any, handleSidebarResize);
    
    return () => {
      window.removeEventListener('sidebar-resize' as any, handleSidebarResize);
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Register service worker for basic offline functionality
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service worker registered:', registration);
          })
          .catch(err => {
            console.error('Service worker registration failed:', err);
          });
      });
      
      window.addEventListener('online', () => {
        toast.success('You are back online');
      });
      
      window.addEventListener('offline', () => {
        toast.warning('You are offline. Some features may be limited.');
      });
    }
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
        <header className="h-14 px-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            
          </div>
          <div className="flex items-center gap-2">
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

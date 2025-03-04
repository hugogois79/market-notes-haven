
import Sidebar from "@/components/Sidebar";
import { useState, ReactNode } from "react";
import UserProfileButton from "@/components/UserProfileButton";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-background overflow-hidden w-full">
      <div className={`transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden md:block'} fixed left-0 top-0 h-full z-40`}>
        <Sidebar />
      </div>
      
      <div className={`flex-1 flex flex-col w-full ${sidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        <header className="h-14 px-4 border-b flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center">
            <UserProfileButton />
          </div>
        </header>
        
        <main className="flex-1 p-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

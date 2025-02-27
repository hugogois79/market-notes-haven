
import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const isEditorPage = location.pathname.startsWith("/editor");
  const isSettingsPage = location.pathname === "/settings";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <main 
        className={cn(
          "flex-1 overflow-y-auto transition-all duration-300 animate-fade-in",
          isEditorPage ? "p-2 md:p-4" : isSettingsPage ? "p-0" : "p-4 md:p-6"
        )}
      >
        <div className="mx-auto max-w-7xl h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

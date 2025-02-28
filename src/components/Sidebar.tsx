
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Tags, 
  TrendingUp, 
  Settings, 
  Plus, 
  Menu, 
  X,
  Coins,
  LineChart,
  Folder
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const Sidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/",
    },
    {
      title: "All Notes",
      icon: <FileText size={20} />,
      path: "/notes",
    },
    {
      title: "Categories",
      icon: <Folder size={20} />,
      path: "/categories",
    },
    {
      title: "Tags",
      icon: <Tags size={20} />,
      path: "/tags",
    },
    {
      title: "Market Data",
      icon: <TrendingUp size={20} />,
      path: "/market-data",
    },
    {
      title: "Crypto Assets",
      icon: <Coins size={20} />,
      path: "/crypto",
    },
    {
      title: "Analytics",
      icon: <LineChart size={20} />,
      path: "/analytics",
    },
  ];

  return (
    <>
      {/* Mobile menu toggle */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border/50"
          onClick={toggleSidebar}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out z-40",
          isMobile
            ? isOpen
              ? "fixed inset-y-0 left-0 w-72 animate-slide-in-left"
              : "fixed inset-y-0 -left-80 w-72"
            : "w-72"
        )}
      >
        {/* Navigation header - without logo */}
        <div className="p-6 border-b border-sidebar-border/50">
          <div className="font-semibold text-xl">Navigation</div>
        </div>

        {/* New note button */}
        <div className="p-4">
          <Link to="/editor/new" onClick={() => isMobile && setIsOpen(false)}>
            <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 flex items-center gap-2">
              <Plus size={18} />
              <span>New Note</span>
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                    location.pathname === item.path
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom area with logo and settings */}
        <div className="p-4 border-t border-sidebar-border/50 space-y-4">
          {/* Logo near settings */}
          <Link to="/" className="flex items-center gap-2 px-3 py-2.5" onClick={() => isMobile && setIsOpen(false)}>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground p-1.5 rounded">
              <FileText size={24} />
            </div>
            <span className="font-semibold">MarketNotes</span>
          </Link>
          
          <Link
            to="/settings"
            onClick={() => isMobile && setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

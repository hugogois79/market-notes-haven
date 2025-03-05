import { useState, useEffect } from "react";
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
  Folder,
  Banknote,
  User,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
      title: "Tokens",
      icon: <Banknote size={20} />,
      path: "/tokens",
    },
    {
      title: "Market Data",
      icon: <TrendingUp size={20} />,
      path: "/market-data",
    },
    {
      title: "Crypto Assets",
      icon: <Coins size={20} />,
      path: "/crypto/dashboard",
    },
    {
      title: "Analytics",
      icon: <LineChart size={20} />,
      path: "/analytics",
    },
    {
      title: "Profile",
      icon: <User size={20} />,
      path: "/profile",
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
        <div className={cn(
          "p-4 border-b border-sidebar-border/50 flex items-center justify-between",
          isExpanded ? "px-6" : "px-4"
        )}>
          {isExpanded && (
            <div className="font-semibold text-xl">Navigation</div>
          )}
          
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleExpand}
              className="text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              {isExpanded ? 
                <ChevronLeft size={20} /> : 
                <ChevronRight size={20} />
              }
            </Button>
          )}
        </div>

        {/* New note button */}
        <div className={cn("p-4", isExpanded ? "px-4" : "px-3")}>
          <Link to="/editor/new" onClick={() => isMobile && setIsOpen(false)}>
            <Button 
              className={cn(
                "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 flex items-center gap-2 w-full",
                !isExpanded && "justify-center px-0"
              )}
            >
              <Plus size={18} />
              {isExpanded && <span>New Note</span>}
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
                    !isExpanded && "justify-center px-2",
                    location.pathname === item.path
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  title={!isExpanded ? item.title : ""}
                >
                  {item.icon}
                  {isExpanded && <span>{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom area with logo and settings */}
        <div className={cn(
          "p-4 border-t border-sidebar-border/50 space-y-4",
          !isExpanded && "px-3"
        )}>
          {/* Logo near settings */}
          {isExpanded ? (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="font-bold text-xl tracking-tight text-primary">GVVC</span>
              <span className="font-semibold">MarketNotes</span>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2.5">
              <span className="font-bold text-xl tracking-tight text-primary">GV</span>
            </div>
          )}
          
          <Link
            to="/settings"
            onClick={() => isMobile && setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              !isExpanded && "justify-center px-2"
            )}
            title={!isExpanded ? "Settings" : ""}
          >
            <Settings size={20} />
            {isExpanded && <span>Settings</span>}
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

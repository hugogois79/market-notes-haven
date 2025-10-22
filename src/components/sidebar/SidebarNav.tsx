
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Tags, 
  TrendingUp, 
  Coins,
  LineChart,
  Folder,
  Banknote,
  User,
  Kanban,
  ChevronDown,
  ChevronRight,
  Plus,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { KanbanService } from "@/services/kanbanService";

type NavItem = {
  title: string;
  icon: React.ReactNode;
  path: string;
};

interface SidebarNavProps {
  isExpanded: boolean;
  isMobile: boolean;
  onMobileClose: () => void;
}

export const SidebarNav = ({ isExpanded, isMobile, onMobileClose }: SidebarNavProps) => {
  const location = useLocation();
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [boards, setBoards] = useState<any[]>([]);

  useEffect(() => {
    const fetchBoards = async () => {
      const fetchedBoards = await KanbanService.getBoards();
      setBoards(fetchedBoards);
    };
    fetchBoards();
  }, []);

  const navItems: NavItem[] = [
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
      title: "Receipt Generator",
      icon: <FileText size={20} />,
      path: "/receipt-generator",
    },
    {
      title: "Financeiro",
      icon: <Coins size={20} />,
      path: "/financeiro",
    },
    {
      title: "Expenses",
      icon: <FileCheck size={20} />,
      path: "/expenses",
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
      title: "Bittensor TAO",
      icon: (
        <div className="flex items-center justify-center rounded-full w-5 h-5">
          <img 
            src="/lovable-uploads/5bace84a-516c-4734-a925-c14b4b49b2a3.png" 
            alt="Bittensor TAO" 
            className="w-full h-full object-contain"
          />
        </div>
      ),
      path: "/tao",
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
    <nav className="flex-1 overflow-y-auto py-4 px-3">
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={() => isMobile && onMobileClose()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                !isExpanded && "justify-center px-2",
                location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                  ? "bg-brand/20 text-brand font-medium"
                  : "text-white hover:bg-white/10 hover:text-brand"
              )}
              title={!isExpanded ? item.title : ""}
            >
              {item.icon}
              {isExpanded && <span>{item.title}</span>}
            </Link>
          </li>
        ))}
        
        {/* Project Boards Expandable Section */}
        <li>
          <button
            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
              !isExpanded && "justify-center px-2",
              location.pathname.startsWith('/kanban')
                ? "bg-brand/20 text-brand font-medium"
                : "text-white hover:bg-white/10 hover:text-brand"
            )}
            title={!isExpanded ? "Project Boards" : ""}
          >
            <Kanban size={20} />
            {isExpanded && (
              <>
                <span className="flex-1 text-left">Project Boards</span>
                {isProjectsExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </>
            )}
          </button>
          
          {isExpanded && isProjectsExpanded && (
            <ul className="ml-4 mt-1 space-y-1">
              {boards.map((board) => (
                <li key={board.id}>
                  <Link
                    to={`/kanban/${board.id}`}
                    onClick={() => isMobile && onMobileClose()}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                      location.pathname === `/kanban/${board.id}`
                        ? "bg-brand/20 text-brand font-medium"
                        : "text-white/80 hover:bg-white/10 hover:text-brand"
                    )}
                  >
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: board.color || '#0a4a6b' }}
                    />
                    <span className="truncate">{board.title}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/kanban"
                  onClick={() => isMobile && onMobileClose()}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                    "text-white/60 hover:bg-white/10 hover:text-brand"
                  )}
                >
                  <Plus size={16} />
                  <span>New Board</span>
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </nav>
  );
};

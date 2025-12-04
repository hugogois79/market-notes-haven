import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Tags, 
  TrendingUp, 
  Coins,
  Folder,
  Banknote,
  User,
  Kanban,
  ChevronDown,
  ChevronRight,
  Plus,
  FileCheck,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { KanbanService } from "@/services/kanbanService";
import { useUserRole } from "@/hooks/useUserRole";

type NavItem = {
  title: string;
  icon: React.ReactNode;
  path: string;
  workerAllowed?: boolean;
};

interface SidebarNavProps {
  isExpanded: boolean;
  isMobile: boolean;
  onMobileClose: () => void;
}

export const SidebarNav = ({ isExpanded, isMobile, onMobileClose }: SidebarNavProps) => {
  const location = useLocation();
  const { isWorker, loading: roleLoading } = useUserRole();
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [spaces, setSpaces] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);

  useEffect(() => {
    // Don't fetch boards for workers
    if (isWorker) return;
    
    const fetchData = async () => {
      const [fetchedSpaces, fetchedBoards] = await Promise.all([
        KanbanService.getSpaces(),
        KanbanService.getBoards()
      ]);
      setSpaces(fetchedSpaces);
      setBoards(fetchedBoards);
    };
    fetchData();
  }, [isWorker]);

  const toggleSpace = (spaceId: string) => {
    const newExpanded = new Set(expandedSpaces);
    if (newExpanded.has(spaceId)) {
      newExpanded.delete(spaceId);
    } else {
      newExpanded.add(spaceId);
    }
    setExpandedSpaces(newExpanded);
  };

  const unorganizedBoards = boards.filter(b => !b.space_id && !b.archived);
  const boardsBySpace = spaces.reduce((acc, space) => {
    acc[space.id] = boards.filter(b => b.space_id === space.id && !b.archived);
    return acc;
  }, {} as Record<string, any[]>);

  const allNavItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/",
      workerAllowed: false,
    },
    {
      title: "All Notes",
      icon: <FileText size={20} />,
      path: "/notes",
      workerAllowed: false,
    },
    {
      title: "Categories",
      icon: <Folder size={20} />,
      path: "/categories",
      workerAllowed: false,
    },
    {
      title: "Tags",
      icon: <Tags size={20} />,
      path: "/tags",
      workerAllowed: false,
    },
    {
      title: "Tokens",
      icon: <Banknote size={20} />,
      path: "/tokens",
      workerAllowed: false,
    },
    {
      title: "Receipt Generator",
      icon: <FileText size={20} />,
      path: "/receipt-generator",
      workerAllowed: false,
    },
    {
      title: "Finance",
      icon: <Coins size={20} />,
      path: "/financeiro",
      workerAllowed: false,
    },
    {
      title: "Expenses",
      icon: <FileCheck size={20} />,
      path: "/expenses",
      workerAllowed: true,
    },
    {
      title: "Legal",
      icon: <Scale size={20} />,
      path: "/legal",
      workerAllowed: false,
    },
    {
      title: "Market Data",
      icon: <TrendingUp size={20} />,
      path: "/market-data",
      workerAllowed: false,
    },
    {
      title: "Crypto Assets",
      icon: <Coins size={20} />,
      path: "/crypto/dashboard",
      workerAllowed: false,
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
      workerAllowed: false,
    },
    {
      title: "Profile",
      icon: <User size={20} />,
      path: "/profile",
      workerAllowed: true,
    },
  ];

  // Filter nav items based on role
  const navItems = useMemo(() => {
    if (roleLoading) return [];
    if (isWorker) {
      return allNavItems.filter(item => item.workerAllowed);
    }
    return allNavItems;
  }, [isWorker, roleLoading]);

  // Don't show boards section for workers
  const showBoardsSection = !isWorker;

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
        
        {/* Project Boards with Spaces - Only for non-workers */}
        {showBoardsSection && (
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
              title={!isExpanded ? "Boards" : ""}
            >
              <Kanban size={20} />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left">Boards</span>
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
                {/* Spaces with nested boards */}
                {spaces.map((space) => (
                  <li key={space.id}>
                    <button
                      onClick={() => toggleSpace(space.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm text-white/80 hover:bg-white/10 hover:text-brand"
                    >
                      <div 
                        className="w-2 h-2 rounded" 
                        style={{ backgroundColor: space.color || '#0a4a6b' }}
                      />
                      <span className="truncate flex-1 text-left">{space.title}</span>
                      {expandedSpaces.has(space.id) ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                    
                    {expandedSpaces.has(space.id) && boardsBySpace[space.id]?.length > 0 && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {boardsBySpace[space.id].map((board: any) => (
                          <li key={board.id}>
                            <Link
                              to={`/kanban/${board.id}`}
                              onClick={() => isMobile && onMobileClose()}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                location.pathname === `/kanban/${board.id}`
                                  ? "bg-brand/20 text-brand font-medium"
                                  : "text-white/70 hover:bg-white/10 hover:text-brand"
                              )}
                            >
                              <div 
                                className="w-1.5 h-1.5 rounded-full" 
                                style={{ backgroundColor: board.color || '#0a4a6b' }}
                              />
                              <span className="truncate">{board.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                
                {/* Unorganized boards */}
                {unorganizedBoards.length > 0 && (
                  <>
                    {spaces.length > 0 && (
                      <li className="text-xs text-white/40 px-3 py-2">Unorganized</li>
                    )}
                    {unorganizedBoards.map((board) => (
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
                  </>
                )}
                
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
                    <span>Manage Boards</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
};

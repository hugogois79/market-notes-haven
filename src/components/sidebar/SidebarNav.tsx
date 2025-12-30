import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Coins,
  Banknote,
  User,
  Kanban,
  ChevronDown,
  ChevronRight,
  Plus,
  FileCheck,
  Scale,
  LineChart,
  CalendarDays,
  Building2,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { KanbanService } from "@/services/kanbanService";
import { useUserRole } from "@/hooks/useUserRole";
import { useFeatureAccess, FeaturePermissions } from "@/hooks/useFeatureAccess";

type NavItem = {
  title: string;
  icon: React.ReactNode;
  path: string;
  workerAllowed?: boolean;
  featureKey?: keyof FeaturePermissions;
  alwaysShow?: boolean;
};

interface SidebarNavProps {
  isExpanded: boolean;
  isMobile: boolean;
  onMobileClose: () => void;
}

export const SidebarNav = ({ isExpanded, isMobile, onMobileClose }: SidebarNavProps) => {
  const location = useLocation();
  const { isWorker, loading: roleLoading } = useUserRole();
  const { hasAccess, isAdmin, loading: permissionsLoading } = useFeatureAccess();
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [isTradingExpanded, setIsTradingExpanded] = useState(false);
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

  const mainNavItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/",
      workerAllowed: false,
      featureKey: "notes",
    },
    {
      title: "All Notes",
      icon: <FileText size={20} />,
      path: "/notes",
      workerAllowed: false,
      featureKey: "notes",
    },
    {
      title: "Receipt Generator",
      icon: <FileText size={20} />,
      path: "/receipt-generator",
      workerAllowed: false,
      featureKey: "receipt_generator",
    },
    {
      title: "Finance",
      icon: <Coins size={20} />,
      path: "/financeiro",
      workerAllowed: false,
      featureKey: "finance",
    },
    {
      title: "Calendar",
      icon: <CalendarDays size={20} />,
      path: "/calendar",
      workerAllowed: false,
      featureKey: "calendar",
    },
    {
      title: "Expenses",
      icon: <FileCheck size={20} />,
      path: "/expenses",
      workerAllowed: true,
      featureKey: "expenses",
    },
    {
      title: "Legal",
      icon: <Scale size={20} />,
      path: "/legal",
      workerAllowed: false,
      featureKey: "legal",
    },
    {
      title: "Projects",
      icon: <FolderKanban size={20} />,
      path: "/projects",
      workerAllowed: false,
      featureKey: "projects",
    },
    {
      title: "Work",
      icon: <Building2 size={20} />,
      path: "/companies",
      workerAllowed: false,
      featureKey: "finance",
    },
    {
      title: "Profile",
      icon: <User size={20} />,
      path: "/profile",
      workerAllowed: true,
      alwaysShow: true,
    },
  ];

  const tradingNavItems: NavItem[] = [
    {
      title: "Tokens",
      icon: <Banknote size={20} />,
      path: "/tokens",
      workerAllowed: false,
      featureKey: "tao",
    },
    {
      title: "Market Data",
      icon: <TrendingUp size={20} />,
      path: "/market-data",
      workerAllowed: false,
      featureKey: "tao",
    },
    {
      title: "Crypto Assets",
      icon: <Coins size={20} />,
      path: "/crypto/dashboard",
      workerAllowed: false,
      featureKey: "tao",
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
      featureKey: "tao",
    },
  ];

  // Filter nav items based on role and feature permissions
  const navItems = useMemo(() => {
    if (roleLoading || permissionsLoading) return [];
    
    let items = mainNavItems;
    
    // Filter by worker role first
    if (isWorker) {
      items = items.filter(item => item.workerAllowed);
    }
    
    // Then filter by feature permissions (admins bypass this)
    if (!isAdmin) {
      items = items.filter(item => {
        // Always show items marked as alwaysShow
        if (item.alwaysShow) return true;
        // If no feature key, hide unless admin
        if (!item.featureKey) return false;
        // Check if user has access to this feature
        return hasAccess(item.featureKey);
      });
    }
    
    return items;
  }, [isWorker, isAdmin, roleLoading, permissionsLoading, hasAccess]);

  const tradingItems = useMemo(() => {
    if (roleLoading || permissionsLoading || isWorker) return [];
    
    // Admins see all trading items
    if (isAdmin) return tradingNavItems;
    
    // Filter by TAO permission
    return tradingNavItems.filter(item => {
      if (!item.featureKey) return false;
      return hasAccess(item.featureKey);
    });
  }, [isWorker, isAdmin, roleLoading, permissionsLoading, hasAccess]);

  // Check if any trading route is active
  const isTradingActive = tradingNavItems.some(
    item => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
  );

  // Don't show boards section for workers, and only show if user has projects permission
  const showBoardsSection = !isWorker && (isAdmin || hasAccess('projects'));

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
        
        {/* Trading Section - Only for non-workers */}
        {tradingItems.length > 0 && (
          <li>
            <button
              onClick={() => setIsTradingExpanded(!isTradingExpanded)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                !isExpanded && "justify-center px-2",
                isTradingActive
                  ? "bg-brand/20 text-brand font-medium"
                  : "text-white hover:bg-white/10 hover:text-brand"
              )}
              title={!isExpanded ? "Trading" : ""}
            >
              <LineChart size={20} />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left">Trading</span>
                  {isTradingExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </>
              )}
            </button>
            
            {isExpanded && isTradingExpanded && (
              <ul className="ml-4 mt-1 space-y-1">
                {tradingItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => isMobile && onMobileClose()}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                        location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                          ? "bg-brand/20 text-brand font-medium"
                          : "text-white/80 hover:bg-white/10 hover:text-brand"
                      )}
                    >
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )}
        
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

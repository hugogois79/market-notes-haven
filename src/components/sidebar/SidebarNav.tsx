
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
                location.pathname === item.path
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
      </ul>
    </nav>
  );
};

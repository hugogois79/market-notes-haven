import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, Receipt, FileText, Settings, TrendingUp } from "lucide-react";

interface WealthSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Asset Inventory', icon: Package },
  { id: 'cashflow', label: 'Cashflow Ledger', icon: Receipt },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const WealthSidebar = ({ activeTab, onTabChange }: WealthSidebarProps) => {
  return (
    <div className="w-56 bg-slate-900 text-white flex flex-col min-h-full">
      {/* Logo/Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Wealth OS</h2>
            <p className="text-xs text-slate-400">Family Office</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeTab === item.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          v1.0.0 • Family Office
        </p>
      </div>
    </div>
  );
};

export default WealthSidebar;

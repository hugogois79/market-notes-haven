
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, UserPlus, Users, LayoutGrid } from "lucide-react";

interface CRMViewHeaderProps {
  selectedView: "main" | "kanban";
  setSelectedView: (view: "main" | "kanban") => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddValidator: () => void;
}

const CRMViewHeader: React.FC<CRMViewHeaderProps> = ({
  selectedView,
  setSelectedView,
  searchTerm,
  onSearchChange,
  onAddValidator,
}) => {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div className="flex space-x-2">
        <Button 
          variant={selectedView === "main" ? "default" : "outline"} 
          size="sm"
          onClick={() => setSelectedView("main")}
        >
          <Users className="h-4 w-4 mr-2" />
          Main Table
        </Button>
        <Button 
          variant={selectedView === "kanban" ? "default" : "outline"} 
          size="sm"
          onClick={() => setSelectedView("kanban")}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Kanban
        </Button>
      </div>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
          <Input
            placeholder="Search validators, subnets..."
            className="pl-9 w-[280px]"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button onClick={onAddValidator} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Validator
        </Button>
      </div>
    </div>
  );
};

export default CRMViewHeader;

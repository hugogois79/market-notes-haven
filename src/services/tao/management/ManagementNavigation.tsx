
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardDrive, ShieldCheck, Users, Database, Settings } from "lucide-react";

interface ManagementNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ManagementNavigation: React.FC<ManagementNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="resources" className="flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          <span className="hidden sm:inline">Network Resources</span>
          <span className="sm:hidden">Resources</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Security</span>
          <span className="sm:hidden">Security</span>
        </TabsTrigger>
        <TabsTrigger value="validators" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Validators</span>
          <span className="sm:hidden">Validators</span>
        </TabsTrigger>
        <TabsTrigger value="data" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">Data</span>
          <span className="sm:hidden">Data</span>
        </TabsTrigger>
        <TabsTrigger value="config" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Configuration</span>
          <span className="sm:hidden">Config</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ManagementNavigation;

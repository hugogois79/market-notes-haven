
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  CircleDollarSign, 
  Globe, 
  Layers, 
  LineChart,
  Database,
} from "lucide-react";

interface TaoNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TaoNavigation: React.FC<TaoNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b">
      <TabsList className="w-full justify-start h-auto">
        <TabsTrigger value="overview" className="py-3">
          <BarChart3 className="mr-2 h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="stats" className="py-3">
          <LineChart className="mr-2 h-4 w-4" />
          TAO Stats
        </TabsTrigger>
        <TabsTrigger value="marketcap" className="py-3">
          <CircleDollarSign className="mr-2 h-4 w-4" />
          Market Cap
        </TabsTrigger>
        <TabsTrigger value="subnets" className="py-3">
          <Layers className="mr-2 h-4 w-4" />
          Subnets
        </TabsTrigger>
        <TabsTrigger value="validators" className="py-3">
          <Globe className="mr-2 h-4 w-4" />
          Validators
        </TabsTrigger>
        <TabsTrigger value="management" className="py-3">
          <Database className="mr-2 h-4 w-4" />
          Management
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default TaoNavigation;

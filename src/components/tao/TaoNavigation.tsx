
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  CircleDollarSign, 
  Globe, 
  Layers, 
  LineChart,
  Database,
  Activity,
  Users,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TaoNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TaoNavigation: React.FC<TaoNavigationProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  
  const handleTabChange = (value: string) => {
    onTabChange(value);
    
    // Navigate to the appropriate route
    if (value === 'performance') {
      navigate('/tao/performance');
    } else if (value === 'validator-relationship-management') {
      navigate('/tao/validator-relationship-management');
    } else if (value === 'investor-opportunities') {
      navigate('/tao/investor-opportunities');
    } else if (value === 'overview') {
      navigate('/tao');
    } else {
      navigate(`/tao?tab=${value}`);
    }
  };

  return (
    <div className="border-b">
      <TabsList className="w-full justify-start h-auto overflow-x-auto">
        <TabsTrigger value="overview" className="py-3" onClick={() => handleTabChange('overview')}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="stats" className="py-3" onClick={() => handleTabChange('stats')}>
          <LineChart className="mr-2 h-4 w-4" />
          TAO Stats
        </TabsTrigger>
        <TabsTrigger value="marketcap" className="py-3" onClick={() => handleTabChange('marketcap')}>
          <CircleDollarSign className="mr-2 h-4 w-4" />
          Market Cap
        </TabsTrigger>
        <TabsTrigger value="subnets" className="py-3" onClick={() => handleTabChange('subnets')}>
          <Layers className="mr-2 h-4 w-4" />
          Subnets
        </TabsTrigger>
        <TabsTrigger value="validators" className="py-3" onClick={() => handleTabChange('validators')}>
          <Globe className="mr-2 h-4 w-4" />
          Validators
        </TabsTrigger>
        <TabsTrigger value="performance" className="py-3" onClick={() => handleTabChange('performance')}>
          <Activity className="mr-2 h-4 w-4" />
          Performance
        </TabsTrigger>
        <TabsTrigger value="management" className="py-3" onClick={() => handleTabChange('management')}>
          <Database className="mr-2 h-4 w-4" />
          Management
        </TabsTrigger>
        <TabsTrigger value="validator-relationship-management" className="py-3" onClick={() => handleTabChange('validator-relationship-management')}>
          <Users className="mr-2 h-4 w-4" />
          Validator CRM
        </TabsTrigger>
        <TabsTrigger value="investor-opportunities" className="py-3" onClick={() => handleTabChange('investor-opportunities')}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Investor Opportunities
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default TaoNavigation;

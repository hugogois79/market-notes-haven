
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
  TrendingUp,
  MessageSquare
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
    
    switch (value) {
      case 'performance':
        navigate('/tao/performance');
        break;
      case 'validators':
        // When clicking Validators tab, navigate directly to the page with Kanban view
        navigate('/tao/validators', { state: { initialTab: 'monday-crm', initialView: 'kanban' } });
        break;
      case 'validator-relationship-management':
        navigate('/tao/validator-relationship-management');
        break;
      case 'investor-opportunities':
        navigate('/tao/investor-opportunities');
        break;
      case 'follow-up-sequences':
        navigate('/tao/follow-up-sequences');
        break;
      case 'management':
        navigate('/tao/management');
        break;
      default:
        navigate('/tao');
    }
  };

  return (
    <div className="border-b">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            TAO Stats
          </TabsTrigger>
          <TabsTrigger value="marketcap" className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4" />
            Market Cap
          </TabsTrigger>
          <TabsTrigger value="subnets" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Subnets
          </TabsTrigger>
          <TabsTrigger value="validators" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Validators
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Management
          </TabsTrigger>
          <TabsTrigger value="validator-relationship-management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Validator CRM
          </TabsTrigger>
          <TabsTrigger value="investor-opportunities" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Investor Opportunities
          </TabsTrigger>
          <TabsTrigger value="follow-up-sequences" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Follow-Up Sequences
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TaoNavigation;

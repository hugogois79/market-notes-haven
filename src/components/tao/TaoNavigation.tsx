
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3,
  Activity,
  Users,
  Settings,
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
      case 'management':
        navigate('/tao/management');
        break;
      case 'validators':
        navigate('/tao/validators');
        break;
      case 'follow-up':
        navigate('/tao/follow-up-sequences');
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
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="validators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Validators
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Management
          </TabsTrigger>
          <TabsTrigger value="follow-up" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Follow-Up
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TaoNavigation;

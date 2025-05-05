
import React, { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { KanbanSquare } from "lucide-react";

// Import the data services
import { useTaoStats } from "@/services/tao/useTaoStats";
import { fetchTaoSubnets } from "@/services/taoSubnetService";

// Import Management components
import TaoPageHeader from "@/components/tao/TaoPageHeader";
import ManagementNavigation from "@/services/tao/management/ManagementNavigation";
import NetworkResourcesCard from "@/components/tao/management/NetworkResourcesCard";
import SecurityManagementCard from "@/components/tao/management/SecurityManagementCard";
import ValidatorManagementCard from "@/components/tao/management/ValidatorManagementCard";
import DataManagementCard from "@/components/tao/management/DataManagementCard";
import ConfigurationCard from "@/components/tao/management/ConfigurationCard";

const TAOManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("resources");
  const navigate = useNavigate();

  // Fetch live TAO stats with 5-minute refresh interval
  const { 
    taoStats, 
    isLoading: isLoadingTaoStats, 
    refreshTaoStats,
    isMockData
  } = useTaoStats(5 * 60 * 1000);

  // Fetch static subnet data from database
  const { data: dbSubnets = [], isLoading: isLoadingDbSubnets } = useQuery({
    queryKey: ['tao-subnets'],
    queryFn: fetchTaoSubnets,
    retry: 1,
    meta: {
      onSettled: (data, error) => {
        if (error) {
          console.error("Error fetching subnet data from database:", error);
          toast.error("Could not load subnet data from database");
        }
      }
    }
  });

  // Get subnets to display, prioritizing live data
  const subnets = taoStats && !isMockData ? taoStats.subnets : dbSubnets;

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handle manual refresh
  const handleRefreshStats = () => {
    refreshTaoStats();
    toast.info("Refreshing TAO network data...");
  };

  // Navigate to validator CRM with Kanban view
  const handleGoToCRM = () => {
    navigate('/tao/validators');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <TaoPageHeader 
          timestamp={taoStats?.timestamp}
          isLoading={isLoadingTaoStats || isLoadingDbSubnets}
          onRefresh={handleRefreshStats}
          isMockData={isMockData}
        />
        
        <Button 
          variant="outline" 
          onClick={handleGoToCRM}
          className="flex items-center gap-2"
        >
          <KanbanSquare className="h-4 w-4" />
          Validator CRM Kanban
        </Button>
      </div>

      {/* Navigation Tabs */}
      <ManagementNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Tabs Content */}
      <Tabs value={activeTab} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TabsContent value="resources" className="mt-0 col-span-full">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <NetworkResourcesCard />
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-0 col-span-full">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SecurityManagementCard />
          </div>
        </TabsContent>

        <TabsContent value="validators" className="mt-0 col-span-full">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ValidatorManagementCard />
          </div>
        </TabsContent>

        <TabsContent value="data" className="mt-0 col-span-full">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DataManagementCard />
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-0 col-span-full">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ConfigurationCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TAOManagement;

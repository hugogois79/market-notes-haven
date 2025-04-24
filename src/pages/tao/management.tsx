
import React, { useState } from "react";
import TaoPageHeader from "@/components/tao/TaoPageHeader";
import TaoNavigation from "@/components/tao/TaoNavigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import NetworkResourcesCard from "@/components/tao/management/NetworkResourcesCard";
import SecurityManagementCard from "@/components/tao/management/SecurityManagementCard";
import ValidatorManagementCard from "@/components/tao/management/ValidatorManagementCard";
import DataManagementCard from "@/components/tao/management/DataManagementCard";
import ConfigurationCard from "@/components/tao/management/ConfigurationCard";

const TAOManagement = () => {
  const [activeTab, setActiveTab] = useState("management");
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <TaoPageHeader 
        timestamp={new Date().toISOString()} 
        isLoading={isLoading} 
        onRefresh={handleRefresh} 
        isMockData={true}
      />
      
      <TaoNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <Tabs value={activeTab} className="w-full space-y-6">
        <TabsContent value="management" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NetworkResourcesCard />
            <SecurityManagementCard />
            <ValidatorManagementCard />
            <DataManagementCard />
            <ConfigurationCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TAOManagement;

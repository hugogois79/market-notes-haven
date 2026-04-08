import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchTaoSubnets } from "@/services/taoSubnetService";
import { useTaoStats, TaoStatsUpdate } from "@/services/taoStatsService";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Import refactored components
import TaoPageHeader from "@/components/tao/TaoPageHeader";
import TaoNavigation from "@/components/tao/TaoNavigation";
import TaoStatCards from "@/components/tao/TaoStatCards";
import TaoStatsTabContent from "@/components/tao/TaoStatsTabContent";
import TaoMarketCapTabContent from "@/components/tao/TaoMarketCapTabContent";
import TaoSubnetsTable from "@/components/tao/TaoSubnetsTable";
import TaoValidatorsTabContent from "@/components/tao/TaoValidatorsTabContent";
import ValidatorManagement from "@/components/tao/ValidatorManagement";

const TAOPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

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

  // Fetch live TAO stats with 5-minute refresh interval
  const { 
    taoStats, 
    isLoading: isLoadingTaoStats, 
    error: taoStatsError, 
    refreshTaoStats,
    isMockData
  } = useTaoStats(5 * 60 * 1000); // 5 minutes in milliseconds

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/tao/${value === "overview" ? "" : value}`);
  };

  // Handle manual refresh
  const handleRefreshStats = () => {
    refreshTaoStats();
    toast.info("Refreshing TAO network data...");
  };

  // Determine if we have live data
  const hasLiveData = !!taoStats && !isMockData;
  
  // Get subnets to display
  const topSubnets = taoStats && taoStats.subnets ? 
    [...taoStats.subnets].sort((a, b) => b.neurons - a.neurons).slice(0, 5) : 
    dbSubnets.slice(0, 5);

  // Use the fixed subnet count from the screenshot
  const subnetCount = 92;

  // Determine error state (convert Error object to boolean)
  const hasError = !!taoStatsError;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <TaoPageHeader 
        timestamp={taoStats?.timestamp}
        isLoading={isLoadingTaoStats}
        onRefresh={handleRefreshStats}
        isMockData={isMockData}
      />

      {/* Navigation Tabs */}
      <TaoNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Wrap all TabsContent components within a Tabs component */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Overview Tab */}
        <TabsContent value="overview" className="pt-6">
          {/* Stat Cards */}
          <TaoStatCards 
            taoStats={taoStats as TaoStatsUpdate} 
            subnetCount={subnetCount}
            isMockData={isMockData}
          />
          
          <div className="grid gap-6 mt-6 md:grid-cols-2">
            <TaoStatsTabContent />
            <TaoMarketCapTabContent />
          </div>

          {/* Subnets Table */}
          <div className="mt-6">
            <TaoSubnetsTable
              subnets={topSubnets}
              isLoading={isLoadingTaoStats || isLoadingDbSubnets}
              error={hasError}
              hasLiveData={hasLiveData}
            />
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="pt-6">
          <TaoStatsTabContent />
        </TabsContent>

        {/* Market Cap Tab */}
        <TabsContent value="marketcap" className="pt-6">
          <TaoMarketCapTabContent />
        </TabsContent>

        {/* Validators Tab */}
        <TabsContent value="validators" className="pt-6">
          <TaoValidatorsTabContent />
        </TabsContent>

        {/* Subnets Tab */}
        <TabsContent value="subnets" className="pt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Subnets Overview</CardTitle>
              {hasLiveData && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs font-medium">
                  Live Data
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <TaoSubnetsTable
                subnets={hasLiveData && taoStats ? taoStats.subnets : dbSubnets}
                isLoading={isLoadingTaoStats || isLoadingDbSubnets}
                error={!!hasError}
                title="All Subnets"
                hasLiveData={hasLiveData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="pt-6">
          <ValidatorManagement />
        </TabsContent>
        
        {/* Validator Relationship Management Tab */}
        <TabsContent value="validator-relationship-management" className="pt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Validator Relationship Management</h2>
            <p>Content for Validator Relationship Management will appear here.</p>
          </div>
        </TabsContent>
        
        {/* Investor Opportunities Tab */}
        <TabsContent value="investor-opportunities" className="pt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Investor Opportunities</h2>
            <p>Content for Investor Opportunities will appear here.</p>
          </div>
        </TabsContent>
        
        {/* Follow Up Sequences Tab */}
        <TabsContent value="follow-up-sequences" className="pt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Follow-Up Sequences</h2>
            <p>Content for Follow-Up Sequences will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TAOPage;

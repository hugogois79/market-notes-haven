
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertCircle, Filter, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import TaoPageHeader from "@/components/tao/TaoPageHeader";
import TaoNavigation from "@/components/tao/TaoNavigation";
import { useSubnetPerformance } from "@/services/tao/subnetPerformanceService";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { usePerformanceAlerts } from "@/hooks/usePerformanceAlerts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MainMetricsPanel from "@/components/tao/performance/MainMetricsPanel";
import SubnetComparisonChart from "@/components/tao/performance/SubnetComparisonChart";
import AlertConfigPanel from "@/components/tao/performance/AlertConfigPanel";
import PerformanceFilters from "@/components/tao/performance/PerformanceFilters";

const PerformanceDashboard = () => {
  const [activeTab, setActiveTab] = useState("performance");
  const [timeFilter, setTimeFilter] = useState("7d");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch subnet performance data
  const { 
    performanceData, 
    isLoading, 
    error, 
    lastUpdated, 
    refreshData 
  } = useSubnetPerformance();

  // Initialize performance alerts
  const { 
    alertSettings, 
    updateAlertSettings,
    addCustomMetric,
    removeCustomMetric,
    updateCustomMetric
  } = usePerformanceAlerts(performanceData);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    refreshData();
    toast.info("Refreshing subnet performance data...");
  };

  // Filter options for the dashboard
  const [filters, setFilters] = useState({
    timeRange: '7d',
    subnetCategories: [] as number[],
    performanceThreshold: 0,
    sortBy: 'emissions'
  });

  // Update filters
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <TaoPageHeader 
        timestamp={lastUpdated?.toISOString()}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        isMockData={false}
      />

      {/* Navigation Tabs */}
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TaoNavigation 
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Performance Dashboard Content */}
        <TabsContent value="performance" className="pt-6 space-y-6">
          {/* Filters and Controls */}
          <div className="flex justify-between items-center">
            <div className="space-x-2">
              <Select
                value={filters.timeRange}
                onValueChange={(value) => updateFilters({ timeRange: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilters({ sortBy: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emissions">Emissions</SelectItem>
                  <SelectItem value="validators">Validators</SelectItem>
                  <SelectItem value="stake">Total Stake</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>

              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <PerformanceFilters 
                    filters={filters}
                    updateFilters={updateFilters}
                    subnets={performanceData}
                    onApply={() => setIsFilterOpen(false)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Alerts
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <AlertConfigPanel
                    alertSettings={alertSettings}
                    onUpdateSettings={updateAlertSettings}
                    onAddCustomMetric={addCustomMetric}
                    onRemoveCustomMetric={removeCustomMetric}
                    onUpdateCustomMetric={updateCustomMetric}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Metrics Panel */}
            <div className="lg:col-span-3">
              <MainMetricsPanel 
                performanceData={performanceData}
                isLoading={isLoading}
                timeRange={filters.timeRange}
              />
            </div>

            {/* Subnet Comparison Chart */}
            <div className="lg:col-span-3">
              <SubnetComparisonChart 
                performanceData={performanceData}
                isLoading={isLoading}
                sortBy={filters.sortBy}
                filteredSubnets={filters.subnetCategories}
                performanceThreshold={filters.performanceThreshold}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;

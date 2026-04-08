
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaoSubnetInfo } from '@/services/tao/types';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface MainMetricsPanelProps {
  performanceData: TaoSubnetInfo[];
  isLoading: boolean;
  timeRange: string;
}

const MainMetricsPanel: React.FC<MainMetricsPanelProps> = ({ 
  performanceData, 
  isLoading,
  timeRange
}) => {
  // Calculate aggregated metrics
  const totalEmissions = performanceData.reduce(
    (sum, subnet) => sum + (subnet.performance?.daily_emissions || 0), 
    0
  );
  
  const totalValidators = performanceData.reduce(
    (sum, subnet) => sum + (subnet.performance?.active_validators || 0), 
    0
  );
  
  const totalStake = performanceData.reduce(
    (sum, subnet) => sum + (subnet.performance?.total_stake || 0), 
    0
  );

  // Calculate average performance trend
  const validSubnets = performanceData.filter(subnet => subnet.performance?.performance_trend_7d !== undefined);
  const avgPerformanceTrend = validSubnets.length
    ? validSubnets.reduce((sum, subnet) => sum + (subnet.performance?.performance_trend_7d || 0), 0) / validSubnets.length
    : 0;

  // Prepare trend data for the chart
  const prepareHistoricalData = () => {
    if (!performanceData.length || !performanceData[0].performance?.historical_data) {
      return [];
    }

    // Get timestamps from the first subnet's historical data
    const timestamps = performanceData[0].performance?.historical_data?.map(point => point.timestamp) || [];
    
    return timestamps.map((timestamp, index) => {
      // Aggregate metrics for this timestamp across all subnets
      const dailyEmissions = performanceData.reduce(
        (sum, subnet) => sum + (subnet.performance?.historical_data?.[index]?.emissions || 0), 
        0
      );
      
      const activeValidators = performanceData.reduce(
        (sum, subnet) => sum + (subnet.performance?.historical_data?.[index]?.validators || 0), 
        0
      );
      
      const totalStake = performanceData.reduce(
        (sum, subnet) => sum + (subnet.performance?.historical_data?.[index]?.stake || 0), 
        0
      );

      // Format date for display
      const date = new Date(timestamp);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return {
        date: formattedDate,
        emissions: dailyEmissions,
        validators: activeValidators,
        stake: totalStake
      };
    });
  };

  const trendData = prepareHistoricalData();
  
  // Format large numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Subnet Performance Overview</h2>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Emissions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily TAO Emissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-3/4" />
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatNumber(totalEmissions)}</div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validators Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Validators
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-3/4" />
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatNumber(totalValidators)}</div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stake Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stake
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-3/4" />
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatNumber(totalStake)}</div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Trend Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              7-Day Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-3/4" />
            ) : (
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${avgPerformanceTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {avgPerformanceTrend >= 0 ? '+' : ''}{avgPerformanceTrend.toFixed(2)}%
                </div>
                <div className={`p-2 rounded-full ${avgPerformanceTrend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {avgPerformanceTrend >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <ChartContainer 
                config={{
                  emissions: { label: "Emissions", color: "#8B5CF6" },
                  validators: { label: "Validators", color: "#3B82F6" },
                  stake: { label: "Total Stake", color: "#10B981" },
                }}
              >
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="emissions" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    yAxisId="left"
                    activeDot={{ r: 6 }}
                    name="emissions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="validators" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    yAxisId="left"
                    activeDot={{ r: 6 }}
                    name="validators"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stake" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    yAxisId="right"
                    activeDot={{ r: 6 }}
                    name="stake"
                  />
                </LineChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainMetricsPanel;

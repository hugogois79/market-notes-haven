
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaoSubnetInfo } from '@/services/tao/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface SubnetComparisonChartProps {
  performanceData: TaoSubnetInfo[];
  isLoading: boolean;
  sortBy: string;
  filteredSubnets: number[];
  performanceThreshold: number;
}

// Custom type for chart data
interface ChartDataItem {
  name: string;
  emissions: number;
  validators: number;
  stake: number;
  performance: number;
  barColor: string;
}

const SubnetComparisonChart: React.FC<SubnetComparisonChartProps> = ({
  performanceData,
  isLoading,
  sortBy,
  filteredSubnets,
  performanceThreshold
}) => {
  // Prepare data for the chart
  const chartData = useMemo(() => {
    // Apply filters
    let filteredData = [...performanceData];
    
    // Apply subnet filter if there are selected subnets
    if (filteredSubnets.length > 0) {
      filteredData = filteredData.filter(subnet => filteredSubnets.includes(subnet.netuid));
    }
    
    // Apply performance threshold filter
    if (performanceThreshold !== 0) {
      filteredData = filteredData.filter(subnet => {
        const performance = subnet.performance?.performance_trend_7d || 0;
        return performanceThreshold > 0 
          ? performance >= performanceThreshold
          : performance <= performanceThreshold;
      });
    }
    
    // Sort data based on the selected sort criterion
    filteredData.sort((a, b) => {
      let aValue = 0;
      let bValue = 0;
      
      switch (sortBy) {
        case 'emissions':
          aValue = a.performance?.daily_emissions || 0;
          bValue = b.performance?.daily_emissions || 0;
          break;
        case 'validators':
          aValue = a.performance?.active_validators || 0;
          bValue = b.performance?.active_validators || 0;
          break;
        case 'stake':
          aValue = a.performance?.total_stake || 0;
          bValue = b.performance?.total_stake || 0;
          break;
        case 'performance':
          aValue = a.performance?.performance_trend_7d || 0;
          bValue = b.performance?.performance_trend_7d || 0;
          break;
        default:
          aValue = a.performance?.daily_emissions || 0;
          bValue = b.performance?.daily_emissions || 0;
      }
      
      return bValue - aValue;
    });
    
    // Take top 15 for better visualization
    filteredData = filteredData.slice(0, 15);
    
    // Format data for the chart
    return filteredData.map(subnet => {
      const performanceTrend = subnet.performance?.performance_trend_7d || 0;
      
      return {
        name: subnet.name,
        emissions: subnet.performance?.daily_emissions || 0,
        validators: subnet.performance?.active_validators || 0,
        stake: subnet.performance?.total_stake || 0,
        performance: performanceTrend,
        // Determine color based on performance trend
        barColor: performanceTrend > 5 
          ? '#10B981' // Green for strong positive
          : performanceTrend > 0 
            ? '#34D399' // Light green for positive
            : performanceTrend > -5 
              ? '#F59E0B' // Yellow for slight negative
              : '#EF4444' // Red for strong negative
      };
    });
  }, [performanceData, sortBy, filteredSubnets, performanceThreshold]);

  // Get the appropriate y-axis label based on the sort criterion
  const getYAxisLabel = () => {
    switch (sortBy) {
      case 'emissions':
        return 'Daily Emissions';
      case 'validators':
        return 'Active Validators';
      case 'stake':
        return 'Total Stake';
      case 'performance':
        return 'Performance (%)';
      default:
        return 'Value';
    }
  };

  // Format numbers for better readability
  const formatValue = (value: number) => {
    if (sortBy === 'performance') {
      return `${value.toFixed(2)}%`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  // Fixed bar colors map for each bar
  const getBarFill = (entry: ChartDataItem) => {
    return entry.barColor;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subnet Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="h-96">
            <ChartContainer
              config={{
                emissions: { label: "Emissions", color: "#8B5CF6" },
                validators: { label: "Validators", color: "#3B82F6" },
                stake: { label: "Total Stake", color: "#10B981" },
                performance: { label: "Performance", color: "#F59E0B" },
              }}
            >
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12 }} 
                  width={90}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey={sortBy} 
                  name={sortBy}
                  fill="#8B5CF6" // Default fill color
                  stroke="#8B5CF6" // Default stroke color
                  fillOpacity={0.8}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubnetComparisonChart;

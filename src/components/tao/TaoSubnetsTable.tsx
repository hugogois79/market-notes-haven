
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaoSubnetInfo } from "@/services/taoStatsService";
import { TaoSubnet } from "@/services/taoSubnetService";
import { ArrowDown, ArrowUp, ChevronDown, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface TaoSubnetsTableProps {
  subnets: (TaoSubnetInfo | TaoSubnet)[];
  isLoading: boolean;
  error: any;
  title?: string;
  hasLiveData: boolean;
}

type SortField = 'name' | 'netuid' | 'neurons' | 'emission' | null;
type SortDirection = 'asc' | 'desc';

const TaoSubnetsTable: React.FC<TaoSubnetsTableProps> = ({
  subnets,
  isLoading,
  error,
  title = "Subnets",
  hasLiveData
}) => {
  const [sortField, setSortField] = useState<SortField>('neurons');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Helper function to safely format emission values
  const formatEmission = (emission: string | number): string => {
    if (typeof emission === 'number') {
      return emission.toFixed(4);
    }
    return String(emission);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort subnets
  const filteredAndSortedSubnets = [...subnets]
    .filter(subnet => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      const name = subnet.name.toLowerCase();
      const id = 'netuid' in subnet ? subnet.netuid : subnet.id;
      return name.includes(searchLower) || String(id).includes(searchLower);
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      
      let valueA: any;
      let valueB: any;

      if (sortField === 'name') {
        valueA = a.name;
        valueB = b.name;
      } else if (sortField === 'netuid') {
        valueA = 'netuid' in a ? a.netuid : a.id;
        valueB = 'netuid' in b ? b.netuid : b.id;
      } else if (sortField === 'neurons') {
        valueA = a.neurons;
        valueB = b.neurons;
      } else if (sortField === 'emission') {
        valueA = a.emission;
        valueB = b.emission;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }

      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });

  // Helper for rendering sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Function to determine text color based on value trend
  const getTrendColor = (value: number) => {
    if (value > 0) return "text-emerald-500";
    if (value < 0) return "text-red-500";
    return "text-gray-500";
  };

  // Generate mock trend data for demonstration
  const generateTrendData = (index: number) => {
    const trends = [
      { h1: 0.28, h24: 12.87, w1: 59.44 },
      { h1: -4.50, h24: -11.57, w1: 14.54 },
      { h1: -1.94, h24: -8.67, w1: 4.95 },
      { h1: -8.05, h24: -27.29, w1: 25.40 },
      { h1: -1.31, h24: -13.06, w1: 23.91 },
    ];
    return trends[index % trends.length];
  };
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by Subnet or NetUID"
            className="pl-8 bg-gray-100/50 dark:bg-gray-800/50 border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Card className="overflow-hidden border-0 bg-transparent shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">Loading subnet data...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              Error loading data. Please try refreshing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full border-collapse">
                <TableHeader className="bg-gray-100/50 dark:bg-gray-800/50">
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableHead className="w-14 text-center font-medium">#</TableHead>
                    <TableHead 
                      className="font-medium cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Subnet {renderSortIndicator('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right font-medium cursor-pointer"
                      onClick={() => handleSort('emission')}
                    >
                      <div className="flex items-center justify-end">
                        Emission {renderSortIndicator('emission')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-medium">
                      <div className="flex items-center justify-end">
                        Price <ChevronDown className="h-4 w-4 ml-1" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-medium">1H</TableHead>
                    <TableHead className="text-right font-medium">24H</TableHead>
                    <TableHead className="text-right font-medium">1W</TableHead>
                    <TableHead className="text-right font-medium">
                      <div className="flex items-center justify-end">
                        Market Cap <Info className="h-4 w-4 ml-1 text-gray-400" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-medium">
                      <div className="flex items-center justify-end">
                        Volume (24h) <Info className="h-4 w-4 ml-1 text-gray-400" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedSubnets.length > 0 ? (
                    filteredAndSortedSubnets.map((subnet, index) => {
                      const id = 'netuid' in subnet ? subnet.netuid : subnet.id;
                      const trendData = generateTrendData(index);
                      
                      return (
                        <TableRow 
                          key={id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <TableCell className="text-center font-medium text-gray-500">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 mr-3 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                {subnet.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{subnet.name}</div>
                                <div className="text-xs text-gray-500">
                                  {id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatEmission(subnet.emission)}%
                          </TableCell>
                          <TableCell className="text-right">
                            τ {(Math.random() * 0.5).toFixed(6)}
                          </TableCell>
                          <TableCell className={cn("text-right", getTrendColor(trendData.h1))}>
                            {trendData.h1 > 0 ? "+" : ""}{trendData.h1.toFixed(2)}%
                          </TableCell>
                          <TableCell className={cn("text-right", getTrendColor(trendData.h24))}>
                            {trendData.h24 > 0 ? "+" : ""}{trendData.h24.toFixed(2)}%
                          </TableCell>
                          <TableCell className={cn("text-right", getTrendColor(trendData.w1))}>
                            {trendData.w1 > 0 ? "+" : ""}{trendData.w1.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right">
                            τ {(Math.random() * 300 + 10).toFixed(2)}K
                          </TableCell>
                          <TableCell className="text-right">
                            τ {(Math.random() * 100 + 5).toFixed(2)}K
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        No subnet data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaoSubnetsTable;

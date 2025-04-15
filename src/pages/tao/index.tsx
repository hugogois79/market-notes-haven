import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  CircleDollarSign, 
  Globe, 
  Layers, 
  LineChart,
  PieChart,
  Users,
  Database,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  FileDown,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchTaoSubnets, TaoSubnet } from "@/services/taoSubnetService";
import { useTaoStats, TaoSubnetInfo } from "@/services/taoStatsService";
import { useQuery } from "@tanstack/react-query";
import ValidatorManagement from "@/components/tao/ValidatorManagement";
import TaoExportTab from "@/components/tao/TaoExportTab";

const TAOPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch static subnet data from database
  const { data: dbSubnets = [], isLoading: isLoadingDbSubnets } = useQuery({
    queryKey: ['tao-subnets'],
    queryFn: fetchTaoSubnets
  });

  // Fetch live TAO stats with 5-minute refresh interval
  const { taoStats, isLoading: isLoadingTaoStats, error: taoStatsError, refreshTaoStats } = 
    useTaoStats(5 * 60 * 1000); // 5 minutes in milliseconds

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/tao/${value === "overview" ? "" : value}`);
  };

  // Handle manual refresh
  const handleRefreshStats = () => {
    refreshTaoStats();
    toast.success("Refreshing TAO network data...");
  };

  // Format large numbers
  const formatNumber = (num: number | undefined, decimals = 2): string => {
    if (num === undefined) return 'N/A';
    
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(decimals)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(decimals)}K`;
    } else {
      return `$${num.toFixed(decimals)}`;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Determine if we have live data
  const hasLiveData = !!taoStats;
  
  // Get subnets to display
  const topSubnets = taoStats?.subnets ? 
    [...taoStats.subnets].sort((a, b) => b.neurons - a.neurons).slice(0, 5) : 
    dbSubnets.slice(0, 5);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center rounded-full w-10 h-10">
            <img 
              src="/lovable-uploads/5bace84a-516c-4734-a925-c14b4b49b2a3.png" 
              alt="Bittensor TAO" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bittensor TAO Network</h1>
            <p className="text-muted-foreground">
              {hasLiveData ? 
                `Last updated: ${formatTimestamp(taoStats.timestamp)}` : 
                'Live data dashboard'}
            </p>
          </div>
        </div>
        
        <Button onClick={handleRefreshStats} disabled={isLoadingTaoStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs 
        defaultValue={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="border-b">
          <TabsList className="w-full justify-start h-auto">
            <TabsTrigger value="overview" className="py-3">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="stats" className="py-3">
              <LineChart className="mr-2 h-4 w-4" />
              TAO Stats
            </TabsTrigger>
            <TabsTrigger value="marketcap" className="py-3">
              <CircleDollarSign className="mr-2 h-4 w-4" />
              Market Cap
            </TabsTrigger>
            <TabsTrigger value="subnets" className="py-3">
              <Layers className="mr-2 h-4 w-4" />
              Subnets
            </TabsTrigger>
            <TabsTrigger value="validators" className="py-3">
              <Globe className="mr-2 h-4 w-4" />
              Validators
            </TabsTrigger>
            <TabsTrigger value="export" className="py-3">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="management" className="py-3">
              <Database className="mr-2 h-4 w-4" />
              Management
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="pt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">TAO Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {hasLiveData ? `$${taoStats.price.toFixed(2)}` : '$--.--.--'}
                    </div>
                    {hasLiveData && taoStats.price_change_percentage_24h && (
                      <div className={`flex items-center text-xs ${
                        (taoStats.price_change_percentage_24h || 0) >= 0 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {(taoStats.price_change_percentage_24h || 0) >= 0 ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs((taoStats.price_change_percentage_24h || 0)).toFixed(2)}% (24h)
                      </div>
                    )}
                  </div>
                  <CircleDollarSign className="text-brand h-8 w-8 opacity-20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {hasLiveData ? formatNumber(taoStats.market_cap) : '$-.--B'}
                  </div>
                  <PieChart className="text-brand h-8 w-8 opacity-20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Subnets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {hasLiveData ? taoStats.subnets.length : topSubnets.length}
                  </div>
                  <Layers className="text-brand h-8 w-8 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Top Subnets</h3>
              {hasLiveData && (
                <Badge variant="outline" className="ml-2">
                  Live Data
                </Badge>
              )}
            </div>
            
            <Card>
              <CardContent className="p-0">
                {isLoadingTaoStats || isLoadingDbSubnets ? (
                  <div className="p-6 text-center">Loading subnet data...</div>
                ) : taoStatsError ? (
                  <div className="p-6 text-center text-red-500">
                    Error loading data. Please try refreshing.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Subnet</TableHead>
                        <TableHead className="text-right">Neurons</TableHead>
                        <TableHead className="text-right">Emission (τ/day)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSubnets.length > 0 ? (
                        topSubnets.map((subnet) => (
                          <TableRow key={
                            'netuid' in subnet ? subnet.netuid : subnet.id
                          }>
                            <TableCell>
                              {'netuid' in subnet ? subnet.netuid : subnet.id}
                            </TableCell>
                            <TableCell className="font-medium">{subnet.name}</TableCell>
                            <TableCell className="text-right">{subnet.neurons}</TableCell>
                            <TableCell className="text-right">
                              {'emission' in subnet ? 
                                subnet.emission.toFixed(4) : subnet.emission}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No subnet data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>TAO Network Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span>Total Supply</span>
                  <span className="font-medium">21,000,000 τ</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Circulating Supply</span>
                  <span className="font-medium">12,468,782 τ</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Total Validators</span>
                  <span className="font-medium">512</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Active Validators</span>
                  <span className="font-medium">487</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Network Emission</span>
                  <span className="font-medium">36 τ/day</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Block Time</span>
                  <span className="font-medium">12 seconds</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Stake Ratio</span>
                  <span className="font-medium">76.4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketcap" className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price (USD)</span>
                  <span className="font-bold">$56.78</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-bold">$1,284,653,430</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">24h Volume</span>
                  <span className="font-bold">$78,432,562</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">24h High</span>
                  <span className="font-bold">$58.24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">24h Low</span>
                  <span className="font-bold">$54.95</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">All-time High</span>
                  <span className="font-bold">$89.32</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Exchange Distribution</h2>
              <div className="space-y-3">
                {[
                  { exchange: "Binance", volume: "$32M", percentage: 45 },
                  { exchange: "Coinbase", volume: "$18M", percentage: 25 },
                  { exchange: "Kraken", volume: "$11M", percentage: 15 },
                  { exchange: "KuCoin", volume: "$7M", percentage: 10 },
                  { exchange: "Others", volume: "$3M", percentage: 5 },
                ].map((item) => (
                  <div key={item.exchange} className="space-y-1">
                    <div className="flex justify-between">
                      <span>{item.exchange}</span>
                      <span>{item.volume}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="validators" className="pt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Validator</TableHead>
                  <TableHead>Stake</TableHead>
                  <TableHead>Delegation</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { rank: 1, validator: "Validator Alpha", stake: "542,156 τ", delegation: "12.4%", uptime: "99.98%", status: "active" },
                  { rank: 2, validator: "Validator Beta", stake: "498,732 τ", delegation: "11.3%", uptime: "99.95%", status: "active" },
                  { rank: 3, validator: "Validator Gamma", stake: "421,845 τ", delegation: "9.6%", uptime: "99.91%", status: "active" },
                  { rank: 4, validator: "Validator Delta", stake: "387,291 τ", delegation: "8.8%", uptime: "99.87%", status: "active" },
                  { rank: 5, validator: "Validator Epsilon", stake: "356,478 τ", delegation: "8.1%", uptime: "99.82%", status: "active" },
                  { rank: 6, validator: "Validator Zeta", stake: "312,654 τ", delegation: "7.1%", uptime: "99.76%", status: "jailed" },
                ].map((validator) => (
                  <TableRow key={validator.rank}>
                    <TableCell>{validator.rank}</TableCell>
                    <TableCell className="font-medium">{validator.validator}</TableCell>
                    <TableCell>{validator.stake}</TableCell>
                    <TableCell>{validator.delegation}</TableCell>
                    <TableCell>{validator.uptime}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        validator.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {validator.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="subnets" className="pt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Subnets Overview</CardTitle>
              {hasLiveData && (
                <Badge variant="outline">
                  Live Data
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTaoStats || isLoadingDbSubnets ? (
                <div className="p-6 text-center">Loading subnet data...</div>
              ) : taoStatsError ? (
                <div className="p-6 text-center text-red-500">
                  Error loading data. Please try refreshing.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Neurons</TableHead>
                      <TableHead>Emission (τ/day)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(hasLiveData ? taoStats.subnets : dbSubnets).map((subnet) => (
                      <TableRow key={
                        'netuid' in subnet ? subnet.netuid : subnet.id
                      }>
                        <TableCell>
                          {'netuid' in subnet ? subnet.netuid : subnet.id}
                        </TableCell>
                        <TableCell className="font-medium">{subnet.name}</TableCell>
                        <TableCell>{subnet.neurons}</TableCell>
                        <TableCell>
                          {'emission' in subnet ? 
                            subnet.emission.toFixed(4) : subnet.emission}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(hasLiveData ? taoStats.subnets.length : dbSubnets.length) === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No subnet data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="pt-6">
          <TaoExportTab />
        </TabsContent>

        <TabsContent value="management" className="pt-6">
          <ValidatorManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TAOPage;

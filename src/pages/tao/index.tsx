
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  CircleDollarSign, 
  Globe, 
  Layers, 
  LineChart,
  PieChart, 
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
import { fetchTaoSubnets, TaoSubnet } from "@/services/taoSubnetService";
import { useQuery } from "@tanstack/react-query";

const TAOPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: subnets = [], isLoading } = useQuery({
    queryKey: ['tao-subnets'],
    queryFn: fetchTaoSubnets
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/tao/${value === "overview" ? "" : value}`);
  };

  // Get top subnets for overview
  const topSubnets = subnets.slice(0, 5);

  return (
    <div className="container mx-auto py-6 space-y-6">
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
          <p className="text-muted-foreground">Bittensor ($TAO) Network Analytics</p>
        </div>
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
          </TabsList>
        </div>

        <TabsContent value="overview" className="pt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">TAO Price</h3>
                <CircleDollarSign className="text-brand h-5 w-5" />
              </div>
              <p className="text-3xl font-bold">$56.78</p>
              <p className="text-sm text-green-500 mt-2">+2.4% (24h)</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Market Cap</h3>
                <PieChart className="text-brand h-5 w-5" />
              </div>
              <p className="text-3xl font-bold">$1.28B</p>
              <p className="text-sm text-green-500 mt-2">+1.8% (24h)</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Active Subnets</h3>
                <Layers className="text-brand h-5 w-5" />
              </div>
              <p className="text-3xl font-bold">{subnets.length}</p>
              <p className="text-sm text-blue-500 mt-2">+3 (30d)</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Top Subnets</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {isLoading ? (
                <div className="p-6 text-center">Loading subnet data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Subnet</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Neurons</TableHead>
                      <TableHead>Emission</TableHead>
                      <TableHead>Incentive</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSubnets.map((subnet, index) => (
                      <TableRow key={subnet.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{subnet.name}</TableCell>
                        <TableCell>Tier {subnet.tier}</TableCell>
                        <TableCell>{subnet.neurons}</TableCell>
                        <TableCell>{subnet.emission}</TableCell>
                        <TableCell>{subnet.incentive}</TableCell>
                      </TableRow>
                    ))}
                    {topSubnets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No subnet data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="pt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">TAO Network Statistics</h2>
            <p className="text-muted-foreground mb-6">
              Comprehensive statistics about the TAO network performance, validators, and subnets.
            </p>
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
          </div>
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

        <TabsContent value="subnets" className="pt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center">Loading subnet data...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Neurons</TableHead>
                    <TableHead>Emission</TableHead>
                    <TableHead>Incentive</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subnets.map((subnet) => (
                    <TableRow key={subnet.id}>
                      <TableCell>{subnet.id}</TableCell>
                      <TableCell className="font-medium">{subnet.name}</TableCell>
                      <TableCell>{subnet.description}</TableCell>
                      <TableCell>Tier {subnet.tier}</TableCell>
                      <TableCell>{subnet.neurons}</TableCell>
                      <TableCell>{subnet.emission}</TableCell>
                      <TableCell>{subnet.incentive}</TableCell>
                    </TableRow>
                  ))}
                  {subnets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No subnet data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
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
      </Tabs>
    </div>
  );
};

export default TAOPage;

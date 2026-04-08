
import React from "react";
import { useTaoStats } from "@/services/tao/useTaoStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const TaoMarketCapTabContent: React.FC = () => {
  const { taoStats, isLoading } = useTaoStats();
  
  // Function to format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Exchange distribution data from the image
  const exchangeData = [
    { exchange: "Binance", volume: "$32M", percentage: 45 },
    { exchange: "Coinbase", volume: "$18M", percentage: 25 },
    { exchange: "Kraken", volume: "$11M", percentage: 15 },
    { exchange: "KuCoin", volume: "$7M", percentage: 10 },
    { exchange: "Others", volume: "$3M", percentage: 5 },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">TAO Network Statistics</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Supply</TableCell>
                <TableCell className="text-right">21,000,000 τ</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Circulating Supply</TableCell>
                <TableCell className="text-right">12,468,782 τ</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Validators</TableCell>
                <TableCell className="text-right">512</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Active Validators</TableCell>
                <TableCell className="text-right">487</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Network Emission</TableCell>
                <TableCell className="text-right">36 τ/day</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Block Time</TableCell>
                <TableCell className="text-right">12 seconds</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Stake Ratio</TableCell>
                <TableCell className="text-right">76.4%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Market Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Price (USD)</TableCell>
                  <TableCell className="text-right font-bold">$56.78</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Market Cap</TableCell>
                  <TableCell className="text-right">$1,284,653,430</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">24h Volume</TableCell>
                  <TableCell className="text-right">$78,432,562</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">24h High</TableCell>
                  <TableCell className="text-right">$58.24</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">24h Low</TableCell>
                  <TableCell className="text-right">$54.95</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">All-time High</TableCell>
                  <TableCell className="text-right">$89.32</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Exchange Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exchangeData.map((item) => (
                <div key={item.exchange} className="space-y-1">
                  <div className="flex justify-between">
                    <span>{item.exchange}</span>
                    <span>{item.volume}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-brand h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaoMarketCapTabContent;

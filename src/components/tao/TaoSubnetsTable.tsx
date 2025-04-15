
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaoSubnetInfo } from "@/services/taoStatsService";
import { TaoSubnet } from "@/services/taoSubnetService";

interface TaoSubnetsTableProps {
  subnets: (TaoSubnetInfo | TaoSubnet)[];
  isLoading: boolean;
  error: any;
  title?: string;
  hasLiveData: boolean;
}

const TaoSubnetsTable: React.FC<TaoSubnetsTableProps> = ({
  subnets,
  isLoading,
  error,
  title = "Top Subnets",
  hasLiveData
}) => {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        {hasLiveData && (
          <Badge variant="outline" className="ml-2">
            Live Data
          </Badge>
        )}
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">Loading subnet data...</div>
          ) : error ? (
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
                {subnets.length > 0 ? (
                  subnets.map((subnet) => (
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
  );
};

export default TaoSubnetsTable;

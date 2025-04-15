
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TaoStatsTabContent: React.FC = () => {
  return (
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
  );
};

export default TaoStatsTabContent;

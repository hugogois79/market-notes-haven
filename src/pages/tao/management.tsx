
import React, { useState } from "react";
import TaoPageHeader from "@/components/tao/TaoPageHeader";
import TaoNavigation from "@/components/tao/TaoNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Database, Settings, Users, Server, Shield } from "lucide-react";

const TAOManagement = () => {
  const [activeTab, setActiveTab] = useState("management");
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <TaoPageHeader 
        timestamp={new Date().toISOString()} 
        isLoading={isLoading} 
        onRefresh={handleRefresh} 
        isMockData={true}
      />
      
      <TaoNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <Tabs value={activeTab} className="w-full space-y-6">
        <TabsContent value="management" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Network Resources
                </CardTitle>
                <CardDescription>
                  Manage TAO network resources and allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>CPU Allocation</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "85%" }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <span>Memory Usage</span>
                    <span className="font-medium">62%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "62%" }}></div>
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      Resource Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Management
                </CardTitle>
                <CardDescription>
                  Manage network security and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Security Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Secure
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Last Security Scan</span>
                    <span className="text-sm text-muted-foreground">Today, 09:45 AM</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Vulnerabilities</span>
                    <span className="text-sm font-medium">None detected</span>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Security Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Validator Management
                </CardTitle>
                <CardDescription>
                  Manage validator access and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Active Validators</span>
                    <span className="font-medium">124</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Pending Approval</span>
                    <span className="font-medium text-amber-600">7</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Access Requests</span>
                    <span className="font-medium text-blue-600">3</span>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Validators
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  TAO Data Management
                </CardTitle>
                <CardDescription>
                  Manage network data and storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Storage</span>
                    <span className="font-medium">1.2 TB</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Used Storage</span>
                    <span className="font-medium">765 GB</span>
                  </div>
                  
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: "64%" }}></div>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Storage Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Configuration
                </CardTitle>
                <CardDescription>
                  Network configuration and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Network Version</span>
                    <span className="font-medium">v3.4.2</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Last Updated</span>
                    <span className="text-sm text-muted-foreground">2 days ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Update Available</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      v3.5.0
                    </span>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Update Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TAOManagement;

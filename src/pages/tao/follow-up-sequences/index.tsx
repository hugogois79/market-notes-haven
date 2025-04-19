
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TaoNavigation from "@/components/tao/TaoNavigation";
import TaoPageHeader from "@/components/tao/TaoPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SequenceBuilder from "./components/SequenceBuilder";
import SequenceTemplates from "./components/SequenceTemplates";
import SequenceAnalytics from "./components/SequenceAnalytics";
import TemplateManagement from "./components/TemplateManagement";

const FollowUpSequencesPage = () => {
  const [activeTab, setActiveTab] = useState("builder");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <TaoPageHeader 
        timestamp={new Date().toISOString()}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        isMockData={false}
      />
      
      <div className="mt-4">
        <h1 className="text-2xl font-bold">Follow-Up Sequences</h1>
        <p className="text-muted-foreground">
          Build and manage automated communication sequences for blockchain stakeholders
        </p>
      </div>

      <TaoNavigation activeTab="follow-up-sequences" onTabChange={() => {}} />

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="builder">Sequence Builder</TabsTrigger>
            <TabsTrigger value="templates">Template Library</TabsTrigger>
            <TabsTrigger value="management">Template Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <SequenceBuilder />
          </TabsContent>
          
          <TabsContent value="templates">
            <SequenceTemplates />
          </TabsContent>
          
          <TabsContent value="management">
            <TemplateManagement />
          </TabsContent>
          
          <TabsContent value="analytics">
            <SequenceAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FollowUpSequencesPage;

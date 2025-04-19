
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <TaoPageHeader 
        title="Follow-Up Sequences" 
        subtitle="Build and manage automated communication sequences for blockchain stakeholders"
      />

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

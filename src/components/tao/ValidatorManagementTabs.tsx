
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Table2, Users, Clock, LayoutGrid, StickyNote } from "lucide-react";

interface ValidatorManagementTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const ValidatorManagementTabs: React.FC<ValidatorManagementTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="border-b">
      <TabsList className="w-full justify-start h-auto">
        <TabsTrigger value="monday-crm" className="py-3">
          <Database className="mr-2 h-4 w-4" />
          CRM Dashboard
        </TabsTrigger>
        <TabsTrigger value="validators-list" className="py-3">
          <Table2 className="mr-2 h-4 w-4" />
          Validators List
        </TabsTrigger>
        <TabsTrigger value="subnets-overview" className="py-3">
          <Users className="mr-2 h-4 w-4" />
          Subnets Overview
        </TabsTrigger>
        <TabsTrigger value="contact-timeline" className="py-3">
          <Clock className="mr-2 h-4 w-4" />
          Contact Timeline
        </TabsTrigger>
        <TabsTrigger value="crm-pipeline" className="py-3">
          <LayoutGrid className="mr-2 h-4 w-4" />
          CRM Pipeline
        </TabsTrigger>
        <TabsTrigger value="notes" className="py-3">
          <StickyNote className="mr-2 h-4 w-4" />
          Notes
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default ValidatorManagementTabs;

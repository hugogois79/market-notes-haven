import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ValidatorProfileSection from "./components/ValidatorProfileSection";
import StakeManagementPanel from "./components/StakeManagementPanel";
import OpportunityMatchingSection from "./components/OpportunityMatchingSection";
import AutomationRulesSection from "./components/AutomationRulesSection";
import TemplateCommunicationSection from "./components/TemplateCommunicationSection";
import ValidatorSelector from "./components/ValidatorSelector";
import { useValidatorRelationshipData } from "./hooks/useValidatorRelationshipData";
import { Loader2 } from "lucide-react";

const ValidatorRelationshipManagement: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("profile");
  const { 
    validators,
    selectedValidator,
    setSelectedValidator,
    isLoading,
    validatorMetrics,
    validatorSubnets,
    validatorStakeHistory,
    validatorCommunication,
    recommendedSubnets,
    collaborationOpportunities,
    refreshData
  } = useValidatorRelationshipData();

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading validator data...</span>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleGoBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Validator Relationship Management</h1>
            <p className="text-muted-foreground">
              Manage validator profiles, stake, opportunities and communications
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Validators</CardTitle>
            </CardHeader>
            <CardContent>
              <ValidatorSelector 
                validators={validators}
                selectedValidator={selectedValidator}
                onSelectValidator={setSelectedValidator}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {selectedValidator ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{selectedValidator.name}</CardTitle>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    ID: {selectedValidator.id.substring(0, 8)}... • Updated: {new Date(selectedValidator.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="stake">Stake Management</TabsTrigger>
                    <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                    <TabsTrigger value="automation">Automation Rules</TabsTrigger>
                    <TabsTrigger value="templates">Communication Templates</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile">
                    <ValidatorProfileSection 
                      validator={selectedValidator}
                      metrics={validatorMetrics}
                      subnets={validatorSubnets}
                      communicationHistory={validatorCommunication}
                      refreshData={refreshData}
                    />
                  </TabsContent>

                  <TabsContent value="stake">
                    <StakeManagementPanel 
                      validator={selectedValidator}
                      stakeHistory={validatorStakeHistory}
                      validators={validators}
                    />
                  </TabsContent>

                  <TabsContent value="opportunities">
                    <OpportunityMatchingSection 
                      validator={selectedValidator}
                      recommendedSubnets={recommendedSubnets}
                      collaborationOpportunities={collaborationOpportunities}
                    />
                  </TabsContent>
                  
                  <TabsContent value="automation">
                    <AutomationRulesSection 
                      validator={selectedValidator}
                    />
                  </TabsContent>

                  <TabsContent value="templates">
                    <TemplateCommunicationSection 
                      validator={selectedValidator}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-64">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">Select a Validator</h3>
                  <p className="text-muted-foreground">
                    Choose a validator from the list to view and manage their details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidatorRelationshipManagement;


import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaoValidator } from "@/services/validators/types";
import { TaoSubnet } from "@/services/subnets/types";
import { CollaborationOpportunity } from "../hooks/useValidatorRelationshipData";
import { ExternalLink, Check } from "lucide-react";

interface OpportunityMatchingSectionProps {
  validator: TaoValidator;
  recommendedSubnets: TaoSubnet[];
  collaborationOpportunities: CollaborationOpportunity[];
}

const OpportunityMatchingSection: React.FC<OpportunityMatchingSectionProps> = ({
  validator,
  recommendedSubnets,
  collaborationOpportunities
}) => {
  return (
    <div className="space-y-6">
      {/* Recommended Subnets */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Subnets</CardTitle>
          <CardDescription>
            Subnets that match this validator's profile and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendedSubnets.length > 0 ? (
            <div className="space-y-4">
              {recommendedSubnets.map((subnet) => (
                <div key={subnet.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{subnet.name}</h3>
                      <p className="text-sm text-muted-foreground">{subnet.description || `Subnet ID: ${subnet.id}`}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      {subnet.neurons} Neurons
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex space-x-2">
                      <Badge variant="secondary">Emission: {subnet.emission}</Badge>
                      <Badge variant="secondary">Incentive: {subnet.incentive || "N/A"}</Badge>
                    </div>
                    <div>
                      <Button size="sm" variant="outline" className="mr-2">
                        <ExternalLink className="h-4 w-4 mr-1" /> Details
                      </Button>
                      <Button size="sm">
                        <Check className="h-4 w-4 mr-1" /> Join
                      </Button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-1">Match Score</h4>
                    <div className="h-2 w-full bg-gray-100 rounded-full">
                      <div 
                        className="h-2 bg-green-500 rounded-full" 
                        style={{ width: `${70 + (subnet.id % 25)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Technical Fit</span>
                      <span className="text-green-600 font-medium">{70 + (subnet.id % 25)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recommended subnets available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Collaboration Opportunities</CardTitle>
          <CardDescription>
            Potential collaborations with other validators based on complementary profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {collaborationOpportunities.length > 0 ? (
            <div className="space-y-4">
              {collaborationOpportunities.map((opportunity) => (
                <div key={opportunity.validatorId} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{opportunity.validatorName}</h3>
                      <p className="text-sm text-muted-foreground">{opportunity.reason}</p>
                    </div>
                    <Badge className="bg-purple-50 text-purple-800">
                      {opportunity.compatibilityScore}% Match
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Potential Benefits</h4>
                    <p className="text-sm text-muted-foreground">{opportunity.potentialBenefit}</p>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button size="sm" variant="outline" className="mr-2">
                      View Profile
                    </Button>
                    <Button size="sm">
                      Initiate Contact
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No collaboration opportunities found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Growth & Investment Opportunities</CardTitle>
          <CardDescription>
            Potential areas for growth based on performance metrics and market trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 pb-1">
              <h3 className="font-medium">Hardware Upgrade Recommendation</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Based on performance metrics, upgrading CPU capacity could improve processing
                by up to 15%, allowing participation in more compute-intensive subnets.
              </p>
              <div className="text-sm">
                <span className="text-muted-foreground">Estimated ROI:</span> <Badge variant="outline">5.2x</Badge>
                <span className="ml-4 text-muted-foreground">Timeframe:</span> <Badge variant="outline">3 months</Badge>
              </div>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4 pb-1">
              <h3 className="font-medium">Stake Consolidation Strategy</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Consolidating stake into fewer, higher-performing subnets could increase
                overall returns by reducing operational overhead.
              </p>
              <div className="text-sm">
                <span className="text-muted-foreground">Estimated ROI:</span> <Badge variant="outline">2.8x</Badge>
                <span className="ml-4 text-muted-foreground">Timeframe:</span> <Badge variant="outline">6 months</Badge>
              </div>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 pb-1">
              <h3 className="font-medium">Specialization Opportunity</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Focusing on {validator.name.includes("AI") || validator.name.length % 2 === 0 ? "Machine Learning" : "Computer Vision"} subnets
                aligns with your validator's performance profile and could open up premium delegation opportunities.
              </p>
              <div className="text-sm">
                <span className="text-muted-foreground">Market Potential:</span> <Badge variant="outline">High</Badge>
                <span className="ml-4 text-muted-foreground">Competition:</span> <Badge variant="outline">Medium</Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button className="w-full">Generate Detailed Investment Analysis</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpportunityMatchingSection;

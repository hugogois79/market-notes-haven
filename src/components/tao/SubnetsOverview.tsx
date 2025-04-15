
import React from "react";
import { TaoSubnet } from "@/services/taoSubnetService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  Users, 
  PlusCircle 
} from "lucide-react";

interface SubnetsOverviewProps {
  subnets: TaoSubnet[];
  validatorsBySubnet: Record<number, string[]>;
  validatorNames: Record<string, string>;
  onViewSubnet: (subnet: TaoSubnet) => void;
  onAddValidator: (subnet: TaoSubnet) => void;
}

const SubnetsOverview: React.FC<SubnetsOverviewProps> = ({
  subnets,
  validatorsBySubnet,
  validatorNames,
  onViewSubnet,
  onAddValidator,
}) => {
  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return "bg-violet-100 text-violet-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      case 3:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {subnets.map((subnet) => (
        <Card key={subnet.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <Badge className={`${getTierColor(subnet.tier)} mb-2 border-0`}>
                  Tier {subnet.tier}
                </Badge>
                <CardTitle>{subnet.name}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewSubnet(subnet)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {subnet.description || "No description available"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Neurons:</span>
                <span className="font-medium">{subnet.neurons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Emission:</span>
                <span className="font-medium">{subnet.emission}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Incentive:</span>
                <span className="font-medium">{subnet.incentive}</span>
              </div>
              
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-1" /> Validators
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onAddValidator(subnet)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                {validatorsBySubnet[subnet.id]?.length > 0 ? (
                  <div className="space-y-1">
                    {validatorsBySubnet[subnet.id].slice(0, 3).map((validatorId) => (
                      <div key={validatorId} className="text-sm">
                        {validatorNames[validatorId] || "Unknown Validator"}
                      </div>
                    ))}
                    {validatorsBySubnet[subnet.id].length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        +{validatorsBySubnet[subnet.id].length - 3} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No validators linked
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SubnetsOverview;

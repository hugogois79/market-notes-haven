
import React from "react";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, MoreHorizontal, FileText, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaoValidator, TaoSubnet } from "@/services/taoValidatorService";

interface SubnetsTableSectionProps {
  subnets: TaoSubnet[];
  validatorsBySubnet: Record<number, string[]>;
  validatorNames: Record<string, string>;
  validators: TaoValidator[];
  onAddNote: (validator?: TaoValidator, subnet?: TaoSubnet) => void;
  onViewSubnet?: (subnet: TaoSubnet) => void;
}

const SubnetsTableSection: React.FC<SubnetsTableSectionProps> = ({
  subnets,
  validatorsBySubnet,
  validatorNames,
  onAddNote,
  onViewSubnet,
}) => {
  return (
    <AccordionItem value="subnets" className="border-b-0">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 data-[state=open]:bg-gray-50">
        <div className="flex items-center">
          <Layers className="h-5 w-5 mr-2 text-purple-600" />
          <span className="font-medium">Subnets</span>
          <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
            {subnets.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-0">
        <div className="border-t">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead>Validators</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Neurons</TableHead>
                  <TableHead>Emission</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subnets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      No subnets found
                    </TableCell>
                  </TableRow>
                ) : (
                  subnets.map((subnet) => {
                    const linkedValidatorIds = validatorsBySubnet[subnet.id] || [];
                    
                    return (
                      <TableRow key={subnet.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {subnet.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {subnet.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {linkedValidatorIds.length > 0 ? (
                              linkedValidatorIds.slice(0, 3).map(validatorId => (
                                <Badge key={validatorId} variant="outline" className="bg-gray-50">
                                  {validatorNames[validatorId] || "Unknown"}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No validators</span>
                            )}
                            {linkedValidatorIds.length > 3 && (
                              <Badge variant="outline" className="bg-gray-50">
                                +{linkedValidatorIds.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                            Tier {subnet.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>{subnet.neurons}</TableCell>
                        <TableCell>{subnet.emission}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onAddNote(undefined, subnet)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Add Note
                                </DropdownMenuItem>
                                {onViewSubnet && (
                                  <DropdownMenuItem onClick={() => onViewSubnet(subnet)}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubnetsTableSection;

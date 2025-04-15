
import React, { useState } from "react";
import { TaoValidator } from "@/services/taoValidatorService";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, MessageCircle, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ValidatorsListProps {
  validators: TaoValidator[];
  onView: (validator: TaoValidator) => void;
  onEdit: (validator: TaoValidator) => void;
  onDelete: (validator: TaoValidator) => void;
  onAddContactLog: (validator: TaoValidator) => void;
}

const getCrmStageBadgeColor = (stage: TaoValidator["crm_stage"]) => {
  switch (stage) {
    case "Prospect":
      return "bg-blue-100 text-blue-800";
    case "Contacted":
      return "bg-purple-100 text-purple-800";
    case "Follow-up":
      return "bg-yellow-100 text-yellow-800";
    case "Negotiation":
      return "bg-orange-100 text-orange-800";
    case "Active":
      return "bg-green-100 text-green-800";
    case "Inactive":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPriorityBadgeColor = (priority: TaoValidator["priority"]) => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-800";
    case "Medium":
      return "bg-orange-100 text-orange-800";
    case "Low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ValidatorsList: React.FC<ValidatorsListProps> = ({
  validators,
  onView,
  onEdit,
  onDelete,
  onAddContactLog,
}) => {
  const [filter, setFilter] = useState<{
    crmStage?: TaoValidator["crm_stage"];
    priority?: TaoValidator["priority"];
  }>({});

  const filteredValidators = validators.filter((validator) => {
    if (filter.crmStage && validator.crm_stage !== filter.crmStage) return false;
    if (filter.priority && validator.priority !== filter.priority) return false;
    return true;
  });

  const clearFilters = () => setFilter({});

  const crmStages: TaoValidator["crm_stage"][] = [
    "Prospect",
    "Contacted",
    "Follow-up",
    "Negotiation",
    "Active",
    "Inactive",
  ];

  const priorities: TaoValidator["priority"][] = ["High", "Medium", "Low"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 pb-4">
        <div>
          <span className="text-sm font-medium mr-2">CRM Stage:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {filter.crmStage || "All Stages"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {crmStages.map((stage) => (
                <DropdownMenuItem
                  key={stage}
                  onClick={() => setFilter({ ...filter, crmStage: stage })}
                >
                  {stage}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <span className="text-sm font-medium mr-2">Priority:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {filter.priority || "All Priorities"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {priorities.map((priority) => (
                <DropdownMenuItem
                  key={priority}
                  onClick={() => setFilter({ ...filter, priority })}
                >
                  {priority}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {(filter.crmStage || filter.priority) && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>CRM Stage</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredValidators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No validators found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredValidators.map((validator) => (
                <TableRow key={validator.id}>
                  <TableCell className="font-medium">{validator.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${getCrmStageBadgeColor(
                        validator.crm_stage
                      )} border-0`}
                    >
                      {validator.crm_stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getPriorityBadgeColor(
                        validator.priority
                      )} border-0`}
                    >
                      {validator.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {validator.email && (
                        <a
                          href={`mailto:${validator.email}`}
                          className="text-blue-600 hover:text-blue-800"
                          title={validator.email}
                        >
                          <Mail size={16} />
                        </a>
                      )}
                      {validator.telegram && (
                        <a
                          href={`https://t.me/${validator.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title={validator.telegram}
                        >
                          <MessageCircle size={16} />
                        </a>
                      )}
                      {validator.linkedin && (
                        <a
                          href={`https://linkedin.com/in/${validator.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title={`linkedin.com/in/${validator.linkedin}`}
                        >
                          <Link2 size={16} />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(validator)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(validator)}>
                          Edit Validator
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddContactLog(validator)}>
                          Add Contact Log
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(validator)}
                          className="text-red-600"
                        >
                          Delete Validator
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ValidatorsList;

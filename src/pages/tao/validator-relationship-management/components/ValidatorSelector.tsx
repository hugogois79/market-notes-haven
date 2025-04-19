
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaoValidator } from "@/services/validators/types";
import { Search } from "lucide-react";

interface ValidatorSelectorProps {
  validators: TaoValidator[];
  selectedValidator: TaoValidator | null;
  onSelectValidator: (validator: TaoValidator) => void;
}

const ValidatorSelector: React.FC<ValidatorSelectorProps> = ({
  validators,
  selectedValidator,
  onSelectValidator
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter validators based on search query
  const filteredValidators = validators.filter(validator => 
    validator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (validator.email && validator.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search validators..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-1">
          {filteredValidators.length > 0 ? (
            filteredValidators.map(validator => (
              <Button
                key={validator.id}
                variant={selectedValidator?.id === validator.id ? "secondary" : "ghost"}
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => onSelectValidator(validator)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{validator.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {validator.organization_type} • {validator.crm_stage}
                  </span>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No validators found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ValidatorSelector;

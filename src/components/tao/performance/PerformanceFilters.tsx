
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { TaoSubnetInfo } from '@/services/tao/types';

interface FiltersType {
  timeRange: string;
  subnetCategories: number[];
  performanceThreshold: number;
  sortBy: string;
}

interface PerformanceFiltersProps {
  filters: FiltersType;
  updateFilters: (filters: Partial<FiltersType>) => void;
  subnets: TaoSubnetInfo[];
  onApply: () => void;
}

const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({
  filters,
  updateFilters,
  subnets,
  onApply
}) => {
  // Local state for filters before applying
  const [localFilters, setLocalFilters] = useState<FiltersType>(filters);
  
  // Subnet categories are grouped by tier or function
  const subnetGroups = [
    { id: 'primary', name: 'Primary Subnets', netuids: [0, 1, 2, 3, 4, 5] },
    { id: 'specialized', name: 'Specialized', netuids: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    { id: 'ai', name: 'AI-focused', netuids: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25] },
    { id: 'infrastructure', name: 'Infrastructure', netuids: [26, 27, 28, 29, 30, 31, 32, 33] }
  ];
  
  // Update local filter state
  const updateLocalFilters = (updates: Partial<FiltersType>) => {
    setLocalFilters(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  // Handle checkbox changes for subnet categories
  const handleSubnetGroupChange = (checked: boolean, netuids: number[]) => {
    if (checked) {
      // Add all netuids from the group
      const newSelection = [...localFilters.subnetCategories];
      netuids.forEach(netuid => {
        if (!newSelection.includes(netuid)) {
          newSelection.push(netuid);
        }
      });
      updateLocalFilters({ subnetCategories: newSelection });
    } else {
      // Remove all netuids from the group
      const newSelection = localFilters.subnetCategories.filter(
        netuid => !netuids.includes(netuid)
      );
      updateLocalFilters({ subnetCategories: newSelection });
    }
  };
  
  // Check if a group is selected (if all netuids in the group are in the selection)
  const isGroupSelected = (netuids: number[]) => {
    return netuids.every(netuid => localFilters.subnetCategories.includes(netuid));
  };
  
  // Check if a group is indeterminate (if some but not all netuids in the group are in the selection)
  const isGroupIndeterminate = (netuids: number[]) => {
    const selectedCount = netuids.filter(netuid => 
      localFilters.subnetCategories.includes(netuid)
    ).length;
    return selectedCount > 0 && selectedCount < netuids.length;
  };
  
  // Handle performance threshold slider change
  const handleThresholdChange = (value: number[]) => {
    updateLocalFilters({ performanceThreshold: value[0] });
  };
  
  // Apply the selected filters
  const applyFilters = () => {
    updateFilters(localFilters);
    onApply();
  };
  
  // Reset all filters
  const resetFilters = () => {
    const resetState = {
      timeRange: '7d',
      subnetCategories: [],
      performanceThreshold: 0,
      sortBy: 'emissions'
    };
    setLocalFilters(resetState);
    updateFilters(resetState);
  };

  // Custom checkbox component that supports visual indeterminate state
  const IndeterminateCheckbox = ({ id, checked, indeterminate, onCheckedChange, label, description }: {
    id: string;
    checked: boolean;
    indeterminate: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: string;
    description: string;
  }) => {
    const checkboxRef = useRef<HTMLButtonElement>(null);
    
    useEffect(() => {
      if (checkboxRef.current) {
        // Use DOM API to set the indeterminate state
        checkboxRef.current.dataset.state = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';
        checkboxRef.current.ariaChecked = indeterminate ? 'mixed' : checked ? 'true' : 'false';
      }
    }, [checked, indeterminate]);
    
    return (
      <div className="flex items-start space-x-2">
        <Checkbox
          id={id}
          checked={checked}
          ref={checkboxRef}
          onCheckedChange={(value) => onCheckedChange(!!value)}
          className={indeterminate ? "data-[state=checked]:bg-primary/50" : ""}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Filter Subnets</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Subnet Categories</Label>
          
          <div className="space-y-2">
            {subnetGroups.map(group => (
              <IndeterminateCheckbox
                key={group.id}
                id={`group-${group.id}`}
                checked={isGroupSelected(group.netuids)}
                indeterminate={isGroupIndeterminate(group.netuids)}
                onCheckedChange={(checked) => handleSubnetGroupChange(checked, group.netuids)}
                label={group.name}
                description={`${group.netuids.length} subnets`}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Performance Threshold</Label>
            <span className="text-sm">
              {localFilters.performanceThreshold > 0 ? '+' : ''}
              {localFilters.performanceThreshold}%
            </span>
          </div>
          
          <Slider
            value={[localFilters.performanceThreshold]}
            min={-20}
            max={20}
            step={1}
            onValueChange={handleThresholdChange}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-20%</span>
            <span>0%</span>
            <span>+20%</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={resetFilters}>
          Reset
        </Button>
        <Button size="sm" onClick={applyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default PerformanceFilters;

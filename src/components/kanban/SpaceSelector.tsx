import React from 'react';
import { KanbanSpace } from '@/services/kanbanService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderKanban } from 'lucide-react';

interface SpaceSelectorProps {
  spaces: KanbanSpace[];
  currentSpaceId: string | null;
  onSpaceChange: (spaceId: string | null) => void;
}

export const SpaceSelector: React.FC<SpaceSelectorProps> = ({
  spaces,
  currentSpaceId,
  onSpaceChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <FolderKanban className="h-5 w-5 text-muted-foreground" />
      <Select 
        value={currentSpaceId || 'all'} 
        onValueChange={(value) => onSpaceChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a space" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Boards</SelectItem>
          <SelectItem value="">Unorganized Boards</SelectItem>
          {spaces.map((space) => (
            <SelectItem key={space.id} value={space.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: space.color || '#0a4a6b' }}
                />
                {space.title}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

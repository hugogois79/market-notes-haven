
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BulkTagActionsProps {
  bulkSelectedTags: string[];
  onClearSelection: () => void;
  categories: string[];
  bulkCategoryAssignOpen: boolean;
  onBulkCategoryAssignOpen: (open: boolean) => void;
  bulkSelectedCategory: string | null;
  onBulkSelectedCategoryChange: (category: string | null) => void;
  onNewCategoryDialog: (show: boolean) => void;
  onBulkUpdateCategories: () => void;
  isBulkUpdating: boolean;
}

const BulkTagActions = ({
  bulkSelectedTags,
  onClearSelection,
  categories,
  bulkCategoryAssignOpen,
  onBulkCategoryAssignOpen,
  bulkSelectedCategory,
  onBulkSelectedCategoryChange,
  onNewCategoryDialog,
  onBulkUpdateCategories,
  isBulkUpdating
}: BulkTagActionsProps) => {
  if (bulkSelectedTags.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 ml-auto">
      <span className="text-sm font-medium">{bulkSelectedTags.length} tags selected</span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearSelection}
        className="h-8 px-2"
      >
        Clear selection
      </Button>
      <Dialog open={bulkCategoryAssignOpen} onOpenChange={onBulkCategoryAssignOpen}>
        <DialogTrigger asChild>
          <Button variant="brand" size="sm" className="h-8 gap-1">
            <FolderOpen size={14} />
            Assign to category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Category</DialogTitle>
            <DialogDescription>
              Assign {bulkSelectedTags.length} selected tags to a category
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={bulkSelectedCategory !== null ? bulkSelectedCategory : "none"}
              onValueChange={(value) => {
                if (value === "new") {
                  onNewCategoryDialog(true);
                } else {
                  onBulkSelectedCategoryChange(value === "none" ? null : value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category (remove existing)</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
                <SelectItem value="new" className="text-[#1EAEDB] font-medium">+ Create new category</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => onBulkCategoryAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="brand" 
              onClick={onBulkUpdateCategories}
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? "Updating..." : "Update Categories"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkTagActions;

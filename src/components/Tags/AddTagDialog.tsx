
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTag: string;
  onNewTagChange: (tag: string) => void;
  selectedCategory: string | null;
  onSelectedCategoryChange: (category: string | null) => void;
  categories: string[];
  onNewCategoryDialog: (show: boolean) => void;
  onAddTag: () => void;
  isAddingTag: boolean;
}

const AddTagDialog = ({
  open,
  onOpenChange,
  newTag,
  onNewTagChange,
  selectedCategory,
  onSelectedCategoryChange,
  categories,
  onNewCategoryDialog,
  onAddTag,
  isAddingTag
}: AddTagDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="brand" className="gap-2">
          <Plus size={16} />
          Add Tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tag</DialogTitle>
          <DialogDescription>
            Create a new tag to organize your notes
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Input
              placeholder="Enter tag name"
              value={newTag}
              onChange={(e) => onNewTagChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onAddTag();
                }
              }}
            />
          </div>
          
          <div>
            <Select
              value={selectedCategory !== null ? selectedCategory : "none"}
              onValueChange={(value) => {
                if (value === "new") {
                  onNewCategoryDialog(true);
                } else {
                  onSelectedCategoryChange(value === "none" ? null : value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
                <SelectItem value="new" className="text-[#1EAEDB] font-medium">+ Create new category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="brand" 
            onClick={onAddTag}
            disabled={isAddingTag}
          >
            {isAddingTag ? "Adding..." : "Add Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTagDialog;

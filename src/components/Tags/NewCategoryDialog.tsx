
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface NewCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCategory: string;
  onNewCategoryChange: (category: string) => void;
  onCreateCategory: () => void;
}

const NewCategoryDialog = ({
  open,
  onOpenChange,
  newCategory,
  onNewCategoryChange,
  onCreateCategory
}: NewCategoryDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Add a new category to organize your tags
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => onNewCategoryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCategory.trim()) {
                onCreateCategory();
              }
            }}
          />
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
            onClick={onCreateCategory}
            disabled={!newCategory.trim()}
          >
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewCategoryDialog;

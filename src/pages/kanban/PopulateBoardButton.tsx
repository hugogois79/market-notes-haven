import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { populateDabmarBoard } from "@/utils/populateDabmarBoard";

interface PopulateBoardButtonProps {
  boardId: string;
}

export const PopulateBoardButton = ({ boardId }: PopulateBoardButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePopulate = async () => {
    try {
      setIsLoading(true);
      const result = await populateDabmarBoard(boardId);
      toast.success(`Board populated! ${result.listsCreated} lists and ${result.cardsCreated} cards created.`);
      
      // Refresh the page to show the new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to populate board. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePopulate} 
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Populating...
        </>
      ) : (
        'Populate DABMAR Board'
      )}
    </Button>
  );
};

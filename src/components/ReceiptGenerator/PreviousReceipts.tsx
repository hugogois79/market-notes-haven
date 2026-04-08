import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Trash2, 
  Eye, 
  Calendar,
  Hash,
  Loader2,
  AlertCircle
} from "lucide-react";
import { fetchUserReceipts, deleteReceipt, type Receipt } from "@/services/receiptService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PreviousReceiptsProps {
  onLoadReceipt: (receipt: Receipt) => void;
}

export const PreviousReceipts = ({ onLoadReceipt }: PreviousReceiptsProps) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error('Failed to load receipts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const success = await deleteReceipt(id);
      if (success) {
        setReceipts(receipts.filter(r => r.id !== id));
        toast.success('Receipt deleted successfully');
      } else {
        toast.error('Failed to delete receipt');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast.error('Failed to delete receipt');
    } finally {
      setDeletingId(null);
      setReceiptToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (receipts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No receipts yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Generate and save your first receipt to see it appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Previous Receipts ({receipts.length})
          </h3>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-3">
            {receipts.map((receipt) => (
              <Card key={receipt.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-sm font-mono text-primary">
                        <Hash className="h-3 w-3" />
                        {receipt.receipt_number}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(receipt.created_at)}
                      </div>
                    </div>
                    
                    {receipt.beneficiary_name && (
                      <p className="text-sm font-medium mb-1 truncate">
                        {receipt.beneficiary_name}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {receipt.payment_amount && (
                        <span className="font-semibold">{receipt.payment_amount}</span>
                      )}
                      {receipt.payment_reference && (
                        <span className="truncate">Ref: {receipt.payment_reference}</span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {receipt.raw_content.substring(0, 100)}...
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onLoadReceipt(receipt)}
                      title="Load receipt"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReceiptToDelete(receipt.id)}
                      disabled={deletingId === receipt.id}
                      title="Delete receipt"
                    >
                      {deletingId === receipt.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <AlertDialog open={!!receiptToDelete} onOpenChange={() => setReceiptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Receipt
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this receipt? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => receiptToDelete && handleDelete(receiptToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

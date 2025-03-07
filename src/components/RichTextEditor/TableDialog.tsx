
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface TableDialogProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tableRows: number;
  setTableRows: React.Dispatch<React.SetStateAction<number>>;
  tableColumns: number;
  setTableColumns: React.Dispatch<React.SetStateAction<number>>;
  tableCaption: string;
  setTableCaption: React.Dispatch<React.SetStateAction<string>>;
  tableHeaderEnabled: boolean;
  setTableHeaderEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  handleInsertTable: () => void;
}

const TableDialog: React.FC<TableDialogProps> = ({
  isOpen,
  setIsOpen,
  tableRows,
  setTableRows,
  tableColumns,
  setTableColumns,
  tableCaption,
  setTableCaption,
  tableHeaderEnabled,
  setTableHeaderEnabled,
  handleInsertTable
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
          <DialogDescription>
            Configure your table properties
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="rows" className="text-sm font-medium">
                Rows
              </label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="20"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="columns" className="text-sm font-medium">
                Columns
              </label>
              <Input
                id="columns"
                type="number"
                min="1"
                max="10"
                value={tableColumns}
                onChange={(e) => setTableColumns(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="caption" className="text-sm font-medium">
              Caption (optional)
            </label>
            <Input
              id="caption"
              placeholder="Table caption"
              value={tableCaption}
              onChange={(e) => setTableCaption(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="header"
              checked={tableHeaderEnabled}
              onChange={(e) => setTableHeaderEnabled(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="header" className="text-sm font-medium">
              Include header row
            </label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsertTable}>Insert Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableDialog;

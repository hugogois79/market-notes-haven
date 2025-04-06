import React from "react";
import ToolbarButton from "./ToolbarButton";
import { Link, Image, Table, Text, SeparatorVertical, CheckSquare } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InsertSectionProps {
  formatLink?: () => void;
  formatImage?: () => void;
  insertTable?: () => void;
  formatTableCells?: (alignment: string) => void;
  insertVerticalSeparator?: () => void;
  onInsertTable?: () => void;
  onInsertCheckbox?: () => void;
  onInsertSeparator?: () => void;
}

const InsertSection: React.FC<InsertSectionProps> = ({
  formatLink,
  formatImage,
  insertTable,
  formatTableCells,
  insertVerticalSeparator,
  onInsertTable,
  onInsertCheckbox,
  onInsertSeparator
}) => {
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  
  const handleInsertTable = () => {
    if (insertTable) {
      insertTable();
    } else if (onInsertTable) {
      onInsertTable();
    }
  };

  const handleInsertSeparator = () => {
    if (insertVerticalSeparator) {
      insertVerticalSeparator();
    } else if (onInsertSeparator) {
      onInsertSeparator();
    }
  };
  
  const handleImageButtonClick = () => {
    if (formatImage) {
      // If we're using the legacy method, just call it directly
      formatImage();
    } else {
      // Otherwise open our enhanced dialog
      setImageDialogOpen(true);
      setImageUrl("");
      setSelectedFile(null);
    }
  };
  
  const handleInsertImage = () => {
    if (selectedFile) {
      // Get a unique filename to avoid collisions
      const timestamp = new Date().getTime();
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const fileName = `${timestamp}-${safeFileName}`;
      
      setIsUploading(true);
      
      // Create a FormData object to upload the file
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      // Use fetch to upload the file to the server
      fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
        .then(response => response.json())
        .then(data => {
          // Insert the uploaded image URL into the editor
          if (data.url) {
            document.execCommand("insertImage", false, data.url);
          }
          setImageDialogOpen(false);
          setIsUploading(false);
        })
        .catch(error => {
          console.error("Error uploading image:", error);
          setIsUploading(false);
          // Fallback: if upload fails, try to insert as data URL
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === "string") {
              document.execCommand("insertImage", false, e.target.result);
              setImageDialogOpen(false);
            }
          };
          reader.readAsDataURL(selectedFile);
        });
    } else if (imageUrl) {
      // Insert image by URL
      document.execCommand("insertImage", false, imageUrl);
      setImageDialogOpen(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <>
      <div className="flex items-center gap-0.5">
        {formatLink && <ToolbarButton icon={Link} onClick={formatLink} tooltip="Insert Link" />}
        <ToolbarButton icon={Image} onClick={handleImageButtonClick} tooltip="Insert Image" />
        <ToolbarButton icon={Table} onClick={handleInsertTable} tooltip="Insert Table" />
        {formatTableCells && (
          <ToolbarButton 
            icon={Text} 
            onClick={() => formatTableCells('left')}
            tooltip="Format Table Cells" 
          />
        )}
        <ToolbarButton icon={SeparatorVertical} onClick={handleInsertSeparator} tooltip="Insert Separator" />
      </div>
      
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">Image URL</TabsTrigger>
              <TabsTrigger value="upload">Upload Image</TabsTrigger>
            </TabsList>
            
            <TabsContent value="url" className="py-4">
              <Input
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full"
              />
            </TabsContent>
            
            <TabsContent value="upload" className="py-4">
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="w-full"
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-500">
                  Selected: {selectedFile.name}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleInsertImage} disabled={(!imageUrl && !selectedFile) || isUploading}>
              {isUploading ? "Uploading..." : "Insert Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InsertSection;

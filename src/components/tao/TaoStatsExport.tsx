
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clipboard, Download, Check, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { TaoStatsUpdate } from '@/services/taoStatsService';
import { copyTaoStatsToClipboard, downloadTaoStatsAsMarkdown, generateTaoStatsTanaMarkdown } from '@/utils/taoMarkdownUtils';
import { Textarea } from '@/components/ui/textarea';

interface TaoStatsExportProps {
  stats: TaoStatsUpdate;
}

const TaoStatsExport: React.FC<TaoStatsExportProps> = ({ stats }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const handleCopyToClipboard = async () => {
    const success = await copyTaoStatsToClipboard(stats);
    if (success) {
      setIsCopied(true);
      toast.success('TAO stats copied to clipboard in Tana format');
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error('Failed to copy TAO stats to clipboard');
    }
  };
  
  const handleDownload = () => {
    downloadTaoStatsAsMarkdown(stats);
    toast.success('TAO stats downloaded in Tana format');
  };
  
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  const markdown = generateTaoStatsTanaMarkdown(stats);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Layers className="h-5 w-5 mr-2" />
          Export TAO Stats for Tana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPreview && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Preview:</div>
            <Textarea 
              value={markdown} 
              readOnly 
              className="font-mono text-sm h-48"
            />
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <Button onClick={togglePreview} variant="outline">
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={handleCopyToClipboard} className="flex-1">
          {isCopied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Clipboard className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </>
          )}
        </Button>
        <Button onClick={handleDownload} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaoStatsExport;

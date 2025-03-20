
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SummaryDisplayProps {
  summary: string;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Summary copied to clipboard!");
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  if (!summary) {
    return (
      <div className="p-4 text-center bg-[#F1F0FB]/50 rounded-md">
        <p className="text-sm text-gray-600">
          Click "Generate financial summary" to create an AI-powered analysis of your financial notes.
        </p>
      </div>
    );
  }
  
  return (
    <Card className="relative p-4 bg-[#F1F0FB] border-0 rounded-md">
      <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
        {summary.split('**').map((part, index) => {
          // If the index is odd, it's a bold part
          return index % 2 === 1 ? (
            <strong key={index} className="text-blue-800">{part}</strong>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 hover:bg-[#E3E1F6]"
        onClick={copyToClipboard}
      >
        {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
      </Button>
    </Card>
  );
};

export default SummaryDisplay;

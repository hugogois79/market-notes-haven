
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Check, Info } from 'lucide-react';

interface InstallConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const InstallConfirmation = ({ open, onOpenChange, onConfirm }: InstallConfirmationProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-[#1EAEDB] bg-[#0D1117] text-white">
        <DialogHeader className="border-b border-gray-800 pb-4">
          <DialogTitle className="text-xl font-bold text-[#1EAEDB]">Install Market Notes Haven</DialogTitle>
          <DialogDescription className="text-gray-400">
            A powerful platform for your market insights
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-4 py-4">
          <div className="bg-[#1EAEDB]/10 p-3 rounded-lg">
            <img 
              src="/icons/icon-192x192.png" 
              alt="App icon" 
              className="w-16 h-16 rounded-md"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium">Market Notes Haven</h3>
            <p className="text-sm text-gray-400">Track market insights even when offline</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-xs bg-[#1EAEDB]/20 text-[#1EAEDB] px-2 py-1 rounded">
                <Info size={12} className="mr-1" />
                PWA Enabled
              </div>
              <span className="text-xs text-gray-500">v2.0.0</span>
            </div>
          </div>
        </div>
        
        <div className="bg-[#171B22] rounded-lg p-4 text-sm">
          <div className="flex items-start">
            <Check size={16} className="text-green-500 mt-0.5 mr-2 shrink-0" />
            <span>Access all features even without internet connection</span>
          </div>
          <div className="flex items-start mt-2">
            <Check size={16} className="text-green-500 mt-0.5 mr-2 shrink-0" />
            <span>Quick access from your home screen</span>
          </div>
          <div className="flex items-start mt-2">
            <Check size={16} className="text-green-500 mt-0.5 mr-2 shrink-0" />
            <span>Native app-like experience</span>
          </div>
        </div>
        
        <DialogFooter className="flex sm:justify-between border-t border-gray-800 pt-4 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-gradient-to-r from-[#1EAEDB] to-[#0FA0CE] hover:from-[#0FA0CE] hover:to-[#0D92BE] text-white border-none"
          >
            Install Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstallConfirmation;


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
import { Check, Shield, ExternalLink } from 'lucide-react';

interface InstallConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const InstallConfirmation = ({ open, onOpenChange, onConfirm }: InstallConfirmationProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-[#1A1D21] border dark:border-gray-700 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4">
          <div className="flex items-center gap-3">
            <img 
              src="/icons/icon-192x192.png" 
              alt="App icon" 
              className="w-12 h-12 rounded-lg border-2 border-white/20 shadow-lg"
            />
            <div>
              <h3 className="text-lg font-medium text-white">Market Notes Haven</h3>
              <p className="text-sm text-white/80">Install desktop app</p>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h4 className="text-sm font-medium mb-2">Why install Market Notes Haven?</h4>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-start">
              <div className="mt-0.5 mr-3 bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full">
                <Check size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Work offline</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Access your notes without internet</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-0.5 mr-3 bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full">
                <Check size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Desktop integration</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Launch directly from your dock or start menu</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-0.5 mr-3 bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full">
                <Check size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Enhanced performance</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Faster load times and dedicated window</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300 mb-4">
            <Shield size={14} />
            <span>Your data remains secure and synchronized across all your devices</span>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between border-t border-gray-200 dark:border-gray-700 p-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="mb-2 sm:mb-0 order-1 sm:order-none"
          >
            Cancel
          </Button>
          
          <div className="flex gap-2 order-0 sm:order-none mb-3 sm:mb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(window.location.href, '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink size={14} />
              Open in new window
            </Button>
            
            <Button
              type="button"
              onClick={onConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              Install app
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstallConfirmation;

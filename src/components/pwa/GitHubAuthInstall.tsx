
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Github, ChevronRight, Shield, Download } from 'lucide-react';

interface GitHubAuthInstallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: () => void;
}

const GitHubAuthInstall = ({ open, onOpenChange, onInstall }: GitHubAuthInstallProps) => {
  const handleGitHubAuth = async () => {
    try {
      // For demo purposes, we'll just trigger the install directly
      onInstall();
    } catch (error) {
      console.error('GitHub authentication failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-[#1A1D21] border dark:border-gray-700 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-black p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white p-2 rounded-lg">
              <Github className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">GitHub Sync</h3>
              <p className="text-sm text-white/80">Web3 Wallet Integration</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg text-white/90 text-sm">
            <span>Install via GitHub Protocol</span>
            <ChevronRight size={16} />
          </div>
        </div>
        
        <div className="p-4">
          <h4 className="text-sm font-medium mb-2">Secure installation via GitHub protocol</h4>
          
          <div className="space-y-3 mb-4">
            <p className="text-sm">Similar to how Safe Gnosis and Hyperliquid work, this installation:</p>
            <ul className="list-disc pl-5 text-sm space-y-1.5">
              <li>Creates a verified application bundle</li>
              <li>Syncs with GitHub for version control</li>
              <li>Enables secure updates through GitHub protocol</li>
              <li>Adds native-like integration with your browser</li>
              <li>Supports Web3 authentication patterns</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3 flex items-center gap-2 text-xs text-gray-800 dark:text-gray-300 mb-4">
            <Shield className="w-4 h-4 text-green-500" />
            <p>Installation verified through GitHub's security protocols</p>
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
          
          <Button
            type="button"
            onClick={handleGitHubAuth}
            className="bg-black hover:bg-gray-800 text-white"
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Install via GitHub
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GitHubAuthInstall;

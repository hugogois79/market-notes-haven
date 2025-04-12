
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
import { Github } from 'lucide-react';

interface GitHubAuthInstallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: () => void;
}

const GitHubAuthInstall = ({ open, onOpenChange, onInstall }: GitHubAuthInstallProps) => {
  const handleGitHubAuth = async () => {
    try {
      // This would typically redirect to GitHub OAuth flow
      // For demo purposes, we'll just trigger the install directly
      onInstall();
    } catch (error) {
      console.error('GitHub authentication failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-[#1A1D21] border dark:border-gray-700 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-black p-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <Github className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">GitHub Sync</h3>
              <p className="text-sm text-white/80">Install via GitHub</p>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h4 className="text-sm font-medium mb-2">Sync with GitHub for enhanced features</h4>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm">Connecting with GitHub allows you to:</p>
            <ul className="list-disc pl-5 text-sm">
              <li>Sync your notes across devices</li>
              <li>Collaborate with team members</li>
              <li>Version control your market notes</li>
              <li>Backup and restore easily</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3 flex items-center gap-2 text-xs text-gray-800 dark:text-gray-300 mb-4">
            <p>Your GitHub account will only be used for authentication. We don't store your GitHub password.</p>
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
            <Github className="mr-2 h-4 w-4" />
            Authenticate with GitHub
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GitHubAuthInstall;

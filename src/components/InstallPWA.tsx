
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, ChevronDown, PlusCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import IOSInstallInstructions from './pwa/IOSInstallInstructions';
import AndroidInstallInstructions from './pwa/AndroidInstallInstructions';
import InstallConfirmation from './pwa/InstallConfirmation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const InstallPWA = () => {
  const { isInstallable, isInstalled, triggerInstall, getPlatformInfo } = usePwaInstall();
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);

  const handleInstallClick = () => {
    console.log('Install button clicked, installable:', isInstallable, 'installed:', isInstalled);
    
    if (isInstalled) {
      toast.info('Application is already installed');
      return;
    }
    
    const { isIOS, isAndroid } = getPlatformInfo();
    console.log('Platform info:', { isIOS, isAndroid });
    
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    
    if (isAndroid && !isInstallable) {
      setShowAndroidInstructions(true);
      return;
    }
    
    if (isInstallable) {
      setShowInstallDialog(true);
    } else {
      toast.warning('Installation is not available at the moment');
    }
  };

  const confirmInstallation = async () => {
    try {
      const success = await triggerInstall();
      if (success) {
        // Notify service worker about installation
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'APP_INSTALLED'
          });
        }
      }
    } catch (error) {
      console.error('Installation error:', error);
      toast.error('Installation failed');
    }
    setShowInstallDialog(false);
  };

  if (isInstalled) {
    return null; // Don't show the button if the app is already installed
  }

  return (
    <>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-1 bg-black/10 dark:bg-white/5 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-sm hover:bg-black/5 dark:hover:bg-white/10 rounded-lg px-3 py-2"
                  size="sm"
                >
                  <PlusCircle size={16} className="mr-1" />
                  Install App
                  <ChevronDown size={14} className="opacity-70 ml-1" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Install as desktop app</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <DropdownMenuContent className="w-56 dark:bg-[#1A1D21] border dark:border-gray-700 shadow-lg rounded-lg">
          <DropdownMenuLabel className="flex items-center">
            <img src="/icons/icon-192x192.png" alt="App logo" className="w-5 h-5 mr-2 rounded" />
            <span>Install Market Notes Haven</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="flex items-center cursor-pointer" 
            onClick={handleInstallClick}
          >
            <Download size={16} className="mr-2" />
            <div className="flex flex-col">
              <span>Install as app</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Use outside of browser
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center cursor-pointer">
            <ExternalLink size={16} className="mr-2" />
            <div className="flex flex-col">
              <span>Open in new window</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Dedicated browser window
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1.5">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 px-2">
              <Lock size={12} className="mr-1" />
              Secure & encrypted
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <InstallConfirmation 
        open={showInstallDialog} 
        onOpenChange={setShowInstallDialog} 
        onConfirm={confirmInstallation} 
      />

      <IOSInstallInstructions 
        open={showIOSInstructions} 
        onOpenChange={setShowIOSInstructions} 
      />

      <AndroidInstallInstructions 
        open={showAndroidInstructions} 
        onOpenChange={setShowAndroidInstructions} 
      />
    </>
  );
};

export default InstallPWA;

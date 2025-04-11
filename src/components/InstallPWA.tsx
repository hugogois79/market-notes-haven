
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import IOSInstallInstructions from './pwa/IOSInstallInstructions';
import AndroidInstallInstructions from './pwa/AndroidInstallInstructions';
import InstallConfirmation from './pwa/InstallConfirmation';

const InstallPWA = () => {
  const { isInstallable, isInstalled, triggerInstall, getPlatformInfo } = usePwaInstall();
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);

  const handleInstallClick = () => {
    console.log('Install button clicked');
    
    if (isInstalled) {
      toast.info('Application is already installed');
      return;
    }
    
    const { isIOS, isAndroid } = getPlatformInfo();
    
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
      toast.info('Installation is not available at the moment');
    }
  };

  const confirmInstallation = async () => {
    const success = await triggerInstall();
    setShowInstallDialog(false);
  };

  if (isInstalled) {
    return null; // Don't show the button if the app is already installed
  }

  return (
    <>
      <Button 
        onClick={handleInstallClick} 
        className="flex items-center gap-2 bg-[#00b8d9] hover:bg-[#00a3c0] text-white rounded-md px-4 py-2 font-medium"
        size="sm"
      >
        <Download size={16} />
        Install App
      </Button>

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

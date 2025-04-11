
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import IOSInstallInstructions from './pwa/IOSInstallInstructions';
import AndroidInstallInstructions from './pwa/AndroidInstallInstructions';
import InstallConfirmation from './pwa/InstallConfirmation';
import AppBanner from './pwa/AppBanner';

const InstallPWA = () => {
  const { isInstallable, isInstalled, triggerInstall, getPlatformInfo } = usePwaInstall();
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Check if app can be opened in PWA mode
  useEffect(() => {
    // Only show the banner if the app is installed but we're in browser mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isSafariStandalone = 'standalone' in navigator && (navigator as any).standalone === true;
    
    // The app is installed but not currently in standalone mode
    if (isInstalled && !isStandalone && !isSafariStandalone) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [isInstalled]);

  // Listen for browser installation prompts
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Store the event for later use
      if (e && !isInstalled) {
        console.log('Installation prompt detected from browser');
        // Optional: Could show a small notification that installation is available
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  // This method can still be called from browser UI or other components
  const handleInstallClick = () => {
    console.log('Install triggered, installable:', isInstallable, 'installed:', isInstalled);
    
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

  return (
    <>
      {showBanner && <AppBanner />}
      
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

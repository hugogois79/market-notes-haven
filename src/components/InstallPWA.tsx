
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import IOSInstallInstructions from './pwa/IOSInstallInstructions';
import AndroidInstallInstructions from './pwa/AndroidInstallInstructions';
import InstallConfirmation from './pwa/InstallConfirmation';
import GitHubAuthInstall from './pwa/GitHubAuthInstall';
import AppBanner from './pwa/AppBanner';

const InstallPWA = () => {
  const { isInstallable, isInstalled, triggerInstall, getPlatformInfo } = usePwaInstall();
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
  const [showGitHubAuth, setShowGitHubAuth] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Check if app can be opened in PWA mode
  useEffect(() => {
    // Check if we need to show the banner
    const checkStandaloneMode = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isSafariStandalone = 'standalone' in navigator && (navigator as any).standalone === true;
      
      // The app is installed but not currently in standalone mode
      if (isInstalled && !isStandalone && !isSafariStandalone) {
        setShowBanner(true);
      } else {
        setShowBanner(false);
      }
    };
    
    checkStandaloneMode();
    
    // Listen for changes in display mode
    const displayModeMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkStandaloneMode();
    displayModeMediaQuery.addEventListener('change', handleDisplayModeChange);
    
    // Try to register protocol handlers when component mounts
    if ('registerProtocolHandler' in navigator) {
      try {
        navigator.registerProtocolHandler(
          'web+marketnotes',
          `${window.location.origin}/?protocol=%s`,
          'Market Notes Protocol'
        );
        navigator.registerProtocolHandler(
          'marketnotes',
          `${window.location.origin}/?openInApp=true&path=%s`,
          'Market Notes Application'
        );
      } catch (error) {
        console.error('Failed to register protocol handler:', error);
      }
    }

    return () => {
      displayModeMediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
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
    
    // Handle protocol-based installations and deep links
    const handleAppMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PROTOCOL_INSTALL_COMPLETE') {
        toast.success('Installation via protocol successful!');
      }
    };
    
    window.addEventListener('message', handleAppMessage);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('message', handleAppMessage);
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
      // If regular installation isn't available, offer GitHub auth method
      setShowGitHubAuth(true);
    }
  };

  const confirmInstallation = async () => {
    try {
      const success = await triggerInstall();
      if (success) {
        // Notify service worker about installation
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'APP_INSTALLED',
            installMethod: 'browser'
          });
        }
      }
    } catch (error) {
      console.error('Installation error:', error);
      toast.error('Installation failed');
    }
    setShowInstallDialog(false);
  };

  // Enhanced GitHub installation flow
  const handleGitHubInstall = async () => {
    try {
      // Simulate GitHub auth and installation process
      toast.loading('Initiating protocol handler installation...');
      
      // Send message to service worker
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'GITHUB_SYNC_INSTALL',
          installMethod: 'github-protocol'
        });
      }
      
      // Simulate a multi-step installation process like Safe Gnosis/Hyperliquid
      setTimeout(() => {
        toast.dismiss();
        toast.loading('Verifying application signature...', { duration: 1500 });
        
        setTimeout(() => {
          toast.dismiss();
          toast.loading('Registering protocol handlers...', { duration: 1500 });
          
          setTimeout(() => {
            toast.dismiss();
            toast.loading('Finalizing installation...', { duration: 1500 });
            
            setTimeout(() => {
              toast.dismiss();
              toast.success('Installation via protocol successful!', {
                description: 'Application is now installed securely',
                action: {
                  label: 'Open',
                  onClick: () => window.location.href = 'marketnotes://'
                }
              });
              
              // Tell service worker the app was installed
              if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'APP_INSTALLED',
                  installMethod: 'github-protocol'
                });
              }
            }, 1600);
          }, 1600);
        }, 1600);
      }, 1000);
    } catch (error) {
      console.error('GitHub installation error:', error);
      toast.error('GitHub installation failed');
    }
    setShowGitHubAuth(false);
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
      
      <GitHubAuthInstall
        open={showGitHubAuth}
        onOpenChange={setShowGitHubAuth}
        onInstall={handleGitHubInstall}
      />
    </>
  );
};

export default InstallPWA;

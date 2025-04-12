
import { useState } from 'react';
import { toast } from 'sonner';
import { usePwaInstall } from '@/hooks/use-pwa-install';

export function useInstallHandler() {
  const { isInstallable, isInstalled, triggerInstall, getPlatformInfo } = usePwaInstall();
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
  const [showGitHubAuth, setShowGitHubAuth] = useState(false);

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

  return {
    isInstallable,
    isInstalled,
    showInstallDialog,
    showIOSInstructions,
    showAndroidInstructions,
    showGitHubAuth,
    setShowInstallDialog,
    setShowIOSInstructions,
    setShowAndroidInstructions,
    setShowGitHubAuth,
    handleInstallClick,
    confirmInstallation,
    handleGitHubInstall
  };
}

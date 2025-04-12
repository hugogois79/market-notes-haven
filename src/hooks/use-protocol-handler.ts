
import { useEffect, useState } from 'react';
import { usePwaInstall } from '@/hooks/use-pwa-install';

export function useProtocolHandler() {
  const { isInstalled } = usePwaInstall();
  const [showBanner, setShowBanner] = useState(false);

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
          `${window.location.origin}/?protocol=%s`
        );
        navigator.registerProtocolHandler(
          'marketnotes',
          `${window.location.origin}/?openInApp=true&path=%s`
        );
      } catch (error) {
        console.error('Failed to register protocol handler:', error);
      }
    }

    return () => {
      displayModeMediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [isInstalled]);

  return { showBanner };
}

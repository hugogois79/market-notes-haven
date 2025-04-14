
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePwaInstall } from '@/hooks/use-pwa-install';

export function useProtocolHandler() {
  const navigate = useNavigate();
  const { isInstalled } = usePwaInstall();
  const [showBanner, setShowBanner] = useState(false);

  // Handle protocol activations coming from URLs
  const handleProtocolActivation = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Check if the page was opened via protocol
      const protocolAction = params.get('protocol');
      const openInApp = params.get('openInApp');
      const action = params.get('action');
      const path = params.get('path');
      
      if (protocolAction) {
        console.log('Protocol action received:', protocolAction);
        
        // Handle web+marketnotes:// protocol actions
        switch (protocolAction) {
          case 'install':
            toast.info('Installation requested via protocol', {
              description: 'Initializing installation process...'
            });
            
            // Notify service worker to handle installation
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'GITHUB_SYNC_INSTALL',
                installMethod: 'protocol'
              });
            }
            break;
            
          case 'open':
            toast.success('Opening application via protocol');
            break;
            
          default:
            console.log('Unknown protocol action:', protocolAction);
        }
        
        // Remove the query parameters
        navigate(urlObj.pathname);
      }
      
      if (action) {
        console.log('GitHub action received:', action);
        
        // Handle github-app:// protocol actions
        if (action === 'install') {
          toast.info('GitHub installation requested', {
            description: 'Initializing GitHub-based installation...'
          });
          
          // Trigger GitHub installation process
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'GITHUB_SYNC_INSTALL',
              installMethod: 'github-protocol'
            });
          }
        }
        
        // Remove the query parameters
        navigate(urlObj.pathname);
      }
      
      if (openInApp === 'true') {
        console.log('Open in app request received');
        // We're already in the app, so just navigate to the path if provided
        if (path) {
          navigate(path);
        } else {
          navigate('/');
        }
        
        // Notify the user that the app is open
        toast.success('App opened successfully', {
          description: 'You are now using the installed application'
        });
      }
    } catch (error) {
      console.error('Error handling protocol activation:', error);
    }
  }, [navigate]);

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
        // Always use web+ prefix for custom protocols (as per console error)
        navigator.registerProtocolHandler(
          'web+marketnotes',
          `${window.location.origin}/?protocol=%s`
        );
        
        // Use standard protocols that don't require the web+ prefix
        navigator.registerProtocolHandler(
          'web+app',
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

  return { showBanner, handleProtocolActivation };
}

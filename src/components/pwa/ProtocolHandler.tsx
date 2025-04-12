
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ProtocolHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Parse query parameters to check for protocol actions
    const params = new URLSearchParams(location.search);
    
    // Check if the page was opened via protocol
    const protocolAction = params.get('protocol');
    const openInApp = params.get('openInApp');
    const action = params.get('action');
    const path = params.get('path');
    
    if (protocolAction) {
      console.log('Protocol action received:', protocolAction);
      handleProtocolAction(protocolAction);
    }
    
    if (action) {
      console.log('GitHub action received:', action);
      handleGitHubAction(action);
    }
    
    if (openInApp === 'true') {
      console.log('Open in app request received');
      // We're already in the app, so just navigate to the path if provided
      if (path) {
        navigate(path);
      }
      
      // Notify the user that the app is open
      toast.success('App opened successfully', {
        description: 'You are now using the installed application'
      });
      
      // Remove the query parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location, navigate]);
  
  const handleProtocolAction = (action: string) => {
    // Handle web+marketnotes:// protocol actions
    switch (action) {
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
        console.log('Unknown protocol action:', action);
    }
    
    // Remove the query parameters
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };
  
  const handleGitHubAction = (action: string) => {
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
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };
  
  // This component doesn't render anything
  return null;
};

export default ProtocolHandler;

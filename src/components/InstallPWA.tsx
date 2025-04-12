
import React from 'react';
import IOSInstallInstructions from './pwa/IOSInstallInstructions';
import AndroidInstallInstructions from './pwa/AndroidInstallInstructions';
import InstallConfirmation from './pwa/InstallConfirmation';
import GitHubAuthInstall from './pwa/GitHubAuthInstall';
import AppBanner from './pwa/AppBanner';
import { useProtocolHandler } from '@/hooks/use-protocol-handler';
import { useInstallHandler } from '@/hooks/use-install-handler';
import { useInstallEvents } from '@/hooks/use-install-events';

const InstallPWA = () => {
  const { showBanner } = useProtocolHandler();
  const {
    showInstallDialog,
    showIOSInstructions,
    showAndroidInstructions,
    showGitHubAuth,
    setShowInstallDialog,
    setShowIOSInstructions,
    setShowAndroidInstructions,
    setShowGitHubAuth,
    confirmInstallation,
    handleGitHubInstall
  } = useInstallHandler();
  
  // Initialize event listeners
  useInstallEvents();

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

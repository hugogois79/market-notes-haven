
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('PWA is already installed in standalone mode');
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      // Update UI to show the install button
      setIsInstallable(true);
      
      console.log('App can be installed, prompt event captured and stored');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app got installed
    window.addEventListener('appinstalled', () => {
      // Clear the prompt
      setInstallPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      setShowInstallDialog(false);
      toast.success('Application installed successfully!');
      console.log('PWA was installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    console.log('Install button clicked, installPrompt available:', !!installPrompt);
    
    if (isInstalled) {
      toast.info('Application is already installed');
      return;
    }
    
    if (!installPrompt) {
      console.log('No installation prompt available');
      // Check if this is iOS where PWA installation is manual
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        toast.info('To install on iOS: tap the share button and then "Add to Home Screen"');
      } else {
        toast.error('Installation is not available at the moment');
      }
      return;
    }

    setShowInstallDialog(true);
  };

  const confirmInstallation = async () => {
    if (!installPrompt) {
      console.log('No installation prompt available when trying to confirm installation');
      return;
    }
    
    try {
      // Show the install prompt
      console.log('Triggering installation prompt');
      installPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast.success('Installation started!');
      } else {
        console.log('User dismissed the install prompt');
        toast.info('Installation cancelled');
      }
    } catch (err) {
      console.error('Error during installation:', err);
      toast.error('Installation failed. Please try again.');
    }
    
    // We no longer need the prompt, clear it
    setShowInstallDialog(false);
  };

  if (isInstalled) {
    return null; // Don't show the button if the app is already installed
  }

  return (
    <>
      <Button 
        onClick={handleInstallClick} 
        variant="outline"
        className="gap-2 ml-4"
        size="sm"
      >
        <Download size={16} />
        Install App
      </Button>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install app</DialogTitle>
            <DialogDescription>
              Market Notes Haven
              <div className="text-sm text-muted-foreground mt-1">
                lovable.dev
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 py-4">
            <div className="bg-brand rounded-md p-2">
              <img 
                src="/icons/icon-192x192.png" 
                alt="App icon" 
                className="w-12 h-12"
              />
            </div>
            <div>
              <p className="text-sm font-medium">Market Notes Haven</p>
              <p className="text-xs text-muted-foreground">Track and manage your market notes efficiently</p>
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInstallDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={confirmInstallation}
              className="bg-[#1EAEDB] text-white hover:bg-[#0FA0CE]"
            >
              Install
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallPWA;

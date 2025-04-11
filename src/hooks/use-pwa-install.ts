
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('PWA is already installed in standalone mode');
      return;
    }

    // Capture installation prompt for later use
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
      toast.success('Application installed successfully!');
      console.log('PWA was installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) {
      console.log('No installation prompt available when trying to confirm installation');
      return false;
    }
    
    try {
      // Show the install prompt
      console.log('Triggering installation prompt');
      await installPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast.success('Installation started!');
        return true;
      } else {
        console.log('User dismissed the install prompt');
        toast.info('Installation cancelled');
        return false;
      }
    } catch (err) {
      console.error('Error during installation:', err);
      toast.error('Installation failed. Please try again.');
      return false;
    }
  };

  // Get platform information
  const getPlatformInfo = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    
    return { isIOS, isAndroid, isChrome, isSafari };
  };

  return {
    isInstallable,
    isInstalled,
    installPrompt,
    triggerInstall,
    getPlatformInfo
  };
}

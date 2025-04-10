
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('PWA is already installed');
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Update UI to show the install button
      setIsInstallable(true);
      
      console.log('App can be installed, prompt event captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app got installed
    window.addEventListener('appinstalled', () => {
      // Clear the prompt
      setInstallPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      toast.success('Application installed successfully!');
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      toast.error('Installation is not available at the moment');
      return;
    }

    // Show the install prompt
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
    
    // We no longer need the prompt, clear it
    setInstallPrompt(null);
  };

  // Always render the button regardless of installable state for debugging
  return (
    <Button 
      onClick={handleInstallClick} 
      variant="outline"
      className="gap-2 ml-4"
      size="sm"
      disabled={!isInstallable}
    >
      <Download size={16} />
      Install App
    </Button>
  );
};

export default InstallPWA;

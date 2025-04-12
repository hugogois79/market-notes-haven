
import React, { useState, useEffect } from 'react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

const FloatingInstallPrompt = () => {
  const { isInstallable, isInstalled, triggerInstall } = usePwaInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show immediately, wait a bit for better user experience
    if (isInstallable && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        // Check if we have already shown this prompt before
        const hasShownPrompt = localStorage.getItem('installPromptShown');
        if (!hasShownPrompt) {
          setShowPrompt(true);
          // Mark as shown, but allow showing again after 3 days
          localStorage.setItem('installPromptShown', Date.now().toString());
        } else {
          // Check if it's been more than 3 days since we last showed the prompt
          const lastShown = parseInt(hasShownPrompt, 10);
          const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
          if (Date.now() - lastShown > threeDaysInMs) {
            setShowPrompt(true);
            localStorage.setItem('installPromptShown', Date.now().toString());
          }
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, dismissed]);

  const handleInstall = async () => {
    try {
      const success = await triggerInstall();
      if (success) {
        toast.success('Installation started!');
      }
      setShowPrompt(false);
    } catch (error) {
      console.error('Installation error:', error);
      toast.error('Installation failed. Please try again.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs animate-fade-in">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm">Install Market Notes Haven</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
          Install this app on your device for a better experience, faster access, and offline capabilities.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="text-xs"
          >
            Not now
          </Button>
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            <Download className="mr-1.5 h-3 w-3" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FloatingInstallPrompt;

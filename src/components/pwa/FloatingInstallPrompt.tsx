
import React, { useState, useEffect } from 'react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Download, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const FloatingInstallPrompt = () => {
  const { isInstallable, isInstalled, triggerInstall } = usePwaInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show the install prompt after a short delay for better UX
    if (isInstallable && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        // Check if we've already shown this prompt before
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
      }, 3000);
      
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2 animate-fade-in-up">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden max-w-xs">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium">Install Market Notes Haven</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 mb-4">
            Get faster access to your notes, work offline, and enjoy a better experience by installing this app on your device.
          </p>
          
          <Button
            onClick={handleInstall}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Install App
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FloatingInstallPrompt;

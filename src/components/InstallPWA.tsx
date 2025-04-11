
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronDown, Info, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);

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
    
    // Check if this is iOS where PWA installation is manual
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Browser detection
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    
    if (isAndroid && !installPrompt) {
      setShowAndroidInstructions(true);
      return;
    }
    
    if (!installPrompt) {
      toast.info('Installation is not available at the moment');
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
      await installPrompt.prompt();

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
        className="gap-2 bg-gradient-to-r from-[#1EAEDB] to-[#0FA0CE] hover:from-[#0FA0CE] hover:to-[#0D92BE] text-white border-none"
        size="sm"
      >
        <Download size={16} />
        Install App
      </Button>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md border-[#1EAEDB] bg-[#0D1117] text-white">
          <DialogHeader className="border-b border-gray-800 pb-4">
            <DialogTitle className="text-xl font-bold text-[#1EAEDB]">Install Market Notes Haven</DialogTitle>
            <DialogDescription className="text-gray-400">
              A powerful platform for your market insights
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-4 py-4">
            <div className="bg-[#1EAEDB]/10 p-3 rounded-lg">
              <img 
                src="/icons/icon-192x192.png" 
                alt="App icon" 
                className="w-16 h-16 rounded-md"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium">Market Notes Haven</h3>
              <p className="text-sm text-gray-400">Track market insights even when offline</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-xs bg-[#1EAEDB]/20 text-[#1EAEDB] px-2 py-1 rounded">
                  <Info size={12} className="mr-1" />
                  PWA Enabled
                </div>
                <span className="text-xs text-gray-500">v2.0.0</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#171B22] rounded-lg p-4 text-sm">
            <div className="flex items-start">
              <Check size={16} className="text-green-500 mt-0.5 mr-2 shrink-0" />
              <span>Access all features even without internet connection</span>
            </div>
            <div className="flex items-start mt-2">
              <Check size={16} className="text-green-500 mt-0.5 mr-2 shrink-0" />
              <span>Quick access from your home screen</span>
            </div>
            <div className="flex items-start mt-2">
              <Check size={16} className="text-green-500 mt-0.5 mr-2 shrink-0" />
              <span>Native app-like experience</span>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between border-t border-gray-800 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInstallDialog(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmInstallation}
              className="bg-gradient-to-r from-[#1EAEDB] to-[#0FA0CE] hover:from-[#0FA0CE] hover:to-[#0D92BE] text-white border-none"
            >
              Install Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* iOS Installation Instructions */}
      <AlertDialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <AlertDialogContent className="bg-[#0D1117] text-white border-[#1EAEDB]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1EAEDB]">Install on iOS</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              To install this app on your iOS device:
              <ol className="mt-3 space-y-3 list-decimal list-inside">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Tap the Share button <span className="inline-block bg-gray-700 text-white px-1 rounded">📤</span> at the bottom of your screen</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Scroll down and tap <span className="font-medium text-[#1EAEDB]">"Add to Home Screen"</span></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Tap <span className="font-medium text-[#1EAEDB]">"Add"</span> in the top right corner</span>
                </li>
              </ol>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Android Installation Instructions */}
      <AlertDialog open={showAndroidInstructions} onOpenChange={setShowAndroidInstructions}>
        <AlertDialogContent className="bg-[#0D1117] text-white border-[#1EAEDB]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1EAEDB]">Install on Android</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              To install this app on your Android device:
              <ol className="mt-3 space-y-3 list-decimal list-inside">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Tap the menu button <span className="inline-block bg-gray-700 text-white px-1 rounded">⋮</span> in Chrome</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Select <span className="font-medium text-[#1EAEDB]">"Install app"</span> or <span className="font-medium text-[#1EAEDB]">"Add to Home screen"</span></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Follow the on-screen instructions to complete installation</span>
                </li>
              </ol>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InstallPWA;

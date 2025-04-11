
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Define the interface for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [themePreference, setThemePreference] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check if the app is already installed
    // For standard browsers (PWA is installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // For iOS Safari - check if standalone property exists
    const isSafariStandalone = 'standalone' in navigator && (navigator as any).standalone === true;
    
    if (isStandalone || isSafariStandalone) {
      setIsInstalled(true);
      console.log('PWA is already installed in standalone mode');
      return;
    }

    // Detect system theme preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setThemePreference(prefersDark ? 'dark' : 'light');

    // Listen for theme changes
    const themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setThemePreference(newTheme);
      
      // Notify service worker about theme change
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'THEME_CHANGE',
          themeColor: newTheme === 'dark' ? '#0D1117' : '#FFFFFF'
        });
      }
      
      // Update theme-color meta tag
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', newTheme === 'dark' ? '#0D1117' : '#FFFFFF');
      }
    };

    themeMediaQuery.addEventListener('change', handleThemeChange);

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
    window.addEventListener('appinstalled', (event) => {
      // Clear the prompt
      setInstallPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      toast.success('Application installed successfully!');
      console.log('PWA was installed successfully');
      
      // Notify service worker
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'APP_INSTALLED'
        });
      }
    });

    // Listen for messages from service worker about theme updates
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'THEME_UPDATED') {
          const themeColorMeta = document.querySelector('meta[name="theme-color"]');
          if (themeColorMeta) {
            themeColorMeta.setAttribute('content', event.data.themeColor);
          }
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      themeMediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Initialize theme-color meta tag on mount
  useEffect(() => {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    
    const color = themePreference === 'dark' ? '#0D1117' : '#FFFFFF';
    themeColorMeta.setAttribute('content', color);
  }, [themePreference]);

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
    getPlatformInfo,
    themePreference
  };
}

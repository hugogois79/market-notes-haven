
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useInstallEvents() {
  useEffect(() => {
    // Store the installation prompt event
    let deferredPrompt: any = null;
    
    // Listen for browser installation prompts
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67+ from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      
      // Optionally dispatch an event to notify components about installability
      window.dispatchEvent(new CustomEvent('app-installable', { detail: { installable: true } }));
      
      console.log('Installation prompt detected and saved for later use');
    };

    // Handle successful app installation
    const handleAppInstalled = (e: Event) => {
      // Clear the stored prompt since it's no longer needed
      deferredPrompt = null;
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('app-installed', { detail: { installed: true } }));
      
      toast.success('Application successfully installed!', {
        description: 'You can now launch it from your home screen or app list',
        duration: 5000
      });
      
      console.log('App was successfully installed', e);
    };
    
    // Handle protocol-based installations and deep links
    const handleAppMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PROTOCOL_INSTALL_COMPLETE') {
        toast.success('Installation via protocol successful!', {
          description: 'Your app is now ready to use'
        });
      }
      
      if (event.data && event.data.type === 'APP_INSTALLED') {
        window.dispatchEvent(new CustomEvent('app-installed', { detail: { installed: true } }));
      }
    };
    
    // Register event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('message', handleAppMessage);
    
    // Check for PWA mode on startup
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                 (navigator as any).standalone === true;
    
    if (isPwa) {
      console.log('App is running in PWA mode');
      window.dispatchEvent(new CustomEvent('app-installed', { detail: { installed: true } }));
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('message', handleAppMessage);
    };
  }, []);
}

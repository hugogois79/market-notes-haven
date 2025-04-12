
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useInstallEvents() {
  useEffect(() => {
    // Listen for browser installation prompts
    const handleBeforeInstallPrompt = (e: any) => {
      // Store the event for later use
      if (e) {
        console.log('Installation prompt detected from browser');
        // Optional: Could show a small notification that installation is available
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Handle protocol-based installations and deep links
    const handleAppMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PROTOCOL_INSTALL_COMPLETE') {
        toast.success('Installation via protocol successful!');
      }
    };
    
    window.addEventListener('message', handleAppMessage);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('message', handleAppMessage);
    };
  }, []);
}

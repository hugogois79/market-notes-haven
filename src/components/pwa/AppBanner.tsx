
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppBanner = () => {
  // Function to launch the app
  const openInApp = () => {
    // Get the current URL
    const currentUrl = window.location.href;
    
    // Create the app URL - we'll use the same URL but it will open in the PWA
    window.location.href = currentUrl;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-1 px-2 text-xs">
      <Button 
        onClick={openInApp}
        variant="ghost" 
        size="sm"
        className="flex items-center gap-1 text-white hover:bg-white/20 px-2 py-1 h-auto"
      >
        <ExternalLink size={12} />
        <span>Abrir na app</span>
      </Button>
    </div>
  );
};

export default AppBanner;

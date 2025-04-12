
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppBanner = () => {
  // Function to launch the app via protocol handler
  const openInApp = () => {
    try {
      // Use the custom protocol to open the app
      window.location.href = `marketnotes://${window.location.pathname}${window.location.search}`;
      
      // Fallback to regular URL if protocol fails after a short delay
      setTimeout(() => {
        // If we're still here after 100ms, protocol handler likely failed
        if (document.visibilityState !== 'hidden') {
          // Use regular app URL as fallback
          window.location.href = window.location.href;
        }
      }, 100);
    } catch (error) {
      console.error('Failed to open in app:', error);
      // Use regular app URL as fallback
      window.location.href = window.location.href;
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm">
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
          <span>app.marketnotes.haven</span>
        </div>
      </div>
      
      <Button 
        onClick={openInApp}
        variant="outline" 
        size="sm"
        className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1 h-auto text-xs rounded-full"
      >
        <ExternalLink size={12} />
        <span>Abrir na app</span>
      </Button>
    </div>
  );
};

export default AppBanner;

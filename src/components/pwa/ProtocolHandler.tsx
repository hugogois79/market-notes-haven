
import React, { useEffect } from "react";

const ProtocolHandler = () => {
  useEffect(() => {
    // Simplified protocol handling without router dependencies
    console.log('Protocol handler mounted');
    
    // Basic URL handling without router integration
    const url = window.location.href;
    if (url.includes('protocol=') || url.includes('openInApp=')) {
      console.log('Protocol URL detected:', url);
    }
  }, []);

  return null; // This component doesn't render anything
};

export default ProtocolHandler;

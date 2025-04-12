
import React from 'react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface InstallButtonProps {
  showText?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onClick?: () => void;
}

const InstallButton = ({ 
  showText = true, 
  variant = "default",
  size = "default",
  className = "",
  onClick
}: InstallButtonProps) => {
  const { isInstallable, isInstalled, triggerInstall } = usePwaInstall();

  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    try {
      const success = await triggerInstall();
      if (success) {
        toast.success('Installation started!');
      }
      if (onClick) onClick();
    } catch (error) {
      console.error('Installation error:', error);
      toast.error('Installation failed. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleInstall}
      variant={variant}
      size={size}
      className={`${className} flex items-center gap-2`}
    >
      <Download className="h-4 w-4" />
      {showText && <span>Install App</span>}
    </Button>
  );
};

export default InstallButton;

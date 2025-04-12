
import React from 'react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useInstallHandler } from '@/hooks/use-install-handler';

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
  const { isInstallable, isInstalled } = usePwaInstall();
  const { handleInstallClick } = useInstallHandler();

  // Always show the button for now, we can add restrictions later
  // if (isInstalled || (!isInstallable && !onClick)) {
  //   return null;
  // }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      handleInstallClick();
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`${className} flex items-center gap-2`}
    >
      {variant === "default" ? <Plus className="h-4 w-4" /> : <Download className="h-4 w-4" />}
      {showText && <span>Install App</span>}
    </Button>
  );
};

export default InstallButton;

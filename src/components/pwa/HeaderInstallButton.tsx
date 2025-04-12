
import React from 'react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useInstallHandler } from '@/hooks/use-install-handler';

const HeaderInstallButton = () => {
  const { isInstallable, isInstalled } = usePwaInstall();
  const { handleInstallClick } = useInstallHandler();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="ghost"
      size="sm"
      className="gap-1.5 text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
    >
      <Download className="h-4 w-4" />
      <span>Install</span>
    </Button>
  );
};

export default HeaderInstallButton;

import React, { useState, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import CommandPalette from './CommandPalette';
import ShortcutsHelpModal from './ShortcutsHelpModal';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProviderProps> = ({
  children,
}) => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleOpenShortcutsHelp = useCallback(() => {
    setCommandPaletteOpen(false);
    setShortcutsHelpOpen(true);
  }, []);

  useKeyboardShortcuts({
    onOpenCommandPalette: handleOpenCommandPalette,
    onOpenShortcutsHelp: handleOpenShortcutsHelp,
  });

  return (
    <>
      {children}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onOpenShortcutsHelp={handleOpenShortcutsHelp}
      />
      <ShortcutsHelpModal
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />
    </>
  );
};

export default KeyboardShortcutsProvider;

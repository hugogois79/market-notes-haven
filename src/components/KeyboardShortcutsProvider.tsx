import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();

  // Detect if we're on a board page and extract the board ID
  const isBoardPage = location.pathname.startsWith('/kanban/');
  const currentBoardId = isBoardPage ? location.pathname.split('/kanban/')[1]?.split('?')[0] : undefined;

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleOpenShortcutsHelp = useCallback(() => {
    setCommandPaletteOpen(false);
    setShortcutsHelpOpen(true);
  }, []);

  // Create callbacks that emit global events for Kanban page to handle
  const handleCreateBoard = useCallback(() => {
    // Navigate to kanban page and trigger board creation
    if (!location.pathname.startsWith('/kanban')) {
      navigate('/kanban');
    }
    // Emit event for kanban page to open board dialog
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('kanban:create-board'));
    }, 100);
  }, [location.pathname, navigate]);

  const handleCreateList = useCallback(() => {
    if (!currentBoardId) return;
    window.dispatchEvent(new CustomEvent('kanban:create-list'));
  }, [currentBoardId]);

  const handleCreateCard = useCallback(() => {
    if (!currentBoardId) return;
    window.dispatchEvent(new CustomEvent('kanban:create-card'));
  }, [currentBoardId]);

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
        currentBoardId={currentBoardId}
        onCreateBoard={handleCreateBoard}
        onCreateList={handleCreateList}
        onCreateCard={handleCreateCard}
      />
      <ShortcutsHelpModal
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />
    </>
  );
};

export default KeyboardShortcutsProvider;

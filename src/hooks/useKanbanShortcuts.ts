import { useEffect, useCallback, useRef } from 'react';

interface KanbanShortcutsOptions {
  onCreateCard: () => void;
  enabled?: boolean;
}

export const useKanbanShortcuts = ({
  onCreateCard,
  enabled = true,
}: KanbanShortcutsOptions) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input, textarea, or contenteditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Ctrl+N / Cmd+N: Create new card/task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      onCreateCard();
      return;
    }
  }, [enabled, onCreateCard]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export const KANBAN_SHORTCUTS = [
  {
    category: 'Kanban',
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'Criar nova tarefa' },
    ],
  },
];

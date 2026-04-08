import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcutsOptions {
  onOpenCommandPalette: () => void;
  onOpenShortcutsHelp: () => void;
}

export const useKeyboardShortcuts = ({
  onOpenCommandPalette,
  onOpenShortcutsHelp,
}: KeyboardShortcutsOptions) => {
  const navigate = useNavigate();
  const pendingKeyRef = useRef<string | null>(null);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearPendingKey = useCallback(() => {
    pendingKeyRef.current = null;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input, textarea, or contenteditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Command Palette: Cmd+K / Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onOpenCommandPalette();
      clearPendingKey();
      return;
    }

    // Help Modal: ? (Shift + /)
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      onOpenShortcutsHelp();
      clearPendingKey();
      return;
    }

    // Escape: Close modals (handled by individual modals)
    if (e.key === 'Escape') {
      clearPendingKey();
      return;
    }

    // Sequential shortcuts: G then I (Go to Inbox/Dashboard)
    if (e.key.toLowerCase() === 'g') {
      pendingKeyRef.current = 'g';
      // Clear pending key after 1 second
      pendingTimeoutRef.current = setTimeout(clearPendingKey, 1000);
      return;
    }

    // If G was pressed, check for follow-up keys
    if (pendingKeyRef.current === 'g') {
      clearPendingKey();
      
      switch (e.key.toLowerCase()) {
        case 'i': // G + I: Go to Inbox/Dashboard
          e.preventDefault();
          navigate('/');
          break;
        case 'n': // G + N: Go to Notes
          e.preventDefault();
          navigate('/notes');
          break;
        case 'c': // G + C: Go to Calendar
          e.preventDefault();
          navigate('/calendar');
          break;
        case 'k': // G + K: Go to Kanban
          e.preventDefault();
          navigate('/kanban');
          break;
        case 'p': // G + P: Go to Projects
          e.preventDefault();
          navigate('/projects');
          break;
        case 'e': // G + E: Go to Expenses
          e.preventDefault();
          navigate('/expenses');
          break;
        case 'w': // G + W: Go to Workflow
          e.preventDefault();
          navigate('/companies');
          break;
        case 's': // G + S: Go to Settings
          e.preventDefault();
          navigate('/settings');
          break;
      }
    }
  }, [navigate, onOpenCommandPalette, onOpenShortcutsHelp, clearPendingKey]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);
};

export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Navegação Global',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Abrir Command Palette' },
      { keys: ['?'], description: 'Ver todos os atalhos' },
      { keys: ['Esc'], description: 'Fechar modal / Voltar' },
    ],
  },
  {
    category: 'Ir para (G + ...)',
    shortcuts: [
      { keys: ['G', 'I'], description: 'Ir para Dashboard' },
      { keys: ['G', 'N'], description: 'Ir para Notas' },
      { keys: ['G', 'C'], description: 'Ir para Calendário' },
      { keys: ['G', 'K'], description: 'Ir para Kanban' },
      { keys: ['G', 'P'], description: 'Ir para Projetos' },
      { keys: ['G', 'E'], description: 'Ir para Despesas' },
      { keys: ['G', 'W'], description: 'Ir para Workflow' },
      { keys: ['G', 'S'], description: 'Ir para Definições' },
    ],
  },
];

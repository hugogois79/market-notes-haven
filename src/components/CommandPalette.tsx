import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Home,
  FileText,
  Calendar,
  Layout,
  FolderOpen,
  Receipt,
  Settings,
  Building2,
  Wallet,
  Scale,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  FolderKanban,
} from 'lucide-react';
import { KanbanService, KanbanSpace, KanbanBoard } from '@/services/kanbanService';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenShortcutsHelp: () => void;
}

type ViewMode = 'main' | 'boards';

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onOpenShortcutsHelp,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [spaces, setSpaces] = useState<KanbanSpace[]>([]);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);

  // Reset view mode when dialog closes
  useEffect(() => {
    if (!open) {
      setViewMode('main');
    }
  }, [open]);

  // Load boards and spaces when entering boards view
  useEffect(() => {
    if (viewMode === 'boards' && open) {
      loadBoardsData();
    }
  }, [viewMode, open]);

  const loadBoardsData = async () => {
    setIsLoadingBoards(true);
    try {
      const [spacesData, boardsData] = await Promise.all([
        KanbanService.getSpaces(),
        KanbanService.getBoards(),
      ]);
      setSpaces(spacesData);
      setBoards(boardsData.filter(b => !b.archived));
    } catch (error) {
      console.error('Error loading boards data:', error);
    } finally {
      setIsLoadingBoards(false);
    }
  };

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  const navigationItems = [
    { icon: Home, label: 'Dashboard', shortcut: 'G I', path: '/' },
    { icon: FileText, label: 'Notas', shortcut: 'G N', path: '/notes' },
    { icon: Calendar, label: 'Calendário', shortcut: 'G C', path: '/calendar' },
    { icon: Layout, label: 'Boards', shortcut: 'G K', path: '/kanban', keywords: ['kanban', 'boards'], hasSubmenu: true },
    { icon: FolderOpen, label: 'Projetos', shortcut: 'G P', path: '/projects' },
    { icon: Receipt, label: 'Despesas', shortcut: 'G E', path: '/expenses' },
    { icon: Building2, label: 'Workflow', shortcut: 'G W', path: '/companies', keywords: ['work', 'empresas', 'companies'] },
    { icon: Wallet, label: 'Crypto', path: '/crypto' },
    { icon: Scale, label: 'Legal', path: '/legal' },
    { icon: Settings, label: 'Definições', shortcut: 'G S', path: '/settings' },
  ];

  const actionItems = [
    { 
      icon: HelpCircle, 
      label: 'Ver atalhos de teclado', 
      shortcut: '?', 
      action: onOpenShortcutsHelp 
    },
  ];

  // Group boards by space
  const getBoardsBySpace = () => {
    const unorganizedBoards = boards.filter(b => !b.space_id);
    const organizedBySpace = spaces.map(space => ({
      space,
      boards: boards.filter(b => b.space_id === space.id),
    })).filter(group => group.boards.length > 0);

    return { unorganizedBoards, organizedBySpace };
  };

  if (viewMode === 'boards') {
    const { unorganizedBoards, organizedBySpace } = getBoardsBySpace();

    return (
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput placeholder="Pesquisar boards..." />
        <CommandList>
          <CommandEmpty>Nenhum board encontrado.</CommandEmpty>
          
          {/* Back button */}
          <CommandGroup>
            <CommandItem onSelect={() => setViewMode('main')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Voltar</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/kanban'))}>
              <Layout className="mr-2 h-4 w-4" />
              <span>Ver todos os Boards</span>
              <CommandShortcut>G K</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          {isLoadingBoards ? (
            <CommandGroup heading="A carregar...">
              <CommandItem disabled>
                <span className="text-muted-foreground">A carregar boards...</span>
              </CommandItem>
            </CommandGroup>
          ) : (
            <>
              {/* Spaces with boards */}
              {organizedBySpace.map(({ space, boards: spaceBoards }) => (
                <CommandGroup key={space.id} heading={space.title}>
                  {spaceBoards.map((board) => (
                    <CommandItem
                      key={board.id}
                      onSelect={() => runCommand(() => navigate(`/kanban/${board.id}`))}
                    >
                      <div 
                        className="mr-2 h-3 w-3 rounded" 
                        style={{ backgroundColor: board.color || space.color || '#0a4a6b' }}
                      />
                      <span>{board.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}

              {/* Unorganized boards */}
              {unorganizedBoards.length > 0 && (
                <CommandGroup heading="Sem Espaço">
                  {unorganizedBoards.map((board) => (
                    <CommandItem
                      key={board.id}
                      onSelect={() => runCommand(() => navigate(`/kanban/${board.id}`))}
                    >
                      <div 
                        className="mr-2 h-3 w-3 rounded" 
                        style={{ backgroundColor: board.color || '#0a4a6b' }}
                      />
                      <span>{board.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    );
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Escreva um comando ou pesquise..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        <CommandGroup heading="Navegação">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => {
                if (item.hasSubmenu) {
                  setViewMode('boards');
                } else {
                  runCommand(() => navigate(item.path));
                }
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {item.hasSubmenu && <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />}
              {item.shortcut && !item.hasSubmenu && (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Ações">
          {actionItems.map((item, index) => (
            <CommandItem
              key={index}
              onSelect={() => runCommand(item.action)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;

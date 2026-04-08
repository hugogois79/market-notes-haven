import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  SquarePlus,
  ListPlus,
} from 'lucide-react';
import { KanbanService, KanbanSpace, KanbanBoard } from '@/services/kanbanService';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenShortcutsHelp: () => void;
  currentBoardId?: string;
  onCreateBoard?: () => void;
  onCreateList?: () => void;
  onCreateCard?: () => void;
}

type ViewMode = 'main' | 'boards' | 'create';

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onOpenShortcutsHelp,
  currentBoardId,
  onCreateBoard,
  onCreateList,
  onCreateCard,
}) => {
  const navigate = useNavigate();
  const { isAdmin, hasAccess, loading: permissionsLoading } = useFeatureAccess();
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [spaces, setSpaces] = useState<KanbanSpace[]>([]);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [hasLoadedBoards, setHasLoadedBoards] = useState(false);
  
  // Check if user can see boards
  const canViewBoards = isAdmin || hasAccess('boards');

  // Reset view mode and search when dialog closes
  useEffect(() => {
    if (!open) {
      setViewMode('main');
      setSearchValue('');
    }
  }, [open]);

  // Handle entering create view
  const handleEnterCreateView = () => {
    setSearchValue('');
    setViewMode('create');
  };

  // Clear search when entering boards view
  const handleEnterBoardsView = () => {
    setSearchValue('');
    setViewMode('boards');
  };

  // Load boards and spaces when entering boards view (only if user has permission)
  useEffect(() => {
    if (viewMode === 'boards' && open && canViewBoards && !permissionsLoading) {
      loadBoardsData();
    }
  }, [viewMode, open, canViewBoards, permissionsLoading]);

  // Preload boards when opening the palette so searching "board" shows results immediately
  useEffect(() => {
    if (!open) return;
    if (permissionsLoading) return; // Wait for permissions to load
    if (!canViewBoards) return;
    if (hasLoadedBoards) return; // Avoid refetching if already loaded
    
    loadBoardsData();
    setHasLoadedBoards(true);
  }, [open, canViewBoards, permissionsLoading, hasLoadedBoards]);

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
    { icon: Layout, label: 'Boards', shortcut: 'G K', path: '/kanban', keywords: ['kanban', 'boards'], hasSubmenu: true, requiresProjects: true },
    { icon: FolderOpen, label: 'Projetos', shortcut: 'G P', path: '/projects' },
    { icon: Receipt, label: 'Despesas', shortcut: 'G E', path: '/expenses' },
    { icon: Building2, label: 'Workflow', shortcut: 'G W', path: '/companies', keywords: ['work', 'empresas', 'companies'] },
    { icon: Wallet, label: 'Crypto', path: '/crypto' },
    { icon: Scale, label: 'Legal', path: '/legal' },
    { icon: Settings, label: 'Definições', shortcut: 'G S', path: '/settings' },
  ];

  // Filter navigation items based on permissions
  const filteredNavigationItems = navigationItems.filter(item => {
    if (item.requiresProjects) {
      return canViewBoards;
    }
    return true;
  });

  const actionItems = [
    { 
      icon: Plus, 
      label: 'Criar', 
      keywords: ['create', 'criar', 'cria', 'novo', 'new', 'add', 'adicionar'],
      hasSubmenu: true,
      action: handleEnterCreateView 
    },
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

  // Create submenu view
  if (viewMode === 'create') {
    return (
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput 
          placeholder="O que pretende criar?" 
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
          
          <CommandGroup>
            <CommandItem onSelect={() => setViewMode('main')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Voltar</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Criar Novo">
            {/* Only show if inside a board */}
            {currentBoardId && onCreateCard && (
              <CommandItem onSelect={() => runCommand(onCreateCard)}>
                <SquarePlus className="mr-2 h-4 w-4" />
                <span>Novo Card</span>
              </CommandItem>
            )}
            {currentBoardId && onCreateList && (
              <CommandItem onSelect={() => runCommand(onCreateList)}>
                <ListPlus className="mr-2 h-4 w-4" />
                <span>Criar Lista</span>
              </CommandItem>
            )}
            {onCreateBoard && (
              <CommandItem onSelect={() => runCommand(onCreateBoard)}>
                <Layout className="mr-2 h-4 w-4" />
                <span>Criar Board</span>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
  }

  if (viewMode === 'boards') {
    const { unorganizedBoards, organizedBySpace } = getBoardsBySpace();

    return (
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput 
          placeholder="Pesquisar boards..." 
          value={searchValue}
          onValueChange={setSearchValue}
        />
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
      <CommandInput 
        placeholder="Escreva um comando ou pesquise..." 
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        <CommandGroup heading="Navegação">
          {filteredNavigationItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => {
                if (item.hasSubmenu) {
                  handleEnterBoardsView();
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

        {canViewBoards && (
          <CommandGroup heading="Boards">
            <CommandItem onSelect={handleEnterBoardsView}>
              <Layout className="mr-2 h-4 w-4" />
              <span>Explorar Boards</span>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </CommandItem>

            {isLoadingBoards ? (
              <CommandItem disabled>
                <span className="text-muted-foreground">A carregar boards...</span>
              </CommandItem>
            ) : (
              boards
                .filter((b) => !b.archived)
                .slice(0, 12)
                .map((board) => (
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
                ))
            )}
          </CommandGroup>
        )}

        <CommandGroup heading="Ações">
          {actionItems.map((item, index) => (
            <CommandItem
              key={index}
              keywords={item.keywords}
              onSelect={() => {
                if (item.hasSubmenu) {
                  item.action();
                } else {
                  runCommand(item.action);
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
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;

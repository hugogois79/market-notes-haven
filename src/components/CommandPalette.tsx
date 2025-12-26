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
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenShortcutsHelp: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onOpenShortcutsHelp,
}) => {
  const navigate = useNavigate();

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  const navigationItems = [
    { icon: Home, label: 'Dashboard', shortcut: 'G I', path: '/' },
    { icon: FileText, label: 'Notas', shortcut: 'G N', path: '/notes' },
    { icon: Calendar, label: 'Calendário', shortcut: 'G C', path: '/calendar' },
    { icon: Layout, label: 'Kanban', shortcut: 'G K', path: '/kanban' },
    { icon: FolderOpen, label: 'Projetos', shortcut: 'G P', path: '/projects' },
    { icon: Receipt, label: 'Despesas', shortcut: 'G E', path: '/expenses' },
    { icon: Building2, label: 'Empresas', path: '/companies' },
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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Escreva um comando ou pesquise..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        <CommandGroup heading="Navegação">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => runCommand(() => navigate(item.path))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && (
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

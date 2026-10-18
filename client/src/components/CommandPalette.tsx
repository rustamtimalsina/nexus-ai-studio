import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MessageSquare,
  Plus,
  Briefcase,
  BookOpen,
  Settings,
  Download,
  Sparkles,
  Volume2,
  VolumeX,
  Palette,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';
import { ChatSession, Workspace, PromptTemplate } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatSession[];
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  workspaces: Workspace[];
  onSelectWorkspace: (id: string) => void;
  prompts: PromptTemplate[];
  onSelectPrompt: (promptText: string) => void;
  onOpenSettings: () => void;
  onOpenPromptLibrary: () => void;
  onExportChat: () => void;
  currentTheme: string;
  onChangeTheme: (theme: 'quantum' | 'cyber' | 'solar') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  chats,
  onSelectChat,
  onNewChat,
  workspaces,
  onSelectWorkspace,
  prompts,
  onSelectPrompt,
  onOpenSettings,
  onOpenPromptLibrary,
  onExportChat,
  currentTheme,
  onChangeTheme,
  soundEnabled,
  onToggleSound,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build items list
  interface CommandItem {
    id: string;
    title: string;
    category: 'Actions' | 'Workspaces' | 'Sessions' | 'Prompts' | 'Visuals';
    icon: React.ReactNode;
    action: () => void;
  }

  const items: CommandItem[] = [];

  // Actions
  items.push({
    id: 'act-new-chat',
    title: 'Start New Synthesis Chat',
    category: 'Actions',
    icon: <Plus className="w-4 h-4 text-emerald-400" />,
    action: () => {
      onNewChat();
      onClose();
    },
  });

  items.push({
    id: 'act-export',
    title: 'Export Conversation to Markdown',
    category: 'Actions',
    icon: <Download className="w-4 h-4 text-cyan-400" />,
    action: () => {
      onExportChat();
      onClose();
    },
  });

  items.push({
    id: 'act-prompt-lib',
    title: 'Open Prompt Capsule Library',
    category: 'Actions',
    icon: <BookOpen className="w-4 h-4 text-sky-400" />,
    action: () => {
      onOpenPromptLibrary();
      onClose();
    },
  });

  items.push({
    id: 'act-settings',
    title: 'Open Settings & API Configuration',
    category: 'Actions',
    icon: <Settings className="w-4 h-4 text-emerald-400" />,
    action: () => {
      onOpenSettings();
      onClose();
    },
  });

  items.push({
    id: 'act-sound',
    title: `Sound FX: ${soundEnabled ? 'Enabled (Click to Mute)' : 'Muted (Click to Enable)'}`,
    category: 'Actions',
    icon: soundEnabled ? (
      <Volume2 className="w-4 h-4 text-cyan-400" />
    ) : (
      <VolumeX className="w-4 h-4 text-slate-500" />
    ),
    action: () => {
      onToggleSound();
      onClose();
    },
  });

  // 3D Themes
  items.push({
    id: 'theme-quantum',
    title: `3D Theme: Quantum Core ${currentTheme === 'quantum' ? '✓ (Active)' : ''}`,
    category: 'Visuals',
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    action: () => {
      onChangeTheme('quantum');
      onClose();
    },
  });

  items.push({
    id: 'theme-cyber',
    title: `3D Theme: Cyber Matrix ${currentTheme === 'cyber' ? '✓ (Active)' : ''}`,
    category: 'Visuals',
    icon: <Palette className="w-4 h-4 text-purple-400" />,
    action: () => {
      onChangeTheme('cyber');
      onClose();
    },
  });

  items.push({
    id: 'theme-solar',
    title: `3D Theme: Solar Supernova ${currentTheme === 'solar' ? '✓ (Active)' : ''}`,
    category: 'Visuals',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    action: () => {
      onChangeTheme('solar');
      onClose();
    },
  });

  // Workspaces
  workspaces.forEach((ws) => {
    items.push({
      id: `ws-${ws.id}`,
      title: `Switch Workspace: ${ws.name}`,
      category: 'Workspaces',
      icon: <Briefcase className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onSelectWorkspace(ws.id);
        onClose();
      },
    });
  });

  // Sessions
  chats.forEach((chat) => {
    items.push({
      id: `chat-${chat.id}`,
      title: chat.title,
      category: 'Sessions',
      icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onSelectChat(chat.id);
        onClose();
      },
    });
  });

  // Prompts
  prompts.slice(0, 8).forEach((p) => {
    items.push({
      id: `prompt-${p.id}`,
      title: `Use Template: ${p.title}`,
      category: 'Prompts',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      action: () => {
        onSelectPrompt(p.content);
        onClose();
      },
    });
  });

  // Filter items by query
  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search chats, switch workspace, or pick a prompt..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching commands or sessions found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 text-white border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{item.icon}</div>
                    <span className="truncate font-medium">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'translate-x-0.5 text-cyan-400' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="h-8 px-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
          <span>Navigate with ↑ ↓ and Press ↵ to run</span>
          <span>Nexus Spotlight Command Palette</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  BookOpen,
  Briefcase,
  ChevronDown,
  Layers,
  Sparkles,
  Search,
  X,
} from 'lucide-react';
import { ChatSession, Workspace } from '../types';

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  onOpenWorkspaceModal: () => void;
  onOpenPromptLibrary: () => void;
  onOpenSettings: () => void;
  onClearAllChats?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenWorkspaceModal,
  onOpenPromptLibrary,
  onOpenSettings,
  onClearAllChats,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectChat = (id: string) => {
    onSelectChat(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleNewChat = () => {
    onNewChat();
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectWorkspace = (id: string) => {
    onSelectWorkspace(id);
    setWorkspaceMenuOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 h-full flex flex-col bg-[#070c14] border-r border-slate-800/80 select-none transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">NexusAI Studio</h1>
            <p className="text-[10px] text-slate-400 font-mono">Workspace Dashboard</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 md:hidden"
          title="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="p-3 border-b border-slate-800/50">
        <div className="relative">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {currentWorkspace?.name || 'Workspace'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentWorkspace?.description || 'Active Context'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-40 overflow-hidden py-1">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                Switch Workspace Context
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                    activeWorkspaceId === ws.id
                      ? 'bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <div className="truncate">
                    <p className="truncate">{ws.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{ws.description}</p>
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  setWorkspaceMenuOpen(false);
                  onOpenWorkspaceModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-slate-800 border-t border-slate-800 mt-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workspace...</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Button & Search */}
      <div className="p-3 space-y-2 border-b border-slate-800/40">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-medium text-xs transition-all shadow-sm shadow-emerald-950/20 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>New Synthesis Chat</span>
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>
      </div>

      {/* Chat Sessions History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div className="px-2 pb-1 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center justify-between">
          <span>Sessions ({filteredChats.length})</span>
          {chats.length > 0 && onClearAllChats && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to clear all chat sessions?')) {
                  onClearAllChats();
                }
              }}
              className="text-[10px] text-slate-500 hover:text-red-400 font-mono lowercase transition-colors px-1 py-0.5 rounded hover:bg-slate-800"
              title="Clear all chat history"
            >
              clear all
            </button>
          )}
        </div>

        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            {searchQuery ? 'No matching sessions' : 'No chats yet'}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = activeChatId === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-800/90 text-white border border-slate-700/60 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{chat.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-slate-800/60 bg-[#070c14]/90 space-y-1">
        <button
          onClick={() => {
            onOpenPromptLibrary();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
        >
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span>Prompt Templates</span>
        </button>

        <button
          onClick={() => {
            onOpenSettings();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          <span>Settings & API</span>
        </button>

        <div className="pt-2 px-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Core API Active</span>
          </div>
          <span className="font-mono text-[10px]">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

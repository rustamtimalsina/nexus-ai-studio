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
}) => {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-72 md:w-80 h-full flex flex-col bg-[#070c14] border-r border-slate-800/80 select-none">
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
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    setWorkspaceMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    activeWorkspaceId === ws.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-medium truncate">{ws.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{ws.description}</p>
                  </div>
                  {activeWorkspaceId === ws.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              ))}

              <div className="border-t border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    onOpenWorkspaceModal();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace Context</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action: New Chat & Search */}
      <div className="p-3 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat Session</span>
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/70 border border-slate-800/80 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Recent Sessions ({filteredChats.length})
        </div>

        {filteredChats.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No chats found
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium shadow-sm border border-slate-700/50'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
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
          onClick={onOpenPromptLibrary}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
        >
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span>Prompt Templates</span>
        </button>

        <button
          onClick={onOpenSettings}
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

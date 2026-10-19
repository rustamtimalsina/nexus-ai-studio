import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { WorkspaceModal } from './components/WorkspaceModal';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { SettingsModal } from './components/SettingsModal';
import { ArtifactCanvas, ArtifactData } from './components/ArtifactCanvas';
import { CommandPalette } from './components/CommandPalette';
import { AITheme } from './components/AI3DCore';
import { soundService } from './services/soundService';
import { api } from './services/api';
import { ChatSession, Message, Workspace, PromptTemplate, AppSettings, MessageAttachment } from './types';

export const App: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-general');
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    provider: 'gemini',
    defaultModel: 'gemini-3.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
  });

  // Next-Level UI States
  const [currentTheme, setCurrentTheme] = useState<AITheme>(() => {
    try {
      return (localStorage.getItem('nexus_ai_theme') as AITheme) || 'quantum';
    } catch {
      return 'quantum';
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundService.isEnabled());
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Streaming & Abort controller
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals state
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Keyboard shortcuts: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      try {
        const [wsData, promptsData, settingsData] = await Promise.all([
          api.getWorkspaces(),
          api.getPrompts(),
          api.getSettings(),
        ]);
        setWorkspaces(wsData);
        setPrompts(promptsData);
        setSettings(settingsData);

        if (wsData.length > 0) {
          setActiveWorkspaceId(wsData[0].id);
        }

        const initialChats = await api.getChats();
        setChats(initialChats);
        if (initialChats.length > 0) {
          setActiveChatId(initialChats[0].id);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    initialize();
  }, []);

  // When activeChatId changes, fetch messages
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const loadMessages = async () => {
      try {
        const data = await api.getMessages(activeChatId);
        setMessages(data);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    loadMessages();
  }, [activeChatId]);

  // Handle Theme switching
  const handleThemeChange = (newTheme: AITheme) => {
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem('nexus_ai_theme', newTheme);
    } catch {}
  };

  // Handle Sound toggle
  const handleToggleSound = () => {
    const next = soundService.toggle();
    setSoundEnabled(next);
  };

  // Handle session rename
  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
    );
    try {
      const stored = localStorage.getItem('nexus_chats');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((c: any) =>
          c.id === chatId ? { ...c, title: newTitle } : c
        );
        localStorage.setItem('nexus_chats', JSON.stringify(updated));
      }
    } catch {}
  };

  // Handle Export Chat to Markdown file
  const handleExportChat = () => {
    const active = chats.find((c) => c.id === activeChatId);
    if (!active || messages.length === 0) return;

    let md = `# ${active.title}\n\n`;
    md += `*Exported from NexusAI Studio on ${new Date().toLocaleString()}*\n\n`;
    md += `**Model:** ${active.model || 'Gemini 3.5'}\n\n---\n\n`;

    messages.forEach((m) => {
      const sender = m.role === 'user' ? '👤 User' : '🤖 NexusAI';
      md += `### ${sender} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${active.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Stop active AI stream generation
  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    if (streamingContent.trim() && activeChatId) {
      const partialMsg: Message = {
        id: `msg-${Date.now()}`,
        chatId: activeChatId,
        role: 'assistant',
        content: `${streamingContent} *(Generation stopped)*`,
        timestamp: new Date().toISOString(),
        model: settings.defaultModel || 'gemini-3.5-flash',
      };
      setMessages((prev) => [...prev, partialMsg]);
    }
    setStreamingContent('');
    soundService.playClick();
  };

  // Handle new chat creation
  const handleNewChat = async () => {
    try {
      const newChat = await api.createChat({
        title: 'New Chat',
        workspaceId: activeWorkspaceId,
        model: settings.defaultModel || 'gemini-3.5-flash',
      });
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
      soundService.playClick();
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // Handle delete chat
  const handleDeleteChat = async (id: string) => {
    try {
      await api.deleteChat(id);
      const remaining = chats.filter((c) => c.id !== id);
      setChats(remaining);
      if (activeChatId === id) {
        setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      }
      soundService.playClick();
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  // Handle sending a message with live stream & abort controller & attachment
  const handleSendMessage = async (content: string, model: string, attachment?: MessageAttachment) => {
    let currentChatId = activeChatId;

    if (!currentChatId) {
      const created = await api.createChat({
        title: content.slice(0, 30) || (attachment?.name ? `Image: ${attachment.name.slice(0, 20)}` : 'Visual Analysis'),
        workspaceId: activeWorkspaceId,
        model,
      });
      setChats((prev) => [created, ...prev]);
      setActiveChatId(created.id);
      currentChatId = created.id;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setStreamingContent('');

    await api.streamMessage(
      currentChatId,
      content,
      model,
      (userMsg) => {
        setMessages((prev) => [...prev, userMsg]);
        setChats((prev) =>
          prev.map((c) =>
            c.id === currentChatId && c.title === 'New Chat'
              ? { ...c, title: content.slice(0, 30) || (attachment?.name ? `Image: ${attachment.name.slice(0, 20)}` : 'Visual Analysis') }
              : c
          )
        );
      },
      (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      },
      (fullAssistantMsg) => {
        setMessages((prev) => [...prev, fullAssistantMsg]);
        setIsLoading(false);
        setStreamingContent('');
        abortControllerRef.current = null;
        soundService.playComplete();
      },
      (error) => {
        if (!controller.signal.aborted) {
          console.error('Stream error:', error);
        }
        setIsLoading(false);
        setStreamingContent('');
        abortControllerRef.current = null;
      },
      controller.signal,
      attachment
    );
  };

  // Handle regenerate last assistant message
  const handleRegenerate = () => {
    if (messages.length === 0 || isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content, activeChat?.model || settings.defaultModel || 'gemini-3.5-flash');
    }
  };

  // Handle creating a workspace
  const handleCreateWorkspace = async (data: { name: string; description: string; systemPrompt: string }) => {
    try {
      const created = await api.createWorkspace(data);
      setWorkspaces((prev) => [...prev, created]);
      setActiveWorkspaceId(created.id);
      soundService.playClick();
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  // Handle creating a prompt template
  const handleCreatePrompt = async (data: Omit<PromptTemplate, 'id'>) => {
    try {
      const created = await api.createPrompt(data);
      setPrompts((prev) => [...prev, created]);
      soundService.playClick();
    } catch (err) {
      console.error('Failed to create prompt:', err);
    }
  };

  // Handle deleting a prompt template
  const handleDeletePrompt = async (id: string) => {
    try {
      await api.deletePrompt(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      soundService.playClick();
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  // Handle saving settings
  const handleSaveSettings = async (updates: Partial<AppSettings>) => {
    try {
      const updated = await api.updateSettings(updates);
      setSettings(updated);
      soundService.playClick();
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070c14] relative">
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={setActiveWorkspaceId}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Interface */}
      <ChatView
        chat={activeChat}
        messages={messages}
        workspace={activeWorkspace}
        isLoading={isLoading}
        streamingContent={streamingContent}
        onSendMessage={handleSendMessage}
        onOpenPromptLibrary={() => setIsPromptLibraryOpen(true)}
        onSelectPromptText={(promptText) => {
          handleSendMessage(promptText, activeChat?.model || settings.defaultModel || 'gemini-3.5-flash');
        }}
        onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        onOpenArtifact={setActiveArtifact}
        currentTheme={currentTheme}
        onChangeTheme={handleThemeChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onExportChat={handleExportChat}
        onRenameChat={handleRenameChat}
        onStopGenerating={handleStopGenerating}
        onRegenerate={handleRegenerate}
      />

      {/* Live Interactive Artifact Canvas Sandbox */}
      <ArtifactCanvas
        artifact={activeArtifact}
        onClose={() => setActiveArtifact(null)}
      />

      {/* Spotlight Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        chats={chats}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setIsCommandPaletteOpen(false);
        }}
        onNewChat={handleNewChat}
        workspaces={workspaces}
        onSelectWorkspace={(id) => {
          setActiveWorkspaceId(id);
          setIsCommandPaletteOpen(false);
        }}
        prompts={prompts}
        onSelectPrompt={(text) => {
          handleSendMessage(text, activeChat?.model || settings.defaultModel || 'gemini-3.5-flash');
          setIsCommandPaletteOpen(false);
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        onOpenPromptLibrary={() => {
          setIsPromptLibraryOpen(true);
          setIsCommandPaletteOpen(false);
        }}
        onExportChat={handleExportChat}
        currentTheme={currentTheme}
        onChangeTheme={handleThemeChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Modals */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onCreateWorkspace={handleCreateWorkspace}
      />

      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        prompts={prompts}
        onSelectPrompt={(text) => {
          handleSendMessage(text, activeChat?.model || settings.defaultModel || 'gemini-3.5-flash');
        }}
        onCreatePrompt={handleCreatePrompt}
        onDeletePrompt={handleDeletePrompt}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
};

export default App;

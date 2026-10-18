import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { WorkspaceModal } from './components/WorkspaceModal';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import { SettingsModal } from './components/SettingsModal';
import { api } from './services/api';
import { ChatSession, Message, Workspace, PromptTemplate, AppSettings } from './types';

export const App: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-general');
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    provider: 'mock',
    defaultModel: 'gemini-3.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
  });

  // Streaming state
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Modals state
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  // Handle sending a message with live stream
  const handleSendMessage = async (content: string, model: string) => {
    let currentChatId = activeChatId;

    // If no active chat, create one automatically
    if (!currentChatId) {
      const created = await api.createChat({
        title: content.slice(0, 30),
        workspaceId: activeWorkspaceId,
        model,
      });
      setChats((prev) => [created, ...prev]);
      setActiveChatId(created.id);
      currentChatId = created.id;
    }

    setIsLoading(true);
    setStreamingContent('');

    await api.streamMessage(
      currentChatId,
      content,
      model,
      (userMsg) => {
        setMessages((prev) => [...prev, userMsg]);
        // Update chat title in sidebar if it was "New Chat"
        setChats((prev) =>
          prev.map((c) =>
            c.id === currentChatId && c.title === 'New Chat'
              ? { ...c, title: content.slice(0, 30) }
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
      },
      (error) => {
        console.error('Stream error:', error);
        setIsLoading(false);
        setStreamingContent('');
      }
    );
  };

  // Handle creating a workspace
  const handleCreateWorkspace = async (data: { name: string; description: string; systemPrompt: string }) => {
    try {
      const created = await api.createWorkspace(data);
      setWorkspaces((prev) => [...prev, created]);
      setActiveWorkspaceId(created.id);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  // Handle creating a prompt template
  const handleCreatePrompt = async (data: Omit<PromptTemplate, 'id'>) => {
    try {
      const created = await api.createPrompt(data);
      setPrompts((prev) => [...prev, created]);
    } catch (err) {
      console.error('Failed to create prompt:', err);
    }
  };

  // Handle deleting a prompt template
  const handleDeletePrompt = async (id: string) => {
    try {
      await api.deletePrompt(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  // Handle saving settings
  const handleSaveSettings = async (updates: Partial<AppSettings>) => {
    try {
      const updated = await api.updateSettings(updates);
      setSettings(updated);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
          handleSendMessage(text, activeChat?.model || settings.defaultModel || 'gemini-3.8-flash');
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

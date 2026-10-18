import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkles,
  Terminal,
  Info,
  ChevronRight,
  Eye,
  EyeOff,
  Cpu,
  Activity,
  Zap,
  Menu,
} from 'lucide-react';
import { ChatSession, Message, Workspace } from '../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AI3DCore } from './AI3DCore';

interface ChatViewProps {
  chat: ChatSession | null;
  messages: Message[];
  workspace: Workspace | null;
  isLoading: boolean;
  streamingContent: string;
  onSendMessage: (content: string, model: string) => void;
  onOpenPromptLibrary: () => void;
  onSelectPromptText: (text: string) => void;
  onToggleMobileMenu?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chat,
  messages,
  workspace,
  isLoading,
  streamingContent,
  onSendMessage,
  onOpenPromptLibrary,
  onSelectPromptText,
  onToggleMobileMenu,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(chat?.model || 'gemini-3.8-flash');
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [show3DCompanion, setShow3DCompanion] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    if (chat?.model) {
      setSelectedModel(chat.model);
    }
  }, [chat]);

  const quickPrompts = [
    {
      title: 'Quantum Code Synthesizer',
      desc: 'Build high-performance algorithms and clean TypeScript patterns',
      prompt: 'Write a high-performance TypeScript service that handles concurrency and cancellation gracefully.',
    },
    {
      title: 'Autonomous System Architecture',
      desc: 'Design fault-tolerant distributed cloud infrastructure',
      prompt: 'Design a scalable, distributed microservices architecture for real-time streaming data with low latency.',
    },
    {
      title: 'Neural Debugger & Diagnostics',
      desc: 'Examine stack traces and isolate performance bottlenecks',
      prompt: 'Help me diagnose and optimize this code for speed, memory efficiency, and zero bugs.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050811] relative overflow-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="h-14 border-b border-cyan-500/20 px-3 sm:px-6 flex items-center justify-between bg-[#070c18]/80 backdrop-blur-md z-20 shrink-0 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400 shrink-0" />
            <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-[130px] sm:max-w-xs md:max-w-md">
              {chat ? chat.title : 'Nexus 3D Intelligence'}
            </h2>
          </div>

          {workspace && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/80 text-cyan-300 border border-cyan-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {workspace.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 3D Companion Toggle */}
          <button
            onClick={() => setShow3DCompanion(!show3DCompanion)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
              show3DCompanion
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-950'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle 3D Interactive AI Core"
          >
            {show3DCompanion ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline font-mono text-[11px]">3D AI Core</span>
          </button>

          {workspace && (
            <button
              onClick={() => setShowSystemInfo(!showSystemInfo)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="View system prompt"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline font-mono text-[11px]">System Role</span>
            </button>
          )}
        </div>
      </div>

      {/* System prompt banner drawer */}
      {showSystemInfo && workspace && (
        <div className="p-3 bg-slate-900/95 border-b border-cyan-500/30 text-xs text-slate-300 flex items-start justify-between gap-4 animate-in slide-in-from-top-2 z-20">
          <div className="max-w-3xl mx-auto flex-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>Workspace System Matrix:</span>
            </div>
            <p className="font-mono text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed text-[11px]">
              {workspace.systemPrompt}
            </p>
          </div>
          <button
            onClick={() => setShowSystemInfo(false)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* 3D Interactive Centerpiece */
            <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6 text-center flex flex-col items-center justify-center min-h-[80%]">
              {/* Interactive 3D Canvas */}
              <div className="w-48 h-48 sm:w-80 sm:h-80 relative flex items-center justify-center mb-2">
                <AI3DCore
                  isGenerating={isLoading}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isTyping={isTyping}
                  className="w-full h-full"
                />
              </div>

              {/* Holographic Telemetry Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 flex-wrap justify-center">
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-[10px] sm:text-[11px] font-mono text-cyan-300">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3D Audio Core</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[10px] sm:text-[11px] font-mono text-emerald-300">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gemini 3.8 Neural</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-[10px] sm:text-[11px] font-mono text-purple-300">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Voice Input</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-wide">
                {workspace ? workspace.name : 'Nexus 3D Workspace'}
              </h3>
              <p className="text-xs text-slate-400 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed px-2">
                Interact with the 3D entity above with your mouse or voice, or tap a prompt capsule below to begin synthesis.
              </p>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left w-full">
                {quickPrompts.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectPromptText(item.prompt)}
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all text-left group shadow-lg shadow-black/40 hover:shadow-cyan-950/30 active:scale-98"
                  >
                    <p className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-1">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                      <span>Synthesize</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pb-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onSpeakingChange={setIsSpeaking}
                />
              ))}

              {isLoading && (
                <ChatMessage
                  message={{
                    id: 'streaming-temp',
                    chatId: chat?.id || '',
                    role: 'assistant',
                    content: streamingContent || 'Synthesizing neural response...',
                    timestamp: new Date().toISOString(),
                    model: selectedModel,
                  }}
                  isStreaming={true}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Floating / Docked 3D AI Companion when messages are active */}
        {messages.length > 0 && show3DCompanion && (
          <div className="hidden lg:flex w-72 h-full border-l border-cyan-500/20 bg-[#070c18]/90 backdrop-blur-md flex-col items-center justify-between p-4 z-10 shrink-0">
            <div className="w-full text-center">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-2 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  VOICE 3D CORE
                </span>
                <span className="text-slate-500">60 FPS</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Interactive mouse & audio reactivity
              </p>
            </div>

            <div className="w-56 h-56 my-auto">
              <AI3DCore
                isGenerating={isLoading}
                isListening={isListening}
                isSpeaking={isSpeaking}
                isTyping={isTyping}
                className="w-full h-full"
              />
            </div>

            <div className="w-full p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Voice Synthesis:</span>
                <span className="text-cyan-300">{isSpeaking ? 'Transmitting' : 'Idle'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Audio Reactive:</span>
                <span className="text-emerald-400">{isListening ? 'Receiving Voice' : 'Ready'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onOpenPromptLibrary={onOpenPromptLibrary}
        onListeningChange={setIsListening}
        onTypingChange={setIsTyping}
      />
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, ChevronDown, Sparkles, Mic, MicOff, Square, ShieldCheck } from 'lucide-react';
import { audioService } from '../services/audioService';
import { soundService } from '../services/soundService';
import { VoiceState } from '../types';
import { VoiceStatusHUD } from './VoiceStatusHUD';

interface ChatInputProps {
  onSendMessage: (content: string, model: string) => void;
  isLoading: boolean;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onOpenPromptLibrary: () => void;
  onStopGenerating?: () => void;
  onListeningChange?: (isListening: boolean) => void;
  onTypingChange?: (isTyping: boolean) => void;
  voiceState?: VoiceState;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', badge: 'Active Neural' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Lite', badge: 'Ultra Fast' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Deep Reasoning' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  selectedModel,
  onSelectModel,
  onOpenPromptLibrary,
  onStopGenerating,
  onListeningChange,
  onTypingChange,
  voiceState,
}) => {
  const [input, setInput] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
    if (onTypingChange) {
      onTypingChange(Boolean(input.trim()));
    }
  }, [input, onTypingChange]);

  // Click outside to close model dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (isListening) {
      handleToggleMic();
    }
    soundService.playSend();
    onSendMessage(input.trim(), selectedModel);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleToggleMic = () => {
    if (isListening) {
      audioService.stopListening();
      setIsListening(false);
      if (onListeningChange) onListeningChange(false);
    } else {
      setMicError(null);
      const preExisting = input.trim();

      const started = audioService.startListening(
        (transcript, _isFinal) => {
          if (preExisting) {
            setInput(`${preExisting} ${transcript}`);
          } else {
            setInput(transcript);
          }
        },
        (error) => {
          console.warn('Voice error:', error);
          setMicError(error);
          setIsListening(false);
          if (onListeningChange) onListeningChange(false);
        },
        () => {
          setIsListening(false);
          if (onListeningChange) onListeningChange(false);
        }
      );

      if (started) {
        setIsListening(true);
        if (onListeningChange) onListeningChange(true);
      }
    }
  };

  const activeModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div className="p-2 sm:p-4 bg-[#070c18]/95 border-t border-cyan-500/20 backdrop-blur-md">
      <div className="max-w-3xl mx-auto">
        {/* Error Notification */}
        {micError && (
          <div className="mb-2.5 p-3 rounded-xl bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs flex items-start justify-between shadow-xl animate-in fade-in">
            <div className="flex items-start gap-2.5 min-w-0 pr-2">
              <span className="text-base shrink-0">🦁</span>
              <div className="leading-relaxed">
                <p className="text-amber-100 font-semibold mb-0.5">Brave Voice Privacy Notice</p>
                <p className="text-amber-200/90 text-[11px] leading-relaxed">{micError}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('brave://settings/privacy');
                    }}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-mono text-[11px] transition-colors flex items-center gap-1 active:scale-95"
                    title="Copy setting URL to clipboard"
                  >
                    <span>📋 Copy brave://settings/privacy</span>
                  </button>
                  <span className="text-[11px] text-amber-300/70 font-sans">
                    or open this link in Google Chrome / Edge
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMicError(null)}
              className="text-amber-400 hover:text-white font-bold shrink-0 px-1.5 py-0.5 rounded hover:bg-amber-900/40 text-sm"
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Toolbar above input */}
        <div className="flex items-center justify-between mb-2 px-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {/* Model Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-750 border border-cyan-500/30 text-cyan-300 hover:text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-medium text-xs max-w-[120px] sm:max-w-none truncate">
                  {activeModel.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {modelDropdownOpen && (
                <div className="absolute bottom-full mb-1 left-0 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-30 py-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Select Model
                  </div>
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-800 transition-colors ${
                        selectedModel === model.id ? 'bg-slate-800/80 text-cyan-400' : 'text-slate-300'
                      }`}
                    >
                      <span className="font-medium">{model.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {model.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Library Button (visible on mobile too!) */}
            <button
              type="button"
              onClick={onOpenPromptLibrary}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors text-xs"
              title="Open Prompt Library"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="hidden sm:inline">Prompt Library</span>
              <span className="sm:hidden">Prompts</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <VoiceStatusHUD
              voiceState={
                isListening
                  ? 'listening'
                  : isLoading
                  ? 'transcribing'
                  : voiceState || 'idle'
              }
              compact
            />
            <div className="hidden sm:block text-[11px] text-slate-500 font-mono">
              Shift + Enter for new line
            </div>
          </div>
        </div>

        {/* Input box */}
        <form
          onSubmit={handleSubmit}
          className={`relative flex items-end rounded-xl border bg-slate-950/80 shadow-2xl transition-all ${
            isListening
              ? 'border-rose-500/80 ring-2 ring-rose-500/30'
              : 'border-cyan-500/30 focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/40'
          }`}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? '🎙️ Listening... Speak now (words will appear here)'
                : 'Ask anything, explore ideas, or tap the mic to speak...'
            }
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-3 sm:px-4 py-3 text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none max-h-40 disabled:opacity-50"
          />

          <div className="p-1.5 sm:p-2 flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Microphone Voice Button with Persistent Mic Status */}
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={isLoading}
              className={`relative flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg transition-all shadow-md ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-900/60 ring-2 ring-rose-400'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-400 active:scale-95'
              }`}
              title={
                isListening
                  ? 'Stop voice recording'
                  : 'Speak with your microphone (Mic is currently inactive & muted)'
              }
            >
              {isListening ? (
                <Mic className="w-4 h-4 text-white animate-bounce" />
              ) : (
                <Mic className="w-4 h-4 text-slate-300" />
              )}
              {!isListening && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center"
                  title="Mic is cleanly terminated"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                </span>
              )}
            </button>

            {/* Submit / Stop Button */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStopGenerating}
                className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-950/60 active:scale-95 animate-pulse"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-40 text-white transition-all shadow-md shadow-cyan-950/50 active:scale-95"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

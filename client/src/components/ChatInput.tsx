import React, { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, ChevronDown, Sparkles, Mic, MicOff } from 'lucide-react';
import { audioService } from '../services/audioService';

interface ChatInputProps {
  onSendMessage: (content: string, model: string) => void;
  isLoading: boolean;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onOpenPromptLibrary: () => void;
  onListeningChange?: (isListening: boolean) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Fast & Smart' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', badge: 'Deep Reasoning' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', badge: 'High Throughput' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', badge: 'Auto-Updated' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  selectedModel,
  onSelectModel,
  onOpenPromptLibrary,
  onListeningChange,
  onTypingChange,
}) => {
  const [input, setInput] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
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
      const started = audioService.startListening(
        (transcript, isFinal) => {
          setInput(transcript);
        },
        (error) => {
          console.warn('Voice error:', error);
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
    <div className="p-4 bg-[#070c18]/90 border-t border-cyan-500/20 backdrop-blur-md">
      <div className="max-w-3xl mx-auto">
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
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium">{activeModel.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
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

            {/* Prompt Library Button */}
            <button
              type="button"
              onClick={onOpenPromptLibrary}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/40 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Prompt Library</span>
            </button>
          </div>

          <div className="hidden sm:block text-[11px] text-slate-500 font-mono">
            Shift + Enter for new line
          </div>
        </div>

        {/* Input box */}
        <form
          onSubmit={handleSubmit}
          className={`relative flex items-end rounded-xl border bg-slate-950/80 shadow-2xl transition-all ${
            isListening
              ? 'border-fuchsia-500/80 ring-2 ring-fuchsia-500/30'
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
                ? '🎙️ Listening to your voice... Speak now'
                : 'Ask anything, explore ideas, or click the mic to speak...'
            }
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none max-h-48 disabled:opacity-50"
          />

          <div className="p-2 flex items-center gap-1.5 shrink-0">
            {/* Microphone Voice Button */}
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={isLoading}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-md ${
                isListening
                  ? 'bg-fuchsia-600 text-white animate-pulse shadow-fuchsia-900/50 ring-2 ring-fuchsia-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400'
              }`}
              title={isListening ? 'Stop voice recording' : 'Speak with your microphone'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Submit Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-40 text-white transition-all shadow-md shadow-cyan-950/50"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

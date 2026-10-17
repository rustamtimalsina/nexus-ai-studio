import React, { useState } from 'react';
import { Bot, User, Copy, Check, Sparkles, Terminal, Volume2, VolumeX } from 'lucide-react';
import { Message } from '../types';
import { audioService } from '../services/audioService';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming, onSpeakingChange }) => {
  const isUser = message.role === 'user';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clean math LaTeX syntax into crisp readable expressions
  const formatMathString = (text: string) => {
    return text
      .replace(/\$\$/g, '')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\{,\}/g, ',')
      .replace(/\\{/g, '')
      .replace(/\\}/g, '')
      .replace(/\\left/g, '')
      .replace(/\\right/g, '')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .trim();
  };

  // Helper to render formatted markdown
  const renderFormattedContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    let codeBlockIndex = 0;

    lines.forEach((line, index) => {
      // 1. Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          const fullCode = codeBuffer.join('\n');
          const blockId = `code-${message.id}-${codeBlockIndex++}`;
          parts.push(
            <div key={blockId} className="my-3 rounded-xl overflow-hidden border border-cyan-500/30 bg-[#090d16] shadow-xl">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-cyan-500/20 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="uppercase text-[11px] font-semibold tracking-wider text-cyan-300">
                    {codeLanguage || 'code'}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(fullCode, blockId)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {copiedId === blockId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-xs">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                <code>{fullCode}</code>
              </pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // 2. Math display block ($$...$$)
      if (line.includes('$$')) {
        const cleanMath = formatMathString(line);
        parts.push(
          <div key={`math-${index}`} className="my-2 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 font-mono text-cyan-200 text-sm shadow-inner">
            {cleanMath}
          </div>
        );
        return;
      }

      // 3. Headings
      if (line.startsWith('### ')) {
        parts.push(
          <h3 key={index} className="text-base font-bold text-cyan-300 mt-4 mb-1.5">
            {formatInlineText(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        parts.push(
          <h2 key={index} className="text-lg font-extrabold text-white mt-5 mb-2">
            {formatInlineText(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        parts.push(
          <h1 key={index} className="text-xl font-black text-white mt-6 mb-2 tracking-wide">
            {formatInlineText(line.slice(2))}
          </h1>
        );
      } else if (line.startsWith('> ')) {
        parts.push(
          <blockquote key={index} className="border-l-2 border-cyan-400/80 pl-3.5 my-2.5 text-cyan-100/90 italic text-sm bg-cyan-950/20 py-1 rounded-r">
            {formatInlineText(line.slice(2))}
          </blockquote>
        );
      } else if (line.match(/^(\*|-)\s+/)) {
        parts.push(
          <li key={index} className="ml-4 list-disc text-slate-200 my-1 text-sm marker:text-cyan-400">
            {formatInlineText(line.replace(/^(\*|-)\s+/, ''))}
          </li>
        );
      } else if (line.match(/^\d+\.\s+/)) {
        parts.push(
          <div key={index} className="flex gap-2 text-slate-200 my-1 text-sm">
            <span className="font-bold text-cyan-400">{line.match(/^\d+\./)?.[0]}</span>
            <span>{formatInlineText(line.replace(/^\d+\.\s+/, ''))}</span>
          </div>
        );
      } else if (line.trim() === '') {
        parts.push(<div key={index} className="h-2" />);
      } else {
        parts.push(
          <p key={index} className="my-1.5 text-sm leading-relaxed text-slate-200">
            {formatInlineText(line)}
          </p>
        );
      }
    });

    if (inCodeBlock && codeBuffer.length > 0) {
      parts.push(
        <div key="unclosed-code" className="my-2 rounded-xl p-3 bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-300">
          <pre>{codeBuffer.join('\n')}</pre>
        </div>
      );
    }

    return parts;
  };

  // Inline formatting
  const formatInlineText = (text: string) => {
    const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return tokens.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded text-[13px] font-mono border border-cyan-500/30">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-300">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className={`py-5 px-4 md:px-8 transition-colors ${isUser ? 'bg-[#0b101d]/60 border-y border-slate-800/40' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
            isUser
              ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-sky-900/30'
              : 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-cyan-900/40 ring-1 ring-cyan-400/40'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-200">
              {isUser ? 'You' : 'Nexus 3D Intelligence'}
            </span>
            {message.model && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {message.model}
              </span>
            )}
            <span className="text-[11px] text-slate-500 ml-auto font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="text-slate-200">
            {renderFormattedContent(message.content)}
            {isStreaming && (
              <span className="inline-block w-2.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle shadow-sm shadow-cyan-400" />
            )}
          </div>

          {!isUser && !isStreaming && (
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <button
                type="button"
                onClick={() => {
                  if (isAudioPlaying) {
                    audioService.stopSpeaking();
                    setIsAudioPlaying(false);
                    if (onSpeakingChange) onSpeakingChange(false);
                  } else {
                    setIsAudioPlaying(true);
                    if (onSpeakingChange) onSpeakingChange(true);
                    audioService.speak(
                      message.content,
                      () => {
                        setIsAudioPlaying(true);
                        if (onSpeakingChange) onSpeakingChange(true);
                      },
                      () => {
                        setIsAudioPlaying(false);
                        if (onSpeakingChange) onSpeakingChange(false);
                      }
                    );
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
                  isAudioPlaying
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-950 animate-pulse'
                    : 'bg-slate-800/60 text-slate-400 hover:text-cyan-300 border-slate-700/60'
                }`}
                title={isAudioPlaying ? 'Stop speaking' : 'Read answer aloud with 3D voice'}
              >
                {isAudioPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{isAudioPlaying ? 'Stop Audio' : 'Speak Aloud'}</span>
              </button>

              {message.tokens && (
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400/80" />
                  <span>~{message.tokens} tokens synthesized</span>
                </div>
              )}
            </div>
          )}

          {isUser && message.tokens && (
            <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-slate-500" />
              <span>~{message.tokens} tokens</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

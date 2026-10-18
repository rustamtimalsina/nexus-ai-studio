import React, { useState } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  FileCode,
} from 'lucide-react';
import { Message } from '../types';
import { audioService } from '../services/audioService';
import { soundService } from '../services/soundService';
import { ArtifactData } from './ArtifactCanvas';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onOpenArtifact?: (artifact: ArtifactData) => void;
  onRegenerate?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming,
  onSpeakingChange,
  onOpenArtifact,
  onRegenerate,
}) => {
  const isUser = message.role === 'user';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    soundService.playClick();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(message.content);
    soundService.playClick();
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
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
          const langLower = (codeLanguage || '').toLowerCase();
          const isRunnable =
            ['html', 'js', 'javascript', 'typescript', 'ts', 'svg', 'css'].includes(langLower) ||
            fullCode.includes('<html') ||
            fullCode.includes('<div') ||
            fullCode.includes('<svg');

          parts.push(
            <div
              key={blockId}
              className="my-3 rounded-xl overflow-hidden border border-cyan-500/30 bg-[#090d16] shadow-xl group/block"
            >
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-900/90 border-b border-cyan-500/20 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="uppercase text-[11px] font-semibold tracking-wider text-cyan-300 truncate">
                    {codeLanguage || 'code'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Live Artifact Sandbox Button */}
                  {isRunnable && onOpenArtifact && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenArtifact({
                          title: `${(codeLanguage || 'Component').toUpperCase()} Sandbox`,
                          language: codeLanguage || 'html',
                          code: fullCode,
                        })
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-all shadow-xs"
                      title="Run in live Interactive Artifact Sandbox"
                    >
                      <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                      <span>Live Preview</span>
                    </button>
                  )}

                  <button
                    type="button"
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
              </div>
              <pre className="p-3 sm:p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed select-text">
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
          <div
            key={`math-${index}`}
            className="my-2 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 font-mono text-cyan-200 text-sm shadow-inner overflow-x-auto"
          >
            {cleanMath}
          </div>
        );
        return;
      }

      // 3. Headings
      if (line.startsWith('### ')) {
        parts.push(
          <h4 key={index} className="text-sm font-bold text-white mt-3 mb-1.5">
            {line.slice(4)}
          </h4>
        );
        return;
      }
      if (line.startsWith('## ')) {
        parts.push(
          <h3 key={index} className="text-base font-bold text-cyan-200 mt-4 mb-2">
            {line.slice(3)}
          </h3>
        );
        return;
      }
      if (line.startsWith('# ')) {
        parts.push(
          <h2 key={index} className="text-lg font-bold text-white mt-4 mb-2">
            {line.slice(2)}
          </h2>
        );
        return;
      }

      // 4. Bullet lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const text = line.slice(2);
        parts.push(
          <div key={index} className="flex items-start gap-2 ml-2 my-1 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
            <span>{renderInlineFormatting(text)}</span>
          </div>
        );
        return;
      }

      // 5. Numbered lists
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        parts.push(
          <div key={index} className="flex items-start gap-2 ml-2 my-1 leading-relaxed">
            <span className="font-mono text-xs text-cyan-400 shrink-0 font-bold">
              {numMatch[1]}.
            </span>
            <span>{renderInlineFormatting(numMatch[2])}</span>
          </div>
        );
        return;
      }

      // 6. Regular paragraphs
      if (line.trim()) {
        parts.push(
          <p key={index} className="my-1.5 leading-relaxed text-slate-200">
            {renderInlineFormatting(line)}
          </p>
        );
      } else {
        parts.push(<div key={index} className="h-2" />);
      }
    });

    return parts;
  };

  // Helper for bold, code, inline math
  const renderInlineFormatting = (text: string) => {
    const inlineParts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        inlineParts.push(text.slice(lastIdx, match.index));
      }

      const matchStr = match[0];
      if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
        inlineParts.push(
          <strong key={match.index} className="font-semibold text-white">
            {matchStr.slice(2, -2)}
          </strong>
        );
      } else if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
        inlineParts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]"
          >
            {matchStr.slice(1, -1)}
          </code>
        );
      } else if (matchStr.startsWith('$') && matchStr.endsWith('$')) {
        inlineParts.push(
          <span key={match.index} className="font-mono text-cyan-300 font-medium">
            {formatMathString(matchStr)}
          </span>
        );
      }

      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      inlineParts.push(text.slice(lastIdx));
    }

    return inlineParts;
  };

  return (
    <div
      className={`py-4 sm:py-5 px-3 sm:px-6 transition-colors border-b border-slate-900/40 ${
        isUser ? 'bg-[#080d1a]/50' : 'bg-[#050812]/90'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4 items-start">
        {/* Avatar */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-md ${
            isUser
              ? 'bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-cyan-900/40'
              : 'bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 shadow-cyan-950/50'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-200">
              {isUser ? 'You' : 'Nexus 3D Intelligence'}
            </span>
            {message.model && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {message.model}
              </span>
            )}
            <span className="text-[11px] text-slate-500 ml-auto font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="text-slate-200 select-text">
            {renderFormattedContent(message.content)}
            {isStreaming && (
              <span className="inline-block w-2.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle shadow-sm shadow-cyan-400" />
            )}
          </div>

          {!isUser && !isStreaming && (
            <div className="mt-3.5 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-500 font-mono flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Text-To-Speech Button */}
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
                  {isAudioPlaying ? (
                    <VolumeX className="w-3.5 h-3.5 text-cyan-300" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{isAudioPlaying ? 'Stop Audio' : 'Speak Aloud'}</span>
                </button>

                {/* Copy Raw Markdown */}
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
                  title="Copy full response formatted markdown"
                >
                  {copiedMarkdown ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>

                {/* Regenerate Button */}
                {onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-700/60 transition-colors"
                    title="Regenerate this response with fresh neural tokens"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>

              {message.tokens && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
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

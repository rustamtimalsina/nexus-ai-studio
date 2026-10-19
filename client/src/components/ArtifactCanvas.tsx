import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Code2,
  Terminal,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Share2,
} from 'lucide-react';

export interface ArtifactData {
  title: string;
  language: string;
  code: string;
}

interface ArtifactCanvasProps {
  artifact: ArtifactData | null;
  onClose: () => void;
}

export const ArtifactCanvas: React.FC<ArtifactCanvasProps> = ({ artifact, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'console'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const [editableCode, setEditableCode] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLogs([]);
    setIframeKey((k) => k + 1);
    if (artifact) {
      setEditableCode(artifact.code);
    }
  }, [artifact]);

  if (!artifact) return null;

  const isHtml =
    artifact.language.toLowerCase() === 'html' ||
    artifact.code.includes('<!DOCTYPE html>') ||
    artifact.code.includes('<html') ||
    artifact.code.includes('<div') ||
    artifact.code.includes('<svg') ||
    artifact.language.toLowerCase() === 'svg';

  const isJs =
    artifact.language.toLowerCase() === 'javascript' ||
    artifact.language.toLowerCase() === 'js' ||
    artifact.language.toLowerCase() === 'typescript' ||
    artifact.language.toLowerCase() === 'ts';

  const handleCopy = () => {
    navigator.clipboard.writeText(editableCode || artifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = isHtml
      ? artifact.language.toLowerCase() === 'svg'
        ? 'svg'
        : 'html'
      : isJs
      ? 'js'
      : 'txt';
    const cleanTitle = (artifact.title || 'artifact')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const currentCode = editableCode || artifact.code;
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-${cleanTitle || 'component'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const html = generatePreviewHtml();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  const handleExportCodePen = () => {
    const currentCode = editableCode || artifact.code;
    const isSvg = artifact.language.toLowerCase() === 'svg' || currentCode.trim().startsWith('<svg');
    const isHtmlContent = isSvg || isHtml || currentCode.includes('<html') || currentCode.includes('<!DOCTYPE') || currentCode.includes('<div');

    const payload = {
      title: artifact.title || 'NexusAI Prototype',
      description: 'Built with NexusAI Studio — Interactive AI Prototype by Rustam Timalsina',
      tags: ['nexus-ai', 'react', 'prototype', 'tailwindcss'],
      html: isHtmlContent ? currentCode : '<div id="app"></div>',
      js: !isHtmlContent ? currentCode : '',
      editors: '101',
    };

    const form = document.createElement('form');
    form.action = 'https://codepen.io/pen/define';
    form.method = 'POST';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(payload);

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleRefresh = () => {
    setLogs([]);
    setIframeKey((k) => k + 1);
  };

  // Generate safe sandboxed HTML payload with console listener
  const generatePreviewHtml = () => {
    let rawCode = editableCode || artifact.code;

    // If bare SVG, wrap it nicely in centered dark backdrop
    if (artifact.language.toLowerCase() === 'svg' || (rawCode.trim().startsWith('<svg') && rawCode.trim().endsWith('</svg>'))) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; min-height: 100vh; display: flex; items-center; justify-content: center; background: #070c14; }
            svg { max-width: 90vw; max-height: 90vh; }
          </style>
        </head>
        <body>${rawCode}</body>
        </html>
      `;
    }

    // If bare JS code, wrap in HTML harness
    if (isJs && !rawCode.includes('<html')) {
      rawCode = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; padding: 20px; font-family: monospace; background: #070c14; color: #38bdf8; }
          </style>
        </head>
        <body>
          <div id="app"></div>
          <script>
            try {
              ${rawCode}
            } catch (err) {
              console.error(err);
              document.body.innerHTML += '<p style="color: #ef4444;">Error: ' + err.message + '</p>';
            }
          </script>
        </body>
        </html>
      `;
    }

    // Inject console log interceptor
    const consoleInterceptor = `
      <script>
        (function() {
          var oldLog = console.log;
          var oldError = console.error;
          var oldWarn = console.warn;
          function sendLog(type, args) {
            try {
              var msg = Array.from(args).map(function(a) {
                return typeof a === 'object' ? JSON.stringify(a) : String(a);
              }).join(' ');
              window.parent.postMessage({ type: 'nexus_console', logType: type, message: msg }, '*');
            } catch(e) {}
          }
          console.log = function() { sendLog('log', arguments); oldLog.apply(console, arguments); };
          console.error = function() { sendLog('error', arguments); oldError.apply(console, arguments); };
          console.warn = function() { sendLog('warn', arguments); oldWarn.apply(console, arguments); };
        })();
      </script>
    `;

    if (rawCode.includes('<head>')) {
      return rawCode.replace('<head>', `<head>${consoleInterceptor}`);
    } else {
      return `${consoleInterceptor}${rawCode}`;
    }
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'nexus_console') {
        setLogs((prev) => [...prev, `[${e.data.logType.toUpperCase()}] ${e.data.message}`]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div
      className={`fixed transition-all duration-300 ease-in-out z-50 flex flex-col bg-[#070c18] border-l border-cyan-500/30 shadow-2xl backdrop-blur-xl ${
        isFullscreen
          ? 'inset-0 w-screen h-screen'
          : 'inset-y-0 right-0 w-full sm:w-[540px] md:w-[620px] lg:w-[700px]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="h-14 px-4 border-b border-cyan-500/20 bg-slate-950/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold text-white truncate font-mono">
              {artifact.title || 'Interactive Artifact'}
            </h3>
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold tracking-wider">
              {artifact.language} Canvas
            </span>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span className="hidden sm:inline">Code</span>
            </button>

            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                activeTab === 'console'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span className="hidden sm:inline">Logs</span>
              {logs.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
            title="Reload sandbox"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Download artifact file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenNewTab}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
            title="Open preview in standalone browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportCodePen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors hidden sm:block"
            title="Open in CodePen playground"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors hidden sm:block"
            title={isFullscreen ? 'Exit fullscreen' : 'Expand fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-300 transition-colors ml-1"
            title="Close artifact canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden relative bg-[#040711]">
        {/* Tab 1: Live Interactive Preview */}
        {activeTab === 'preview' && (
          <div className="w-full h-full flex flex-col">
            <iframe
              key={iframeKey}
              ref={iframeRef}
              srcDoc={generatePreviewHtml()}
              title="Artifact Sandbox"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="w-full h-full border-none bg-white/5"
            />
          </div>
        )}

        {/* Tab 2: Live Interactive Code Editor with Hot Reload */}
        {activeTab === 'code' && (
          <div className="w-full h-full flex flex-col bg-[#050811]">
            <div className="h-9 px-4 bg-slate-900/90 border-b border-cyan-500/20 flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-[11px] text-cyan-300 font-semibold uppercase">
                  Live Editor ({artifact.language})
                </span>
                {editableCode !== artifact.code && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Modified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editableCode !== artifact.code && (
                  <button
                    onClick={() => {
                      setEditableCode(artifact.code);
                      setIframeKey((k) => k + 1);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline hover:no-underline"
                  >
                    Reset to original
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveTab('preview');
                    setIframeKey((k) => k + 1);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-medium"
                >
                  <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>Run in Preview</span>
                </button>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <textarea
                value={editableCode}
                onChange={(e) => {
                  setEditableCode(e.target.value);
                  setIframeKey((k) => k + 1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const target = e.target as HTMLTextAreaElement;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const value = target.value;
                    const newValue = value.substring(0, start) + '  ' + value.substring(end);
                    setEditableCode(newValue);
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = start + 2;
                    }, 0);
                  }
                }}
                spellCheck={false}
                className="w-full h-full p-4 bg-transparent text-cyan-300 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-0 select-text overflow-auto"
                placeholder="Type or edit code here..."
              />
            </div>
          </div>
        )}

        {/* Tab 3: Console Logs */}
        {activeTab === 'console' && (
          <div className="w-full h-full overflow-auto p-4 font-mono text-xs text-slate-300 space-y-1.5">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">No console logs emitted yet.</div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`p-1.5 rounded bg-slate-900/60 border ${
                    log.includes('[ERROR]')
                      ? 'border-red-500/40 text-red-300'
                      : log.includes('[WARN]')
                      ? 'border-amber-500/40 text-amber-300'
                      : 'border-slate-800 text-cyan-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Pill */}
      <div className="h-8 px-4 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Sandboxed HTML5 Engine
        </span>
        <span>{artifact.code.length.toLocaleString()} characters</span>
      </div>
    </div>
  );
};

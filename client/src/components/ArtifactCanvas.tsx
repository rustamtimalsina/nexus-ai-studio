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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLogs([]);
    setIframeKey((k) => k + 1);
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
    navigator.clipboard.writeText(artifact.code);
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
    const blob = new Blob([artifact.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-artifact.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setLogs([]);
    setIframeKey((k) => k + 1);
  };

  // Generate safe sandboxed HTML payload with console listener
  const generatePreviewHtml = () => {
    let rawCode = artifact.code;

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

        {/* Tab 2: Syntax Highlighted Code */}
        {activeTab === 'code' && (
          <div className="w-full h-full overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
            <pre className="text-cyan-300 select-text whitespace-pre-wrap break-all">
              {artifact.code}
            </pre>
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

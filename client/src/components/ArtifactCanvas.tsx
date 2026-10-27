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
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  Wand2,
  Undo2,
  Redo2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../services/api';
import { soundService } from '../services/soundService';

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
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showAiBar, setShowAiBar] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLogs([]);
    setIframeKey((k) => k + 1);
    if (artifact) {
      setEditableCode(artifact.code);
      setHistory([artifact.code]);
      setHistoryIndex(0);
    }
  }, [artifact]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'nexus_console') {
        setLogs((prev) => [...prev, `[${e.data.logType.toUpperCase()}] ${e.data.message}`]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!artifact) return null;

  const handleAiRefine = async (customInstruction?: string) => {
    const instruction = customInstruction || aiPrompt;
    if (!instruction.trim() || isRefining) return;

    soundService.playSend();
    setIsRefining(true);
    setLogs((prev) => [...prev, `[AI REFINER] Applying modification: "${instruction}"...`]);

    try {
      const updatedCode = await api.modifyArtifact(
        editableCode || artifact.code,
        instruction,
        artifact.language || 'html'
      );

      const newHistory = [...history.slice(0, historyIndex + 1), updatedCode];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      setEditableCode(updatedCode);
      setIframeKey((k) => k + 1);
      setAiPrompt('');
      soundService.playComplete();
      setLogs((prev) => [...prev, `[AI REFINER] ✓ Successfully applied "${instruction}"`]);
    } catch (err: any) {
      setLogs((prev) => [...prev, `[AI REFINER ERROR] Failed to modify: ${err?.message || err}`]);
    } finally {
      setIsRefining(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      soundService.playClick();
      const prevCode = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setEditableCode(prevCode);
      setIframeKey((k) => k + 1);
      setLogs((prev) => [...prev, `[AI REFINER] Reverted to previous step (${historyIndex} remaining)`]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      soundService.playClick();
      const nextCode = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setEditableCode(nextCode);
      setIframeKey((k) => k + 1);
      setLogs((prev) => [...prev, `[AI REFINER] Redid step (${historyIndex + 2} of ${history.length})`]);
    }
  };

  const currentCode = editableCode || artifact.code || '';
  const langLower = (artifact.language || 'html').toLowerCase();

  const isHtml =
    langLower === 'html' ||
    currentCode.includes('<!DOCTYPE html>') ||
    currentCode.includes('<html') ||
    currentCode.includes('<div') ||
    currentCode.includes('<svg') ||
    langLower === 'svg';

  const isJs =
    langLower === 'javascript' ||
    langLower === 'js' ||
    langLower === 'typescript' ||
    langLower === 'ts';

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
    const isSvg = langLower === 'svg' || currentCode.trim().startsWith('<svg');
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
    let rawCode = editableCode || artifact.code || '';

    // If bare SVG, wrap it nicely in centered dark backdrop
    if (langLower === 'svg' || (rawCode.trim().startsWith('<svg') && rawCode.trim().endsWith('</svg>'))) {
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

    // Detect and auto-inject essential libraries if missing
    let autoInjectedHead = '';

    // Auto-inject Tailwind CSS if Tailwind classes are used and script is absent
    if (!rawCode.includes('tailwindcss.com') && (rawCode.includes('class="') || rawCode.includes("class='"))) {
      autoInjectedHead += '<script src="https://cdn.tailwindcss.com"></script>\n';
    }

    // Auto-inject Three.js and OrbitControls if referenced and not loaded
    const mentionsThree = rawCode.includes('THREE.') || rawCode.toLowerCase().includes('three.js');
    const hasThreeScript = rawCode.includes('three.min.js') || rawCode.includes('three.module.js') || rawCode.includes('three.js');
    if (mentionsThree && !hasThreeScript) {
      autoInjectedHead += `
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
      `;
    }

    // Robust console and error interceptor with on-screen error banner
    const consoleInterceptor = `
      <script>
        (function() {
          // Safe localStorage mock in sandboxed iframe
          try {
            var _test = window.localStorage;
          } catch(e) {
            var _store = {};
            try {
              Object.defineProperty(window, 'localStorage', {
                value: {
                  getItem: function(k) { return _store[k] || null; },
                  setItem: function(k, v) { _store[k] = String(v); },
                  removeItem: function(k) { delete _store[k]; },
                  clear: function() { _store = {}; }
                }
              });
            } catch(e2) {}
          }

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

          window.onerror = function(msg, url, line, col, err) {
            var fullErr = 'Error: ' + msg + (line ? ' (line ' + line + ')' : '');
            sendLog('error', [fullErr]);
            var banner = document.getElementById('nexus-error-banner');
            if (!banner && document.body) {
              banner = document.createElement('div');
              banner.id = 'nexus-error-banner';
              banner.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;background:rgba(153,27,27,0.95);color:#fecaca;padding:10px 14px;border-radius:8px;font-family:monospace;font-size:11px;z-index:999999;border:1px solid #ef4444;box-shadow:0 8px 24px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:space-between;';
              banner.innerHTML = '<span>⚠️ ' + fullErr + '</span><button onclick="this.parentElement.remove()" style="background:#ef4444;color:white;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;">✕</button>';
              document.body.appendChild(banner);
            }
          };

          window.addEventListener('unhandledrejection', function(e) {
            var reason = e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Promise Rejection';
            if (window.onerror) window.onerror(reason, '', 0);
          });
        })();
      </script>
    `;

    // Ensure full HTML shell if snippet is bare HTML tags
    if (!rawCode.includes('<html') && !rawCode.includes('<!DOCTYPE')) {
      rawCode = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; min-height: 100vh; background: #070c14; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }
          </style>
          ${autoInjectedHead}
        </head>
        <body>
          ${rawCode}
        </body>
        </html>
      `;
    }

    if (rawCode.includes('<head>')) {
      return rawCode.replace('<head>', `<head>${consoleInterceptor}\n${autoInjectedHead}`);
    } else {
      return `${consoleInterceptor}\n${autoInjectedHead}${rawCode}`;
    }
  };

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
        {/* Tab 1: Live Interactive Preview with Multi-Device Frame & In-Canvas AI Refiner */}
        {activeTab === 'preview' && (
          <div className="w-full h-full flex flex-col relative overflow-hidden">
            {/* Viewport Subheader: Device Switcher & AI Iteration Toggle */}
            <div className="h-9 px-3 bg-slate-900/95 border-b border-cyan-500/15 flex items-center justify-between text-xs shrink-0 select-none">
              {/* Responsive Device Switcher */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => {
                    soundService.playClick();
                    setDevice('desktop');
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    device === 'desktop'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop Viewport (100% Full Width)"
                >
                  <Monitor className="w-3 h-3" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>

                <button
                  onClick={() => {
                    soundService.playClick();
                    setDevice('tablet');
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    device === 'tablet'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet Viewport (iPad 768px)"
                >
                  <Tablet className="w-3 h-3" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>

                <button
                  onClick={() => {
                    soundService.playClick();
                    setDevice('mobile');
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    device === 'mobile'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile Viewport (iPhone 375px)"
                >
                  <Smartphone className="w-3 h-3" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>

              {/* Viewport Actions & AI Bar Toggle */}
              <div className="flex items-center gap-2">
                {device !== 'desktop' && (
                  <button
                    onClick={() => {
                      soundService.playClick();
                      setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'));
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition-colors"
                    title={`Rotate device to ${orientation === 'portrait' ? 'Landscape' : 'Portrait'}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="capitalize">{orientation}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    soundService.playClick();
                    setShowAiBar((prev) => !prev);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    showAiBar
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                  title="Toggle In-Canvas AI Prompt Bar"
                >
                  <Wand2 className="w-3 h-3 text-purple-400" />
                  <span>Iterate with AI</span>
                  {showAiBar ? <ChevronDown className="w-3 h-3 ml-0.5" /> : <ChevronUp className="w-3 h-3 ml-0.5" />}
                </button>
              </div>
            </div>

            {/* Stage Canvas Area */}
            <div
              className={`flex-1 relative overflow-auto ${
                device === 'desktop'
                  ? 'w-full h-full'
                  : 'w-full h-full flex items-center justify-center p-4 sm:p-6 bg-[#030612] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]'
              }`}
            >
              {/* Desktop Mode (Full Canvas) */}
              {device === 'desktop' && (
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  srcDoc={generatePreviewHtml()}
                  title="Artifact Sandbox"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  className="w-full h-full border-none bg-transparent"
                />
              )}

              {/* Tablet Mode Frame (iPad Pro Simulation) */}
              {device === 'tablet' && (
                <div
                  className={`relative rounded-[28px] border-[10px] border-slate-800/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] bg-slate-950 flex flex-col shrink-0 transition-all duration-300 ${
                    orientation === 'portrait'
                      ? 'w-[680px] max-w-[95%] h-[840px] max-h-[92%]'
                      : 'w-[840px] max-w-[95%] h-[580px] max-h-[92%]'
                  }`}
                >
                  <div className="h-5 w-full bg-slate-950 flex items-center justify-center shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
                  </div>
                  <div className="flex-1 overflow-hidden relative bg-[#070c14] rounded-[16px]">
                    <iframe
                      key={iframeKey}
                      ref={iframeRef}
                      srcDoc={generatePreviewHtml()}
                      title="Artifact Sandbox Tablet"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                      className="w-full h-full border-none bg-transparent"
                    />
                  </div>
                  <div className="h-3 w-full bg-slate-950 flex items-center justify-center shrink-0">
                    <span className="w-24 h-1 bg-white/20 rounded-full" />
                  </div>
                </div>
              )}

              {/* Mobile Mode Frame (iPhone 16 Pro Simulation) */}
              {device === 'mobile' && (
                <div
                  className={`relative rounded-[44px] border-[9px] border-slate-800 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] bg-slate-950 flex flex-col shrink-0 transition-all duration-300 ${
                    orientation === 'portrait'
                      ? 'w-[375px] max-w-[94%] h-[720px] max-h-[94%]'
                      : 'w-[720px] max-w-[94%] h-[375px] max-h-[94%]'
                  }`}
                >
                  <div className="h-7 w-full bg-slate-950 flex items-center justify-between px-6 text-[10px] font-mono text-slate-400 select-none shrink-0">
                    <span className="font-semibold text-slate-300">9:41</span>
                    <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-inner border border-slate-800/50">
                      <span className="w-2 h-2 rounded-full bg-cyan-500/50" />
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                      <span>5G</span>
                      <span className="w-3.5 h-2 border border-slate-400 rounded-xs relative flex items-center p-0.5">
                        <span className="h-full w-2 bg-emerald-400 rounded-2xs" />
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden relative bg-[#070c14] rounded-[30px]">
                    <iframe
                      key={iframeKey}
                      ref={iframeRef}
                      srcDoc={generatePreviewHtml()}
                      title="Artifact Sandbox Mobile"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                      className="w-full h-full border-none bg-transparent"
                    />
                  </div>

                  <div className="h-4 w-full bg-slate-950 flex items-center justify-center shrink-0">
                    <div className="w-28 h-1 bg-white/25 rounded-full" />
                  </div>
                </div>
              )}

              {/* AI Processing Overlay */}
              {isRefining && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-30">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-500/50 shadow-2xl text-purple-300 font-mono text-xs animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span>⚡ AI is refining prototype & hot-reloading...</span>
                  </div>
                </div>
              )}
            </div>

            {/* In-Canvas AI Prompt Bar ("Iterate with AI") */}
            {showAiBar && (
              <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-auto">
                <div className="bg-slate-950/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] transition-all">
                  {/* Quick AI Refinement Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[11px]">
                    <span className="text-[10px] uppercase font-mono text-purple-400 font-bold shrink-0 flex items-center gap-1 px-1">
                      <Sparkles className="w-3 h-3" /> Quick Tweak:
                    </span>
                    {[
                      { label: '🔮 Cyber Glow', prompt: 'Add cyber neon glow and futuristic cyan shadows to buttons' },
                      { label: '🌙 Glassmorphism', prompt: 'Convert cards and container background to glassmorphism with blur' },
                      { label: '✨ Float Hover', prompt: 'Add smooth floating hover bounce animations to interactive elements' },
                      { label: '🔊 Audio FX', prompt: 'Add sound feedback when clicking buttons or interactive elements' },
                      { label: '🟩 Matrix Theme', prompt: 'Transform theme into green terminal Matrix hacker aesthetic' },
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAiRefine(chip.prompt)}
                        disabled={isRefining}
                        className="px-2.5 py-1 rounded-full bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white border border-purple-500/30 shrink-0 transition-all font-medium disabled:opacity-50"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Input Form with Undo/Redo & Submit */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAiRefine();
                    }}
                    className="flex items-center gap-2 pt-1 border-t border-slate-800/80"
                  >
                    {/* Undo / Redo */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={historyIndex <= 0 || isRefining}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Undo AI edit"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1 || isRefining}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Redo AI edit"
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* AI Prompt Input */}
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ask AI to modify this component... (e.g. 'Make it cyber purple', 'Add pulse animation')"
                      disabled={isRefining}
                      className="flex-1 bg-slate-900/80 border border-slate-800 focus:border-purple-500/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                    />

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!aiPrompt.trim() || isRefining}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-purple-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {isRefining ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">Refine</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
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
        <span>{(artifact?.code || '').length.toLocaleString()} characters</span>
      </div>
    </div>
  );
};

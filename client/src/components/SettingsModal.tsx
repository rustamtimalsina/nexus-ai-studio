import React, { useState, useEffect } from 'react';
import { X, Settings, Key, ShieldCheck, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [provider, setProvider] = useState<AppSettings['provider']>(settings.provider || 'mock');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState<number>(settings.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState<number>(settings.maxTokens ?? 2048);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProvider(settings.provider || 'mock');
      setApiKey('');
      setTemperature(settings.temperature ?? 0.7);
      setMaxTokens(settings.maxTokens ?? 2048);
      setIsSaved(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload: Partial<AppSettings> = {
      provider,
      temperature,
      maxTokens,
    };
    if (apiKey.trim()) {
      payload.apiKey = apiKey.trim();
    }

    await onSaveSettings(payload);
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Settings & Model Config</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* AI Provider */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">AI Engine Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('mock')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  provider === 'mock'
                    ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Built-in Simulator</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Fast, offline, zero keys required</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  provider === 'gemini'
                    ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Google Gemini</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Live 1.5 Pro / Flash models</div>
              </button>
            </div>
          </div>

          {/* API Key */}
          {provider === 'gemini' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gemini API Key</span>
                </label>
                {settings.hasApiKey && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Key is Saved & Active
                  </span>
                )}
              </div>

              {settings.hasApiKey && (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-slate-300">Saved Key:</span>
                    <span className="font-mono text-emerald-300 font-semibold">{settings.apiKey}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Ready</span>
                </div>
              )}

              <div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    settings.hasApiKey
                      ? 'Type a new key here only to replace the saved one'
                      : 'Paste your Gemini API key (starts with AIzaSy... or AQ...)'
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <p className="text-[10px] text-slate-500">
                {settings.hasApiKey
                  ? 'Your key is securely saved on the local backend server. You do not need to re-paste it.'
                  : 'Keys start with AIzaSy... or AQ... and are stored locally on your machine.'}
              </p>
            </div>
          )}

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Temperature</label>
              <span className="text-xs font-mono text-emerald-400">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Precise / Factual (0.0)</span>
              <span>Creative / Diverse (1.0)</span>
            </div>
          </div>

          {/* Max Output Tokens */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Output Tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 1024)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

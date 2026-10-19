import React, { useState, useEffect } from 'react';
import { Mic, MicOff, ShieldCheck, Volume2, Loader2, Radio } from 'lucide-react';
import { VoiceState } from '../types';
import { audioService } from '../services/audioService';

interface VoiceStatusHUDProps {
  voiceState: VoiceState;
  onStopListening?: () => void;
  className?: string;
  compact?: boolean;
}

const LiveFrequencyVisualizer: React.FC<{ colorClass: string; active: boolean }> = ({
  colorClass,
  active,
}) => {
  const [bars, setBars] = useState<number[]>(() => Array(10).fill(0.15));

  useEffect(() => {
    if (!active) return;
    let animId: number;
    const loop = () => {
      const data = audioService.getFrequencyData().slice(0, 10);
      setBars(data);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [active]);

  return (
    <div className="flex items-end gap-0.5 h-3.5 px-0.5">
      {bars.map((v, i) => (
        <span
          key={i}
          className={`w-0.5 rounded-full transition-all duration-75 ${colorClass}`}
          style={{ height: `${Math.max(2.5, Math.min(14, v * 16))}px` }}
        />
      ))}
    </div>
  );
};

export const VoiceStatusHUD: React.FC<VoiceStatusHUDProps> = ({
  voiceState,
  onStopListening,
  className = '',
  compact = false,
}) => {
  if (voiceState === 'listening') {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/70 text-rose-200 shadow-xl shadow-rose-950/60 backdrop-blur-md transition-all animate-in fade-in duration-200 ${className}`}
        title="Microphone is actively recording your voice"
      >
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="absolute w-4 h-4 rounded-full bg-rose-500/50 animate-ping" />
        </div>

        <Mic className="w-3.5 h-3.5 text-rose-400 shrink-0" />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold tracking-wider text-rose-100 uppercase">
              Listening
            </span>
            {/* Live Web Audio Equalizer Bars */}
            <LiveFrequencyVisualizer colorClass="bg-rose-400" active={true} />
          </div>
          {!compact && (
            <span className="text-[9px] text-rose-300/80 font-sans hidden sm:inline">
              Audio stream live • Speak clearly
            </span>
          )}
        </div>

        {onStopListening && (
          <button
            type="button"
            onClick={onStopListening}
            className="ml-1 px-2 py-0.5 rounded-md bg-rose-600/80 hover:bg-rose-500 text-white font-mono text-[10px] font-medium transition-all shadow-sm active:scale-95"
            title="Finish voice input and process"
          >
            Done
          </button>
        )}
      </div>
    );
  }

  if (voiceState === 'transcribing') {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-200 shadow-xl shadow-amber-950/50 backdrop-blur-md transition-all animate-in fade-in duration-200 ${className}`}
        title="Transcribing audio and reasoning neural response"
      >
        <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-[11px] font-bold tracking-wider text-amber-100 uppercase">
            Transcribing & Reasoning
          </span>
          {!compact && (
            <span className="text-[9px] text-amber-300/80 font-sans hidden sm:inline">
              Processing speech tokens • Mic stream closed
            </span>
          )}
        </div>
      </div>
    );
  }

  if (voiceState === 'speaking') {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 shadow-xl shadow-emerald-950/50 backdrop-blur-md transition-all animate-in fade-in duration-200 ${className}`}
        title="AI is currently speaking out loud"
      >
        <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold tracking-wider text-emerald-100 uppercase">
              AI Speaking
            </span>
            {/* Audio Wave Sound Bars */}
            <LiveFrequencyVisualizer colorClass="bg-emerald-400" active={true} />
          </div>
          {!compact && (
            <span className="text-[9px] text-emerald-300/80 font-sans hidden sm:inline">
              Voice synthesizer active
            </span>
          )}
        </div>
      </div>
    );
  }

  // Persistent 'idle' / Mic-Off indicator (Answers Daniel Lachev's trust & privacy concern!)
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-400 shadow-md backdrop-blur-md transition-all ${className}`}
      title="Microphone is completely inactive and hardware tracks are stopped"
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        <MicOff className="w-3 h-3 text-slate-400" />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] font-semibold text-slate-300 tracking-wider uppercase">
          Mic Off
        </span>
        <span className="text-slate-600 font-mono text-[10px]">•</span>
        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400/90">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Hardware Safe</span>
        </span>
      </div>
    </div>
  );
};

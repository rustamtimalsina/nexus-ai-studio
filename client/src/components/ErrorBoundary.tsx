import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('nexus_active_chat_id');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#070c14] text-white p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900/90 border border-red-500/30 shadow-2xl backdrop-blur-xl text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold mb-2">Nexus Studio Encountered an Issue</h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-mono">
              {this.state.error?.message || 'A render error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-medium text-xs transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload & Recover Studio</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

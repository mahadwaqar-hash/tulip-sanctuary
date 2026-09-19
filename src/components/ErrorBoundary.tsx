import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Heart, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AIM Sanctuary ErrorBoundary Caught]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-bg-start via-bg-end to-bg-start select-none">
          <div className="w-full max-w-md p-8 rounded-[2.5rem] glass-panel border border-pastel-pink-300/40 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-pastel-pink-100 dark:bg-pastel-pink-400/20 text-pastel-pink-400 flex items-center justify-center mb-4 shadow-sm">
              <Heart className="w-8 h-8 fill-pastel-pink-400" />
            </div>

            <h2 className="text-2xl font-bold font-serif-italic text-text-main mb-1">
              Sanctuary Moment
            </h2>
            <p className="text-xs text-text-muted mb-4 font-medium">
              Something briefly flickered in our haven. Let's step back inside.
            </p>

            {this.state.error && (
              <div className="w-full p-3 rounded-2xl bg-surface-hover/80 border border-border text-left mb-6 overflow-hidden">
                <div className="flex items-center gap-1.5 text-pastel-pink-400 text-xs font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Notice</span>
                </div>
                <p className="text-[11px] text-text-muted font-mono break-all line-clamp-3">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-pastel-pink-400 to-pastel-pink-300 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-enter Sanctuary</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="py-3 px-4 rounded-full border border-border text-text-muted hover:text-text-main font-bold text-xs uppercase tracking-wider hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

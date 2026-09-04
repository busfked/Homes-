import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl shadow-xl max-w-lg mx-auto text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
              {this.props.fallbackTitle || 'እባክዎ ይቅርታ! ጥቃቅን የይዘት ስህተት ተፈጥሯል'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {this.props.fallbackMessage || 'Something went wrong displaying this section. Please reload or click reset.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>ዳግም ይሞክሩ (Try Again)</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>ሪፍሬሽ (Reload)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

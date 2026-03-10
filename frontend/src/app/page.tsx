'use client';

import { Chart } from '@/components/Chart';
import { SymbolSelector } from '@/components/SymbolSelector';
import { TimeframeSelector } from '@/components/TimeframeSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useChartStore } from '@/stores/chartStore';

// Error boundary component
import { Component, ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900 text-white">
          <h1 className="text-xl font-bold">Error Loading Chart</h1>
          <pre className="mt-2 text-sm">{this.state.error?.message}</pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-700 rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const log = (...args: unknown[]) => console.log('[Page]', ...args);

export default function Home() {
  log('Home page rendering');
  const { symbol, timeframe } = useChartStore();
  log('Store values - symbol:', symbol, 'timeframe:', timeframe);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Trading Chart</h1>
          <SymbolSelector />
          <TimeframeSelector />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {symbol} • {timeframe}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Chart Area */}
      <main className="h-[calc(100vh-3.5rem)]">
        <ErrorBoundary>
          <Chart />
        </ErrorBoundary>
      </main>
    </div>
  );
}

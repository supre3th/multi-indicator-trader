'use client';

import { Chart } from '@/components/Chart';
import { SymbolSelector } from '@/components/SymbolSelector';
import { TimeframeSelector } from '@/components/TimeframeSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useChartStore } from '@/stores/chartStore';

export default function Home() {
  const { symbol, timeframe } = useChartStore();

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
        <Chart />
      </main>
    </div>
  );
}

'use client';

import { useChartStore, TIMEFRAMES } from '@/stores/chartStore';

export function TimeframeSelector() {
  const { timeframe, setTimeframe } = useChartStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf.value}
          onClick={() => setTimeframe(tf.value)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            timeframe === tf.value
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}

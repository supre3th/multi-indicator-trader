'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChartStore, POPULAR_SYMBOLS } from '@/stores/chartStore';
import { fetchSymbols } from '@/lib/api';
import { Search, ChevronDown } from 'lucide-react';

export function SymbolSelector() {
  const { symbol, setSymbol } = useChartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all symbols on mount
  useEffect(() => {
    async function loadSymbols() {
      try {
        setIsLoading(true);
        const symbols = await fetchSymbols();
        setAllSymbols(symbols);
      } catch (error) {
        console.error('Failed to fetch symbols:', error);
        // Fallback to popular symbols only
        setAllSymbols(POPULAR_SYMBOLS);
      } finally {
        setIsLoading(false);
      }
    }
    loadSymbols();
  }, []);

  // Combine popular + searched symbols
  const filteredSymbols = search
    ? allSymbols.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    : allSymbols.slice(0, 50); // Show first 50 when no search

  const handleSelect = useCallback((newSymbol: string) => {
    setSymbol(newSymbol);
    setIsOpen(false);
    setSearch('');
  }, [setSymbol]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
      >
        <span>{symbol}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-50">
          {/* Search input */}
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border-0 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400"
                autoFocus
              />
            </div>
          </div>

          {/* Symbol list */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-sm text-zinc-500">Loading symbols...</div>
            ) : filteredSymbols.length === 0 ? (
              <div className="p-3 text-sm text-zinc-500">No symbols found</div>
            ) : (
              filteredSymbols.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                    s === symbol ? 'bg-zinc-200 dark:bg-zinc-700 font-medium' : ''
                  }`}
                >
                  {s}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

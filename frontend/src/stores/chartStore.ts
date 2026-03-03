'use client';

import { create } from 'zustand';

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartState {
  symbol: string;
  timeframe: TimeFrame;
  theme: 'light' | 'dark';
  candles: CandleData[];
  isLoading: boolean;
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: TimeFrame) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCandles: (candles: CandleData[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useChartStore = create<ChartState>((set) => ({
  symbol: 'BTC/USDT',
  timeframe: '1h',
  theme: 'dark',
  candles: [],
  isLoading: false,
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setTheme: (theme) => set({ theme }),
  setCandles: (candles) => set({ candles }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export const TIMEFRAMES: { value: TimeFrame; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
];

export const POPULAR_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'SOL/USDT',
  'XRP/USDT',
  'ADA/USDT',
  'DOGE/USDT',
  'AVAX/USDT',
  'DOT/USDT',
  'MATIC/USDT',
];

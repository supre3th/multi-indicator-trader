'use client';

import { create } from 'zustand';

export interface IndicatorData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  mfi?: number;
  cci?: number;
  adx?: number;
  di_plus?: number;
  di_minus?: number;
  channel_upper?: number;
  channel_middle?: number;
  channel_lower?: number;
}

interface IndicatorState {
  // Settings
  mfiPeriod: number;
  cciPeriod: number;
  adxPeriod: number;
  channelPeriod: number;
  channelType: 'pivot' | 'donchian' | 'linear_regression';
  showCCI: boolean;
  showMFI: boolean;
  showADX: boolean;
  showDI: boolean;
  showChannel: boolean;
  higherTf?: string;
  
  // Data
  data: IndicatorData[];
  isLoading: boolean;
  
  // Actions
  setMfiPeriod: (period: number) => void;
  setCciPeriod: (period: number) => void;
  setAdxPeriod: (period: number) => void;
  setChannelPeriod: (period: number) => void;
  setChannelType: (type: 'pivot' | 'donchian' | 'linear_regression') => void;
  setShowCCI: (show: boolean) => void;
  setShowMFI: (show: boolean) => void;
  setShowADX: (show: boolean) => void;
  setShowDI: (show: boolean) => void;
  setShowChannel: (show: boolean) => void;
  setHigherTf: (tf: string | undefined) => void;
  setData: (data: IndicatorData[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useIndicatorStore = create<IndicatorState>((set) => ({
  // Default settings (LOCKED from CONTEXT.md)
  mfiPeriod: 14,
  cciPeriod: 20,
  adxPeriod: 14,
  channelPeriod: 20,
  channelType: 'pivot',
  showCCI: true,
  showMFI: true,
  showADX: true,
  showDI: true,
  showChannel: false,  // Default off until Phase 02-03
  
  // Data
  data: [],
  isLoading: false,
  
  // Actions
  setMfiPeriod: (period) => set({ mfiPeriod: period }),
  setCciPeriod: (period) => set({ cciPeriod: period }),
  setAdxPeriod: (period) => set({ adxPeriod: period }),
  setChannelPeriod: (period) => set({ channelPeriod: period }),
  setChannelType: (type) => set({ channelType: type }),
  setShowCCI: (show) => set({ showCCI: show }),
  setShowMFI: (show) => set({ showMFI: show }),
  setShowADX: (show) => set({ showADX: show }),
  setShowDI: (show) => set({ showDI: show }),
  setShowChannel: (show) => set({ showChannel: show }),
  setHigherTf: (tf) => set({ higherTf: tf }),
  setData: (data) => set({ data }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

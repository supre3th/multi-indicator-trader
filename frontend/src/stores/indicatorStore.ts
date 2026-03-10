'use client';

import { create } from 'zustand';

export interface IndicatorData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // CCI + MFI (PineScript)
  cci?: number;
  mfi?: number;
  cci_ma?: number;      // CCI smoothing MA
  bb_upper?: number;    // Bollinger upper
  bb_lower?: number;    // Bollinger lower
  // Threshold lines
  cci_band_upper?: number;  // +100
  cci_band_lower?: number;  // -100
  mfi_upper?: number;       // +60
  mfi_lower?: number;       // -60
  // Crossover signals
  mfi_cross_above?: boolean;
  mfi_cross_below?: boolean;
  // ADX/DI
  adx?: number;
  di_plus?: number;
  di_minus?: number;
  // Price Channel
  channel_upper?: number;
  channel_middle?: number;
  channel_lower?: number;
}

type MAType = 'None' | 'SMA' | 'EMA' | 'WMA' | 'SMMA';

interface IndicatorState {
  // CCI + MFI Settings
  cciPeriod: number;
  mfiPeriod: number;
  maType: MAType;
  maLength: number;
  bbMult: number;
  
  // ADX Settings
  adxPeriod: number;
  
  // Channel Settings
  channelPeriod: number;
  channelType: 'pivot' | 'donchian' | 'linear_regression';
  
  // Visibility
  showCCI: boolean;
  showMFI: boolean;
  showCCIMA: boolean;
  showBollinger: boolean;
  showADX: boolean;
  showDI: boolean;
  showChannel: boolean;
  higherTf?: string;
  
  // Data
  data: IndicatorData[];
  isLoading: boolean;
  
  // Actions
  setCciPeriod: (period: number) => void;
  setMfiPeriod: (period: number) => void;
  setMaType: (type: MAType) => void;
  setMaLength: (length: number) => void;
  setBbMult: (mult: number) => void;
  setAdxPeriod: (period: number) => void;
  setChannelPeriod: (period: number) => void;
  setChannelType: (type: 'pivot' | 'donchian' | 'linear_regression') => void;
  setShowCCI: (show: boolean) => void;
  setShowMFI: (show: boolean) => void;
  setShowCCIMA: (show: boolean) => void;
  setShowBollinger: (show: boolean) => void;
  setShowADX: (show: boolean) => void;
  setShowDI: (show: boolean) => void;
  setShowChannel: (show: boolean) => void;
  setHigherTf: (tf: string | undefined) => void;
  setData: (data: IndicatorData[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useIndicatorStore = create<IndicatorState>((set) => ({
  // CCI + MFI defaults (PineScript values)
  cciPeriod: 20,
  mfiPeriod: 14,
  maType: 'SMA',
  maLength: 14,
  bbMult: 2.0,
  
  // ADX defaults
  adxPeriod: 14,
  
  // Channel defaults
  channelPeriod: 20,
  channelType: 'pivot',
  
  // Visibility defaults
  showCCI: true,
  showMFI: true,
  showCCIMA: false,
  showBollinger: false,
  showADX: true,
  showDI: true,
  showChannel: false,
  
  // Data
  data: [],
  isLoading: false,
  
  // Actions
  setCciPeriod: (period) => set({ cciPeriod: period }),
  setMfiPeriod: (period) => set({ mfiPeriod: period }),
  setMaType: (type) => set({ maType: type }),
  setMaLength: (length) => set({ maLength: length }),
  setBbMult: (mult) => set({ bbMult: mult }),
  setAdxPeriod: (period) => set({ adxPeriod: period }),
  setChannelPeriod: (period) => set({ channelPeriod: period }),
  setChannelType: (type) => set({ channelType: type }),
  setShowCCI: (show) => set({ showCCI: show }),
  setShowMFI: (show) => set({ showMFI: show }),
  setShowCCIMA: (show) => set({ showCCIMA: show }),
  setShowBollinger: (show) => set({ showBollinger: show }),
  setShowADX: (show) => set({ showADX: show }),
  setShowDI: (show) => set({ showDI: show }),
  setShowChannel: (show) => set({ showChannel: show }),
  setHigherTf: (tf) => set({ higherTf: tf }),
  setData: (data) => set({ data }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

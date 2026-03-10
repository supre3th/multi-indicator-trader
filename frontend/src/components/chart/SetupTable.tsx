'use client';

import { IndicatorData } from '@/stores/indicatorStore';

interface SetupTableProps {
  data: IndicatorData | null;
}

type SetupType = 
  | 'Strong Uptrend'
  | 'Strong Downtrend'
  | 'Trend Long'
  | 'Trend Short'
  | 'Oversold Long'
  | 'Overbought Short'
  | 'Rangebound'
  | 'Neutral';

const ADX_THRESHOLD = 20;
const MFI_OVERBOUGHT = 80;
const MFI_OVERSOLD = 20;
const CCI_OVERBOUGHT = 100;
const CCI_OVERSOLD = -100;

export function detectSetup(adx: number, diPlus: number, diMinus: number, cci: number, mfi: number): SetupType {
  if (adx > ADX_THRESHOLD) {
    if (diPlus > diMinus && cci > 0) {
      return adx > 30 ? 'Strong Uptrend' : 'Trend Long';
    }
    if (diMinus > diPlus && cci < 0) {
      return adx > 30 ? 'Strong Downtrend' : 'Trend Short';
    }
  }
  if (mfi < MFI_OVERSOLD && cci < CCI_OVERSOLD) return 'Oversold Long';
  if (mfi > MFI_OVERBOUGHT && cci > CCI_OVERBOUGHT) return 'Overbought Short';
  if (adx < ADX_THRESHOLD) return 'Rangebound';
  return 'Neutral';
}

function getSetupColor(setup: SetupType): string {
  switch (setup) {
    case 'Strong Uptrend': return '#22c55e';
    case 'Strong Downtrend': return '#ef4444';
    case 'Trend Long': return '#4ade80';
    case 'Trend Short': return '#fb923c';
    case 'Oversold Long': return '#22d3ee';
    case 'Overbought Short': return '#e879f9';
    default: return '#9ca3af';
  }
}

export function SetupTable({ data }: SetupTableProps) {
  if (!data || data.adx == null) return null;

  const setup = detectSetup(data.adx, data.di_plus || 0, data.di_minus || 0, data.cci || 0, data.mfi || 50);
  const setupColor = getSetupColor(setup);

  return (
    <div className="absolute top-2 right-2 z-40 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-lg p-3 text-sm">
      <div className="font-bold mb-2" style={{ color: setupColor }}>
        {setup}
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-400">ADX:</span>
        <span style={{ color: data.adx > ADX_THRESHOLD ? '#22c55e' : '#9ca3af' }}>
          {data.adx?.toFixed(1)}
        </span>
        
        <span className="text-gray-400">DI+:</span>
        <span className="text-green-500">{data.di_plus?.toFixed(1)}</span>
        
        <span className="text-gray-400">DI-:</span>
        <span className="text-red-500">{data.di_minus?.toFixed(1)}</span>
        
        <span className="text-gray-400">CCI:</span>
        <span style={{ 
          color: data.cci > CCI_OVERBOUGHT ? '#ef4444' : data.cci < CCI_OVERSOLD ? '#22c55e' : '#2962FF' 
        }}>
          {data.cci?.toFixed(1)}
        </span>
        
        <span className="text-gray-400">MFI:</span>
        <span style={{ 
          color: data.mfi > MFI_OVERBOUGHT ? '#ef4444' : data.mfi < MFI_OVERSOLD ? '#22c55e' : '#FDE832' 
        }}>
          {data.mfi?.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

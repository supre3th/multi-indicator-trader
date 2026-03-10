'use client';

import { useState } from 'react';
import { useIndicatorStore } from '@/stores/indicatorStore';

interface IndicatorSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMEFRAME_OPTIONS = [
  { value: '', label: 'None' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
];

const CHANNEL_TYPES = [
  { value: 'pivot', label: 'Pivot (Dynamic)' },
  { value: 'donchian', label: 'Donchian' },
  { value: 'linear_regression', label: 'Linear Regression' },
];

export function IndicatorSettings({ isOpen, onClose }: IndicatorSettingsProps) {
  const store = useIndicatorStore();
  
  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-16 z-50 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Indicator Settings</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      {/* MFI Settings */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="flex justify-between items-center">
          <label className="text-yellow-400 font-medium">MFI</label>
          <input
            type="checkbox"
            checked={store.showMFI}
            onChange={(e) => store.setShowMFI(e.target.checked)}
            className="w-4 h-4"
          />
        </div>
        <input
          type="number"
          value={store.mfiPeriod}
          onChange={(e) => store.setMfiPeriod(parseInt(e.target.value) || 14)}
          className="mt-2 w-full bg-gray-700 text-white px-2 py-1 rounded"
          min={1}
          max={100}
        />
      </div>

      {/* CCI Settings */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="flex justify-between items-center">
          <label className="text-blue-400 font-medium">CCI</label>
          <input
            type="checkbox"
            checked={store.showCCI}
            onChange={(e) => store.setShowCCI(e.target.checked)}
            className="w-4 h-4"
          />
        </div>
        <input
          type="number"
          value={store.cciPeriod}
          onChange={(e) => store.setCciPeriod(parseInt(e.target.value) || 20)}
          className="mt-2 w-full bg-gray-700 text-white px-2 py-1 rounded"
          min={1}
          max={100}
        />
      </div>

      {/* ADX Settings */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="flex justify-between items-center">
          <label className="text-navy-400 font-medium" style={{ color: '#000080' }}>ADX</label>
          <input
            type="checkbox"
            checked={store.showADX}
            onChange={(e) => store.setShowADX(e.target.checked)}
            className="w-4 h-4"
          />
        </div>
        <input
          type="number"
          value={store.adxPeriod}
          onChange={(e) => store.setAdxPeriod(parseInt(e.target.value) || 14)}
          className="mt-2 w-full bg-gray-700 text-white px-2 py-1 rounded"
          min={1}
          max={100}
        />
      </div>

      {/* DI+ / DI- always show with ADX */}

      {/* Price Channel Settings */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <div className="flex justify-between items-center">
          <label className="text-white font-medium">Price Channel</label>
          <input
            type="checkbox"
            checked={store.showChannel}
            onChange={(e) => store.setShowChannel(e.target.checked)}
            className="w-4 h-4"
          />
        </div>
        
        <select
          value={store.channelType}
          onChange={(e) => store.setChannelType(e.target.value as any)}
          className="mt-2 w-full bg-gray-700 text-white px-2 py-1 rounded"
        >
          {CHANNEL_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <input
          type="number"
          value={store.channelPeriod}
          onChange={(e) => store.setChannelPeriod(parseInt(e.target.value) || 20)}
          className="mt-2 w-full bg-gray-700 text-white px-2 py-1 rounded"
          placeholder="Period"
          min={1}
          max={200}
        />

        {/* MTF Selector */}
        <select
          value={store.higherTf || ''}
          onChange={(e) => store.setHigherTf(e.target.value || undefined)}
          className="mt-2 w-full bg-gray-700 text-white px-2 py-1 rounded"
        >
          {TIMEFRAME_OPTIONS.map(t => (
            <option key={t.value} value={t.value}>{t.label || 'No MTF'}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

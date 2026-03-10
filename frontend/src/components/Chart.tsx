'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, ColorType, CrosshairMode, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { useChartStore } from '@/stores/chartStore';
import { useIndicatorStore, IndicatorData } from '@/stores/indicatorStore';
import { fetchKlines, fetchIndicators } from '@/lib/api';
import { PriceChannel } from './chart/PriceChannel';
import { SetupTable, detectSetup } from './chart/SetupTable';
import { IndicatorSettings } from './ui/IndicatorSettings';

export function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Indicator series refs
  const [cciSeries, setCciSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [mfiSeries, setMfiSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [adxSeries, setAdxSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [diPlusSeries, setDiPlusSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [diMinusSeries, setDiMinusSeries] = useState<ISeriesApi<"Line"> | null>(null);

  const {
    symbol,
    timeframe,
    theme,
    candles,
    isLoading,
    setCandles,
    setIsLoading,
  } = useChartStore();

  const indicatorStore = useIndicatorStore();

  // MTF channel state
  const [higherTfChannel, setHigherTfChannel] = useState<IndicatorData[]>([]);
  const [selectedHigherTf, setSelectedHigherTf] = useState<string>('');

  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);

  // MTF timeframe mapping
  const higherTfOptions: Record<string, string[]> = {
    '1m': ['5m', '15m'],
    '5m': ['15m', '1h'],
    '15m': ['1h', '4h'],
    '1h': ['4h', '1d'],
    '4h': ['1d', '1w'],
    '1d': ['1w', '1M'],
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      grid: {
        vertLines: { color: theme === 'dark' ? '#1f2937' : '#e5e7eb' },
        horzLines: { color: theme === 'dark' ? '#1f2937' : '#e5e7eb' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
      },
      layout: {
        background: { type: ColorType.Solid, color: theme === 'dark' ? '#000' : '#fff' },
        textColor: theme === 'dark' ? '#d1d5db' : '#374151',
        panes: { separatorColor: theme === 'dark' ? '#4b5563' : '#d1d5db' },
      },
    });

    // Main candlestick chart on pane 0
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // CCI+MFI pane (pane 1) - Colors LOCKED from CONTEXT.md
    const cci = chart.addSeries(LineSeries, {
      color: '#2962FF',  // CCI blue - LOCKED
      lineWidth: 2,
      title: 'CCI',
    }, 1);
    const mfi = chart.addSeries(LineSeries, {
      color: '#FDE832',  // MFI yellow - LOCKED
      lineWidth: 1,
      title: 'MFI',
    }, 1);

    // ADX+DI pane (pane 2) - Colors LOCKED from CONTEXT.md
    const adx = chart.addSeries(LineSeries, {
      color: '#000080',  // ADX navy - LOCKED
      lineWidth: 2,
      title: 'ADX',
    }, 2);
    const diPlus = chart.addSeries(LineSeries, {
      color: '#22c55e',  // DI+ green - LOCKED
      lineWidth: 1,
      title: 'DI+',
    }, 2);
    const diMinus = chart.addSeries(LineSeries, {
      color: '#ef4444',  // DI- red - LOCKED
      lineWidth: 1,
      title: 'DI-',
    }, 2);

    // Set pane heights
    chart.panes()[0].setHeight(400);
    chart.panes()[1].setHeight(150);
    chart.panes()[2].setHeight(150);

    // Store refs
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    setCciSeries(cci);
    setMfiSeries(mfi);
    setAdxSeries(adx);
    setDiPlusSeries(diPlus);
    setDiMinusSeries(diMinus);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      setCciSeries(null);
      setMfiSeries(null);
      setAdxSeries(null);
      setDiPlusSeries(null);
      setDiMinusSeries(null);
    };
  }, []); // Only run once on mount

  // Update chart theme
  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: theme === 'dark' ? '#000' : '#fff' },
        textColor: theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? '#1f2937' : '#e5e7eb' },
        horzLines: { color: theme === 'dark' ? '#1f2937' : '#e5e7eb' },
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
      },
    });
  }, [theme]);

  // Fetch data when symbol or timeframe changes
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch candlestick data
      const data = await fetchKlines(symbol, timeframe, 200);
      setCandles(data);

      if (candlestickSeriesRef.current) {
        const chartData: CandlestickData[] = data.map((candle) => ({
          time: (candle.time / 1000) as any, // Convert ms to seconds for lightweight-charts
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
        candlestickSeriesRef.current.setData(chartData);
      }

      // Fetch indicator data
      try {
        const indicatorData = await fetchIndicators(symbol, timeframe, {
          mfiPeriod: indicatorStore.mfiPeriod,
          cciPeriod: indicatorStore.cciPeriod,
          adxPeriod: indicatorStore.adxPeriod,
          channelPeriod: indicatorStore.channelPeriod,
          channelType: indicatorStore.channelType,
          higherTf: indicatorStore.higherTf || undefined,
        });

        // Update CCI+MFI pane (pane 1)
        const cciData = indicatorData.data
          .filter(d => d.cci !== undefined)
          .map(d => ({ time: (d.time / 1000) as any, value: d.cci }));
        const mfiData = indicatorData.data
          .filter(d => d.mfi !== undefined)
          .map(d => ({ time: (d.time / 1000) as any, value: d.mfi }));
        cciSeries?.setData(cciData);
        mfiSeries?.setData(mfiData);

        // Update ADX+DI pane (pane 2)
        const adxData = indicatorData.data
          .filter(d => d.adx !== undefined)
          .map(d => ({ time: (d.time / 1000) as any, value: d.adx }));
        const diPlusData = indicatorData.data
          .filter(d => d.di_plus !== undefined)
          .map(d => ({ time: (d.time / 1000) as any, value: d.di_plus }));
        const diMinusData = indicatorData.data
          .filter(d => d.di_minus !== undefined)
          .map(d => ({ time: (d.time / 1000) as any, value: d.di_minus }));
        adxSeries?.setData(adxData);
        diPlusSeries?.setData(diPlusData);
        diMinusSeries?.setData(diMinusData);

        // Store indicator data
        indicatorStore.setData(indicatorData.data);

        // Fetch MTF channel if showChannel is enabled
        if (indicatorStore.showChannel && indicatorStore.higherTf) {
          const higherOptions = higherTfOptions[timeframe];
          if (higherOptions && higherOptions.includes(indicatorStore.higherTf)) {
            const mtfResponse = await fetchIndicators(symbol, indicatorStore.higherTf, {
              channelPeriod: indicatorStore.channelPeriod,
              channelType: indicatorStore.channelType,
              limit: 100,
            });
            // Transform MTF data to IndicatorData format
            const mtfData: IndicatorData[] = mtfResponse.data.map(d => ({
              time: d.time,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
              volume: d.volume,
              channel_upper: d.channel_upper,
              channel_middle: d.channel_middle,
              channel_lower: d.channel_lower,
            }));
            setHigherTfChannel(mtfData);
            setSelectedHigherTf(indicatorStore.higherTf);
          }
        }
      } catch (indError) {
        console.warn('Failed to fetch indicators:', indError);
      }

      // Fit content
      chartRef.current?.timeScale().fitContent();
    } catch (error) {
      console.error('Failed to fetch klines:', error);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, setCandles, setIsLoading, indicatorStore, cciSeries, mfiSeries, adxSeries, diPlusSeries, diMinusSeries, higherTfOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Background tint based on setup
  useEffect(() => {
    if (!chartRef.current) return;
    
    const latestData = indicatorStore.data.length > 0 
      ? indicatorStore.data[indicatorStore.data.length - 1] 
      : null;
    
    if (!latestData || latestData.adx == null) {
      chartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: theme === 'dark' ? '#000' : '#fff' },
        },
      });
      return;
    }
    
    const setup = detectSetup(
      latestData.adx, 
      latestData.di_plus || 0, 
      latestData.di_minus || 0, 
      latestData.cci || 0, 
      latestData.mfi || 50
    );
    
    const bgColors: Record<string, string> = {
      'Strong Uptrend': 'rgba(34, 197, 94, 0.05)',
      'Strong Downtrend': 'rgba(239, 68, 68, 0.05)',
      'Trend Long': 'rgba(74, 222, 128, 0.03)',
      'Trend Short': 'rgba(251, 146, 60, 0.03)',
      'Oversold Long': 'rgba(34, 211, 238, 0.03)',
      'Overbought Short': 'rgba(232, 121, 249, 0.03)',
    };
    
    const baseColor = theme === 'dark' ? '#000' : '#fff';
    const tintColor = bgColors[setup];
    
    // Apply base color with tint overlay
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: tintColor || baseColor },
      },
    });
  }, [indicatorStore.data, theme]);

  // Get latest data for setup table
  const latestData = indicatorStore.data.length > 0 
    ? indicatorStore.data[indicatorStore.data.length - 1] 
    : null;

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="px-4 py-2 bg-zinc-900 dark:bg-zinc-800 text-white text-sm rounded-md">
            Loading...
          </div>
        </div>
      )}
      
      {/* Toolbar with indicator settings button */}
      <div className="absolute top-2 left-2 z-50 flex gap-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium"
        >
          Indicators
        </button>
      </div>
      
      {/* Setup table overlay */}
      <SetupTable data={latestData} />
      
      {/* Indicator settings panel */}
      <IndicatorSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      <div ref={chartContainerRef} className="w-full h-full" />
      <PriceChannel
        chart={chartRef.current}
        data={indicatorStore.data}
        higherTfData={higherTfChannel}
        channelType={indicatorStore.channelType}
        show={indicatorStore.showChannel}
        higherTf={selectedHigherTf}
      />
    </div>
  );
}

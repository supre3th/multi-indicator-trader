'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, ColorType, CrosshairMode, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { useChartStore } from '@/stores/chartStore';
import { useIndicatorStore, IndicatorData } from '@/stores/indicatorStore';
import { fetchKlines, fetchIndicators } from '@/lib/api';
import { PriceChannel } from './chart/PriceChannel';
import { SetupTable, detectSetup } from './chart/SetupTable';
import { IndicatorSettings } from './ui/IndicatorSettings';
import { debug } from '@/lib/debug';

// Simple console.log wrapper
const log = (...args: unknown[]) => console.log('[Chart]', ...args);
const logError = (...args: unknown[]) => console.error('[Chart ERROR]', ...args);

// MTF timeframe mapping - defined outside component to prevent recreating loadData
const HIGHER_TF_OPTIONS: Record<string, string[]> = {
  '1m': ['5m', '15m'],
  '5m': ['15m', '1h'],
  '15m': ['1h', '4h'],
  '1h': ['4h', '1d'],
  '4h': ['1d', '1w'],
  '1d': ['1w', '1M'],
};

export function Chart() {
  log('Chart component rendering');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Indicator series refs
  const [mfiSeries, setMfiSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [cciMaSeries, setCciMaSeries] = useState<ISeriesApi<"Line"> | null>(null);
  // Threshold lines
  const [cciBandUpperSeries, setCciBandUpperSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [cciBandLowerSeries, setCciBandLowerSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [mfiUpperSeries, setMfiUpperSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [mfiLowerSeries, setMfiLowerSeries] = useState<ISeriesApi<"Line"> | null>(null);
  const [middleLineSeries, setMiddleLineSeries] = useState<ISeriesApi<"Line"> | null>(null);
  // Crossover markers
  const [crossoverMarkersSeries, setCrossoverMarkersSeries] = useState<ISeriesApi<"Line"> | null>(null);
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

  // Initialize chart
  useEffect(() => {
    addStatus('Effect: Initializing chart');
    
    if (!chartContainerRef.current) {
      addStatus('ERROR: No container ref!');
      return;
    }

    addStatus(`Creating chart (theme: ${theme})`);
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

    // CCI+MFI pane (pane 1) - MFI + CCI MA only (CCI removed per user request)
    const mfi = chart.addSeries(LineSeries, {
      color: '#FDE832',  // MFI yellow - LOCKED
      lineWidth: 1,
      title: 'MFI',
    }, 1);
    const cciMa = chart.addSeries(LineSeries, {
      color: '#A44A88',  // CCI MA pink - matches PineScript
      lineWidth: 1,
      title: 'CCI MA',
    }, 1);
    
    // Threshold lines - CCI bands at ±100 (gray, dashed)
    const cciBandUpper = chart.addSeries(LineSeries, {
      color: '#787B86',
      lineWidth: 1,
      lineStyle: 2, // dashed
      title: '+100',
      lastValueVisible: false,
    }, 1);
    const cciBandLower = chart.addSeries(LineSeries, {
      color: '#787B86',
      lineWidth: 1,
      lineStyle: 2, // dashed
      title: '-100',
      lastValueVisible: false,
    }, 1);
    
    // Threshold lines - MFI levels at ±60
    const mfiUpper = chart.addSeries(LineSeries, {
      color: '#ff0000', // red
      lineWidth: 1,
      lineStyle: 0, // solid
      title: '+60',
      lastValueVisible: false,
    }, 1);
    const mfiLower = chart.addSeries(LineSeries, {
      color: '#00ff00', // green
      lineWidth: 1,
      lineStyle: 0, // solid
      title: '-60',
      lastValueVisible: false,
    }, 1);
    
    // Middle line at 0
    const middleLine = chart.addSeries(LineSeries, {
      color: '#787B86',
      lineWidth: 1,
      lineStyle: 1, // dotted
      title: '0',
      lastValueVisible: false,
    }, 1);
    
    // Crossover markers series (invisible line, just for markers)
    const crossoverMarkers = chart.addSeries(LineSeries, {
      color: 'transparent',
      lineWidth: 1,
      lastValueVisible: false,
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
    setMfiSeries(mfi);
    setCciMaSeries(cciMa);
    setCciBandUpperSeries(cciBandUpper);
    setCciBandLowerSeries(cciBandLower);
    setMfiUpperSeries(mfiUpper);
    setMfiLowerSeries(mfiLower);
    setMiddleLineSeries(middleLine);
    setCrossoverMarkersSeries(crossoverMarkers);
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
      setMfiSeries(null);
      setCciMaSeries(null);
      setCciBandUpperSeries(null);
      setCciBandLowerSeries(null);
      setMfiUpperSeries(null);
      setMfiLowerSeries(null);
      setMiddleLineSeries(null);
      setCrossoverMarkersSeries(null);
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

  // Extract indicator settings to avoid recreating loadData on each render
  const { mfiPeriod, cciPeriod, adxPeriod, channelPeriod, channelType, higherTf, showChannel, setData: setIndicatorData } = indicatorStore;

  // Fetch data when symbol or timeframe changes
  const loadData = useCallback(async () => {
    addStatus(`loadData: ${symbol} ${timeframe}`);
    setIsLoading(true);
    try {
      // Fetch candlestick data
      addStatus('Fetching klines...');
      const data = await fetchKlines(symbol, timeframe, 200);
      addStatus(`Got ${data.length} candles`);
      setCandles(data);

      if (candlestickSeriesRef.current) {
        const chartData: CandlestickData[] = data
          .filter(candle => 
            candle.open != null && 
            candle.high != null && 
            candle.low != null && 
            candle.close != null
          )
          .map((candle) => ({
            time: (candle.time / 1000) as any, // Convert ms to seconds for lightweight-charts
            open: candle.open!,
            high: candle.high!,
            low: candle.low!,
            close: candle.close!,
          }));
        candlestickSeriesRef.current.setData(chartData);
      }

      // Fetch indicator data
      try {
        const indicatorData = await fetchIndicators(symbol, timeframe, {
          mfiPeriod,
          cciPeriod,
          adxPeriod,
          channelPeriod,
          channelType,
          higherTf: higherTf || undefined,
        });

        // Update MFI + CCI MA pane (pane 1) - CCI removed per user request
        const mfiData = indicatorData.data
          .filter(d => d.mfi !== undefined && d.mfi !== null)
          .map(d => ({ time: (d.time / 1000) as any, value: d.mfi! }));
        const cciMaData = indicatorData.data
          .filter(d => d.cci_ma !== undefined && d.cci_ma !== null)
          .map(d => ({ time: (d.time / 1000) as any, value: d.cci_ma! }));
        mfiSeries?.setData(mfiData);
        cciMaSeries?.setData(cciMaData);
        
        // Update threshold lines (horizontal lines at constant values)
        const times = indicatorData.data.map(d => ({ time: (d.time / 1000) as any }));
        cciBandUpperSeries?.setData(times.map(t => ({ ...t, value: 100 })));
        cciBandLowerSeries?.setData(times.map(t => ({ ...t, value: -100 })));
        mfiUpperSeries?.setData(times.map(t => ({ ...t, value: 60 })));
        mfiLowerSeries?.setData(times.map(t => ({ ...t, value: -60 })));
        middleLineSeries?.setData(times.map(t => ({ ...t, value: 0 })));
        
        // Note: Crossover markers would require lightweight-charts markers API
        // For now, we show the threshold lines which indicate where crossovers happen

        // Update ADX+DI pane (pane 2)
        const adxData = indicatorData.data
          .filter(d => d.adx !== undefined && d.adx !== null)
          .map(d => ({ time: (d.time / 1000) as any, value: d.adx! }));
        const diPlusData = indicatorData.data
          .filter(d => d.di_plus !== undefined && d.di_plus !== null)
          .map(d => ({ time: (d.time / 1000) as any, value: d.di_plus! }));
        const diMinusData = indicatorData.data
          .filter(d => d.di_minus !== undefined && d.di_minus !== null)
          .map(d => ({ time: (d.time / 1000) as any, value: d.di_minus! }));
        adxSeries?.setData(adxData);
        diPlusSeries?.setData(diPlusData);
        diMinusSeries?.setData(diMinusData);

        // Store indicator data
        setIndicatorData(indicatorData.data);

        // Fetch MTF channel if showChannel is enabled
        if (showChannel && higherTf) {
          const higherOptions = HIGHER_TF_OPTIONS[timeframe];
          if (higherOptions && higherOptions.includes(higherTf)) {
            const mtfResponse = await fetchIndicators(symbol, higherTf, {
              channelPeriod,
              channelType,
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
            setSelectedHigherTf(higherTf);
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
  }, [symbol, timeframe, setCandles, setIsLoading, mfiPeriod, cciPeriod, adxPeriod, channelPeriod, channelType, higherTf, showChannel, setIndicatorData, mfiSeries, cciMaSeries, cciBandUpperSeries, cciBandLowerSeries, mfiUpperSeries, mfiLowerSeries, middleLineSeries, crossoverMarkersSeries, adxSeries, diPlusSeries, diMinusSeries]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract indicator data
  const indicatorData = indicatorStore.data;

  // Background tint based on setup
  useEffect(() => {
    if (!chartRef.current) return;
    
    const latestData = indicatorData.length > 0 
      ? indicatorData[indicatorData.length - 1] 
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
  }, [indicatorData, theme]);

  // Get latest data for setup table
  const latestData = indicatorData.length > 0 
    ? indicatorData[indicatorData.length - 1] 
    : null;

  // Debug state for on-screen display
  const [debugStatus, setDebugStatus] = useState<string[]>(['Starting...']);

  const addStatus = (msg: string) => {
    setDebugStatus(prev => [...prev.slice(-4), msg]); // Keep last 5 messages
  };

  return (
    <div className="relative w-full h-full">
      {/* Debug status overlay - visible for testing */}
      <div className="absolute top-16 left-2 z-50 bg-black/80 text-green-400 text-xs p-2 rounded font-mono max-w-xs">
        <div className="font-bold mb-1">Debug Status:</div>
        {debugStatus.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
      
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

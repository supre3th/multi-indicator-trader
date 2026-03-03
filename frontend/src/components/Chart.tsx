'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, ColorType, CrosshairMode, CandlestickSeries } from 'lightweight-charts';
import { useChartStore } from '@/stores/chartStore';
import { fetchKlines } from '@/lib/api';

export function Chart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const {
    symbol,
    timeframe,
    theme,
    candles,
    isLoading,
    setCandles,
    setIsLoading,
  } = useChartStore();

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: theme === 'dark' ? '#000' : '#fff' },
        textColor: theme === 'dark' ? '#d1d5db' : '#374151',
      },
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
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

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

        // Fit content
        chartRef.current?.timeScale().fitContent();
      }
    } catch (error) {
      console.error('Failed to fetch klines:', error);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, setCandles, setIsLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="px-4 py-2 bg-zinc-900 dark:bg-zinc-800 text-white text-sm rounded-md">
            Loading...
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}

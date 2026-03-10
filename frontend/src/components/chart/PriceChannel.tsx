'use client';

import { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi, LineSeries } from 'lightweight-charts';
import { IndicatorData } from '@/stores/indicatorStore';

interface PriceChannelProps {
  chart: IChartApi | null;
  data: IndicatorData[];
  higherTfData?: IndicatorData[];
  channelType: 'pivot' | 'donchian' | 'linear_regression';
  show: boolean;
  higherTf?: string;
}

const CHANNEL_COLORS = {
  current: '#ffffff',    // White - current TF
  higher1: '#f97316',     // Orange - +1 TF
  higher2: '#a855f7',     // Purple - +2 TF
};

export function PriceChannel({ 
  chart, 
  data, 
  higherTfData, 
  channelType,
  show,
  higherTf 
}: PriceChannelProps) {
  const upperSeries = useRef<ISeriesApi<'Line'> | null>(null);
  const middleSeries = useRef<ISeriesApi<'Line'> | null>(null);
  const lowerSeries = useRef<ISeriesApi<'Line'> | null>(null);
  const higherUpperSeries = useRef<ISeriesApi<'Line'> | null>(null);
  const higherMiddleSeries = useRef<ISeriesApi<'Line'> | null>(null);
  const higherLowerSeries = useRef<ISeriesApi<'Line'> | null>(null);

  // Helper to remove a series using chart.removeSeries
  const removeSeries = (seriesRef: React.MutableRefObject<ISeriesApi<'Line'> | null>) => {
    if (chart && seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }
  };

  useEffect(() => {
    if (!chart || !show) {
      // Cleanup series if chart is null or show is false
      removeSeries(upperSeries);
      removeSeries(middleSeries);
      removeSeries(lowerSeries);
      removeSeries(higherUpperSeries);
      removeSeries(higherMiddleSeries);
      removeSeries(higherLowerSeries);
      return;
    }

    // Remove existing channel series
    removeSeries(upperSeries);
    removeSeries(middleSeries);
    removeSeries(lowerSeries);
    removeSeries(higherUpperSeries);
    removeSeries(higherMiddleSeries);
    removeSeries(higherLowerSeries);

    // Current TF Channel (pane 0 - main chart)
    const upperData = data
      .filter(d => d.channel_upper != null)
      .map(d => ({ time: (d.time / 1000) as any, value: d.channel_upper! }));
    const middleData = data
      .filter(d => d.channel_middle != null)
      .map(d => ({ time: (d.time / 1000) as any, value: d.channel_middle! }));
    const lowerData = data
      .filter(d => d.channel_lower != null)
      .map(d => ({ time: (d.time / 1000) as any, value: d.channel_lower! }));

    if (upperData.length > 0) {
      upperSeries.current = chart.addSeries(LineSeries, {
        color: CHANNEL_COLORS.current,
        lineWidth: 1,
        lineStyle: 2, // Dashed
        priceLineVisible: false,
      });
      upperSeries.current.setData(upperData);
    }

    if (middleData.length > 0) {
      middleSeries.current = chart.addSeries(LineSeries, {
        color: CHANNEL_COLORS.current,
        lineWidth: 1,
        lineStyle: 1, // Dotted
        priceLineVisible: false,
      });
      middleSeries.current.setData(middleData);
    }

    if (lowerData.length > 0) {
      lowerSeries.current = chart.addSeries(LineSeries, {
        color: CHANNEL_COLORS.current,
        lineWidth: 1,
        lineStyle: 2, // Dashed
        priceLineVisible: false,
      });
      lowerSeries.current.setData(lowerData);
    }

    // Higher TF Channel
    if (higherTfData && higherTfData.length > 0) {
      const color = higherTf ? CHANNEL_COLORS.higher1 : CHANNEL_COLORS.higher2;
      
      const hUpperData = higherTfData
        .filter(d => d.channel_upper != null)
        .map(d => ({ time: (d.time / 1000) as any, value: d.channel_upper! }));
      const hMiddleData = higherTfData
        .filter(d => d.channel_middle != null)
        .map(d => ({ time: (d.time / 1000) as any, value: d.channel_middle! }));
      const hLowerData = higherTfData
        .filter(d => d.channel_lower != null)
        .map(d => ({ time: (d.time / 1000) as any, value: d.channel_lower! }));

      if (hUpperData.length > 0) {
        higherUpperSeries.current = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
        });
        higherUpperSeries.current.setData(hUpperData);
      }

      if (hMiddleData.length > 0) {
        higherMiddleSeries.current = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          lineStyle: 1,
          priceLineVisible: false,
        });
        higherMiddleSeries.current.setData(hMiddleData);
      }

      if (hLowerData.length > 0) {
        higherLowerSeries.current = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
        });
        higherLowerSeries.current.setData(hLowerData);
      }
    }

    return () => {
      removeSeries(upperSeries);
      removeSeries(middleSeries);
      removeSeries(lowerSeries);
      removeSeries(higherUpperSeries);
      removeSeries(higherMiddleSeries);
      removeSeries(higherLowerSeries);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, data, higherTfData, show, higherTf]);

  return null;
}

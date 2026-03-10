/**
 * API wrapper for fetching data from backend.
 */
import { IndicatorData } from '@/stores/indicatorStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const log = (...args: unknown[]) => console.log('[API]', ...args);
const logError = (...args: unknown[]) => console.error('[API ERROR]', ...args);

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KlinesResponse {
  symbol: string;
  interval: string;
  data: CandleData[];
  count: number;
}

export interface SymbolsResponse {
  count: number;
  symbols: string[];
}

export interface IndicatorsResponse {
  symbol: string;
  interval: string;
  data: IndicatorData[];
  count: number;
  mtf_channel?: {
    time: number;
    channel_upper?: number;
    channel_middle?: number;
    channel_lower?: number;
  }[];
}

/**
 * Fetch klines (OHLCV) data from the backend.
 */
export async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<CandleData[]> {
  const params = new URLSearchParams({
    symbol,
    interval,
    limit: limit.toString(),
  });

  const url = `${API_BASE_URL}/api/klines?${params}`;
  log('Fetching klines:', url);
  
  const response = await fetch(url);
  log('Response status:', response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    logError('Fetch failed:', error);
    throw new Error(error.detail || `Failed to fetch klines: ${response.statusText}`);
  }

  const data: KlinesResponse = await response.json();
  log('Got klines, count:', data.count);
  return data.data;
}

/**
 * Fetch available symbols from Binance.
 */
export async function fetchSymbols(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/symbols`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to fetch symbols: ${response.statusText}`);
  }

  const data: SymbolsResponse = await response.json();
  return data.symbols;
}

/**
 * Fetch indicator data from the backend.
 */
export async function fetchIndicators(
  symbol: string,
  interval: string,
  options: {
    mfiPeriod?: number;
    cciPeriod?: number;
    adxPeriod?: number;
    channelPeriod?: number;
    channelType?: string;
    higherTf?: string;
    limit?: number;
  } = {}
): Promise<IndicatorsResponse> {
  const params = new URLSearchParams({
    symbol,
    interval,
    mfi_period: (options.mfiPeriod || 14).toString(),
    cci_period: (options.cciPeriod || 20).toString(),
    adx_period: (options.adxPeriod || 14).toString(),
    channel_period: (options.channelPeriod || 20).toString(),
    channel_type: options.channelType || 'pivot',
    limit: (options.limit || 200).toString(),
  });

  if (options.higherTf) {
    params.append('higher_tf', options.higherTf);
  }

  const response = await fetch(`${API_BASE_URL}/api/indicators?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to fetch indicators: ${response.statusText}`);
  }

  return response.json();
}

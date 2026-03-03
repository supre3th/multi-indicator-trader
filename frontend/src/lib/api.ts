/**
 * API wrapper for fetching data from backend.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

  const response = await fetch(`${API_BASE_URL}/api/klines?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to fetch klines: ${response.statusText}`);
  }

  const data: KlinesResponse = await response.json();
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

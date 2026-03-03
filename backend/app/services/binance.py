"""
Binance service using CCXT for fetching market data.
"""
import ccxt
from typing import Optional

# Initialize Binance exchange (public data, no API key required for historical)
binance = ccxt.binance({
    'enableRateLimit': True,
})

# Supported timeframes
SUPPORTED_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d']


async def fetch_klines(
    symbol: str = "BTC/USDT",
    interval: str = "1h",
    limit: int = 100
) -> list[dict]:
    """
    Fetch OHLCV (candlestick) data from Binance.
    
    Args:
        symbol: Trading pair symbol (e.g., 'BTC/USDT', 'ETH/USDT')
        interval: Timeframe (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
        limit: Number of candles to fetch (default 100, max 1500)
    
    Returns:
        List of candlestick data dictionaries
    """
    # Validate interval
    if interval not in SUPPORTED_INTERVALS:
        raise ValueError(
            f"Invalid interval '{interval}'. Supported: {SUPPORTED_INTERVALS}"
        )
    
    # Limit max candles
    limit = min(limit, 1500)
    
    # Fetch OHLCV data from Binance
    ohlcv = binance.fetch_ohlcv(symbol, timeframe=interval, limit=limit)
    
    # Convert to response format
    result = []
    for candle in ohlcv:
        result.append({
            "time": candle[0],           # Timestamp in milliseconds
            "open": candle[1],           # Open price
            "high": candle[2],           # High price
            "low": candle[3],            # Low price
            "close": candle[4],          # Close price
            "volume": candle[5]          # Volume
        })
    
    return result


def validate_symbol(symbol: str) -> bool:
    """
    Validate if a trading symbol exists on Binance.
    
    Args:
        symbol: Trading pair symbol (e.g., 'BTC/USDT')
    
    Returns:
        True if symbol exists, False otherwise
    """
    try:
        markets = binance.load_markets()
        return symbol in markets
    except Exception:
        return False

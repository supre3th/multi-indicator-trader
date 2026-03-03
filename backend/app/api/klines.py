"""
Klines (candlestick) API endpoints.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.services.binance import fetch_klines, SUPPORTED_INTERVALS, validate_symbol

router = APIRouter()


@router.get("/klines")
async def get_klines(
    symbol: str = Query("BTC/USDT", description="Trading pair symbol (e.g., BTC/USDT)"),
    interval: str = Query("1h", description="Timeframe (1m, 5m, 15m, 1h, 4h, 1d)"),
    limit: int = Query(100, ge=1, le=1500, description="Number of candles to fetch")
):
    """
    Fetch OHLCV (candlestick) data from Binance.
    
    Returns a list of candlesticks with time, open, high, low, close, and volume.
    """
    # Validate interval
    if interval not in SUPPORTED_INTERVALS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid interval '{interval}'. Supported: {SUPPORTED_INTERVALS}"
        )
    
    # Validate symbol
    if not validate_symbol(symbol):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid symbol '{symbol}'. Symbol not found on Binance."
        )
    
    # Fetch data
    try:
        klines = await fetch_klines(symbol=symbol, interval=interval, limit=limit)
        return {
            "symbol": symbol,
            "interval": interval,
            "count": len(klines),
            "data": klines
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data: {str(e)}")


@router.get("/symbols")
async def get_symbols():
    """
    Get list of available symbols on Binance.
    """
    try:
        from app.services.binance import binance
        markets = binance.load_markets()
        symbols = sorted([symbol for symbol in markets.keys() if '/USDT' in symbol])
        return {
            "count": len(symbols),
            "symbols": symbols[:100]  # Return first 100 for now
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch symbols: {str(e)}")

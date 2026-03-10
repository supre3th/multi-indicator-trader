"""
API endpoints for indicator calculations.
"""
from fastapi import APIRouter, Query
from typing import Any, Dict, List, Optional
from app.services.indicators import calculate_indicators_with_extras, calculate_mtf_channel
from app.models.indicators import IndicatorResponse, IndicatorValue, MTFChannelData

router = APIRouter()


def _dict_to_indicator_value(d: Dict[str, Any]) -> IndicatorValue:
    """Convert a dictionary to IndicatorValue, handling None values."""
    return IndicatorValue(
        time=int(d['time']),
        open=float(d['open']),
        high=float(d['high']),
        low=float(d['low']),
        close=float(d['close']),
        volume=float(d['volume']),
        cci=float(d['cci']) if d.get('cci') is not None else None,
        mfi=float(d['mfi']) if d.get('mfi') is not None else None,
        cci_ma=float(d['cci_ma']) if d.get('cci_ma') is not None else None,
        bb_upper=float(d['bb_upper']) if d.get('bb_upper') is not None else None,
        bb_lower=float(d['bb_lower']) if d.get('bb_lower') is not None else None,
        adx=float(d['adx']) if d.get('adx') is not None else None,
        di_plus=float(d['di_plus']) if d.get('di_plus') is not None else None,
        di_minus=float(d['di_minus']) if d.get('di_minus') is not None else None,
        channel_upper=float(d['channel_upper']) if d.get('channel_upper') is not None else None,
        channel_middle=float(d['channel_middle']) if d.get('channel_middle') is not None else None,
        channel_lower=float(d['channel_lower']) if d.get('channel_lower') is not None else None,
    )


def _dict_to_mtf_channel(d: Dict[str, Any]) -> MTFChannelData:
    """Convert a dictionary to MTFChannelData, handling None values."""
    return MTFChannelData(
        time=int(d['time']),
        channel_upper=float(d['channel_upper']) if d.get('channel_upper') is not None else None,
        channel_middle=float(d['channel_middle']) if d.get('channel_middle') is not None else None,
        channel_lower=float(d['channel_lower']) if d.get('channel_lower') is not None else None,
    )


@router.get("/indicators", response_model=IndicatorResponse)
async def get_indicators(
    symbol: str = Query("BTC/USDT", description="Trading symbol"),
    interval: str = Query("1h", description="Timeframe"),
    mfi_period: int = Query(14, description="MFI period"),
    cci_period: int = Query(20, description="CCI period"),
    ma_type: str = Query("SMA", description="MA type for CCI smoothing: None, SMA, EMA, WMA, SMMA"),
    ma_length: int = Query(14, description="MA period for CCI smoothing"),
    bb_mult: float = Query(2.0, description="Bollinger Bands multiplier"),
    adx_period: int = Query(14, description="ADX period"),
    channel_period: int = Query(20, description="Channel period"),
    channel_type: str = Query("pivot", description="Channel type: pivot, donchian, linear_regression"),
    higher_tf: Optional[str] = Query(None, description="Higher timeframe for MTF channel (4h, 1d, etc.)"),
    limit: int = Query(200, description="Number of candles"),
) -> IndicatorResponse:
    """Calculate MFI, CCI with optional MA, Bollinger Bands, ADX, DI, and Price Channel indicators."""
    from app.services.binance import fetch_klines
    
    # Fetch klines with extra data for indicator warmup
    max_period = max(mfi_period, cci_period, adx_period, channel_period, ma_length)
    klines = await fetch_klines(symbol, interval, limit=limit + max_period)
    
    # Calculate indicators with extras
    data = calculate_indicators_with_extras(
        klines,
        cci_period=cci_period,
        mfi_period=mfi_period,
        ma_type=ma_type,
        ma_length=ma_length,
        bb_mult=bb_mult,
    )
    
    # Return only the requested number of candles
    data = data[-limit:]
    
    # Convert to IndicatorValue objects for proper Pydantic validation
    indicator_data = [_dict_to_indicator_value(d) for d in data]
    
    # Calculate MTF channel if higher_tf is specified
    mtf_channel = None
    if higher_tf:
        mtf_data = await calculate_mtf_channel(
            symbol, interval, higher_tf,
            period=channel_period,
            channel_type=channel_type
        )
        mtf_channel = [_dict_to_mtf_channel(d) for d in mtf_data]
    
    return IndicatorResponse(
        symbol=symbol,
        interval=interval,
        data=indicator_data,
        count=len(indicator_data),
        mtf_channel=mtf_channel,
    )

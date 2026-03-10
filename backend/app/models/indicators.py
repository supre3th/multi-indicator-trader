"""
Pydantic models for indicator request/response.
"""
from pydantic import BaseModel
from typing import Optional, List


class IndicatorRequest(BaseModel):
    """Request model for indicator calculation parameters."""
    symbol: str = "BTC/USDT"
    interval: str = "1h"
    mfi_period: int = 14
    cci_period: int = 20
    adx_period: int = 14
    channel_period: int = 20
    channel_type: str = "pivot"  # pivot, donchian, linear_regression
    limit: int = 200


class MTFChannelData(BaseModel):
    """MTF channel data from higher timeframe."""
    time: int
    channel_upper: Optional[float] = None
    channel_middle: Optional[float] = None
    channel_lower: Optional[float] = None


class IndicatorValue(BaseModel):
    """Individual candle with calculated indicator values."""
    # Time
    time: int
    # OHLCV
    open: float
    high: float
    low: float
    close: float
    volume: float
    # MFI
    mfi: Optional[float] = None
    # CCI
    cci: Optional[float] = None
    # ADX/DI
    adx: Optional[float] = None
    di_plus: Optional[float] = None
    di_minus: Optional[float] = None
    # Price Channel
    channel_upper: Optional[float] = None
    channel_middle: Optional[float] = None
    channel_lower: Optional[float] = None


class IndicatorResponse(BaseModel):
    """Response model for indicator calculation endpoint."""
    symbol: str
    interval: str
    data: List[IndicatorValue]
    count: int
    mtf_channel: Optional[List[MTFChannelData]] = None

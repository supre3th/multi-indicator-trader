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
    # CCI + MFI (PineScript)
    cci: Optional[float] = None
    mfi: Optional[float] = None
    cci_ma: Optional[float] = None  # CCI smoothing MA
    bb_upper: Optional[float] = None  # Bollinger upper
    bb_lower: Optional[float] = None  # Bollinger lower
    # ADX/DI
    adx: Optional[float] = None
    di_plus: Optional[float] = None
    di_minus: Optional[float] = None
    # Threshold lines
    cci_band_upper: Optional[float] = None  # +100
    cci_band_lower: Optional[float] = None  # -100
    mfi_upper: Optional[float] = None  # +60
    mfi_lower: Optional[float] = None  # -60
    # Crossover signals
    mfi_cross_above: Optional[bool] = None
    mfi_cross_below: Optional[bool] = None
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

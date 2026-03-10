"""
Indicator calculation service using pandas.
Calculates MFI, CCI, ADX, DI+, DI-, and Price Channel indicators.
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional


def calculate_mfi(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    volume: pd.Series,
    period: int = 14,
    scaled: bool = True
) -> pd.Series:
    """
    1:1 translation of PineScript MFI:
    
    mfiRaw = ta.mfi(hlc3, mfiLength)
    mfi = (mfiRaw - 50) * 2  // Scale to -100 to +100
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        volume: Volume
        period: Lookback period (default 14)
        scaled: If True, scale from 0-100 to -100 to +100 to match CCI (default True)
    
    Returns:
        MFI values (scaled to -100 to +100 range if scaled=True)
    """
    # Use typical price (hlc3) - matches PineScript
    typical_price = (high + low + close) / 3
    
    # Raw money flow = typical_price * volume
    raw_money_flow = typical_price * volume
    
    # Money flow direction: positive if typical_price increased, negative if decreased
    price_change = typical_price.diff()
    money_flow_direction = price_change.apply(
        lambda x: 1 if x > 0 else (-1 if x < 0 else 0)
    )
    
    # Signed money flow
    signed_mf = raw_money_flow * money_flow_direction
    
    # Positive and negative money flows
    positive_mf = signed_mf.apply(lambda x: x if x > 0 else 0)
    negative_mf = signed_mf.apply(lambda x: abs(x) if x < 0 else 0)
    
    # Rolling sums
    positive_mf_sum = positive_mf.rolling(window=period).sum()
    negative_mf_sum = negative_mf.rolling(window=period).sum()
    
    # Handle division by zero - set to large value when no negative flow
    money_ratio = positive_mf_sum / negative_mf_sum.replace(0, np.nan)
    money_ratio = money_ratio.fillna(999999999)
    
    # MFI = 100 - (100 / (1 + money_ratio))
    mfi = 100 - (100 / (1 + money_ratio))
    
    # Scale from 0-100 to -100 to +100 (PineScript formula: (mfi - 50) * 2)
    if scaled:
        mfi = (mfi - 50) * 2
    
    return mfi


def calculate_cci(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 20
) -> pd.Series:
    """
    1:1 translation of PineScript CCI:
    
    cciSrc = hlc3  // (high + low + close) / 3
    cciMA = ta.sma(cciSrc, cciLength)
    cci = (cciSrc - cciMA) / (0.015 * ta.dev(cciSrc, cciLength))
    
    Note: PineScript uses stdev (ta.dev), NOT mean deviation!
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        period: Lookback period (default 20)
    
    Returns:
        CCI values
    """
    # Use hlc3 (typical price) - matches PineScript exactly
    hlc3 = (high + low + close) / 3
    
    # SMA of hlc3
    cci_ma = hlc3.rolling(window=period).mean()
    
    # Standard deviation (NOT mean deviation - PineScript uses ta.dev)
    std_dev = hlc3.rolling(window=period).std()
    
    # CCI = (src - sma) / (0.015 * stdev)
    cci = (hlc3 - cci_ma) / (0.015 * std_dev)
    
    return cci


def calculate_adx(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 14
) -> pd.DataFrame:
    """
    Calculate Average Directional Index (ADX), DI+, and DI-.
    
    Args:
        high: High prices
        low: Low prices
        close: Close prices
        period: Lookback period (default 14)
    
    Returns:
        DataFrame with ADX, DI+, DI- columns
    """
    # Calculate +DM and -DM
    high_diff = high.diff()
    low_diff = -low.diff()
    
    plus_dm = high_diff.where((high_diff > low_diff) & (high_diff > 0), 0)
    minus_dm = low_diff.where((low_diff > high_diff) & (low_diff > 0), 0)
    
    # True range
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    # Smoothed values using Wilder's smoothing
    def wilder_smooth(series: pd.Series, period: int) -> pd.Series:
        """Apply Wilder's smoothing technique."""
        result = series.copy()
        result.iloc[period] = series.iloc[:period+1].sum()
        for i in range(period + 1, len(series)):
            result.iloc[i] = result.iloc[i-1] - (result.iloc[i-1] / period) + series.iloc[i]
        return result
    
    # Smooth TR, +DM, -DM
    smoothed_tr = wilder_smooth(tr, period)
    smoothed_plus_dm = wilder_smooth(plus_dm, period)
    smoothed_minus_dm = wilder_smooth(minus_dm, period)
    
    # +DI and -DI
    plus_di = 100 * (smoothed_plus_dm / smoothed_tr)
    minus_di = 100 * (smoothed_minus_dm / smoothed_tr)
    
    # DX
    dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
    
    # ADX (smoothed DX)
    adx = wilder_smooth(dx, period)
    
    result = pd.DataFrame({
        'adx': adx,
        'di_plus': plus_di,
        'di_minus': minus_di
    }, index=high.index)
    
    return result


def calculate_pivot_channel(
    high: pd.Series,
    low: pd.Series,
    period: int = 20
) -> tuple[pd.Series, pd.Series]:
    """
    Calculate Pivot Channel (rolling high/low shifted by 1).
    
    Args:
        high: High prices
        low: Low prices
        period: Lookback period (default 20)
    
    Returns:
        Tuple of (upper, lower) series
    """
    channel_upper = high.rolling(window=period).max().shift(1)
    channel_lower = low.rolling(window=period).min().shift(1)
    
    return channel_upper, channel_lower


def calculate_donchian_channel(
    high: pd.Series,
    low: pd.Series,
    period: int = 20
) -> tuple[pd.Series, pd.Series]:
    """
    Calculate Donchian Channel.
    
    Args:
        high: High prices
        low: Low prices
        period: Lookback period (default 20)
    
    Returns:
        Tuple of (upper, lower) series
    """
    channel_upper = high.rolling(window=period).max()
    channel_lower = low.rolling(window=period).min()
    
    return channel_upper, channel_lower


def calculate_linear_regression_channel(
    close: pd.Series,
    period: int = 20
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """
    Calculate Linear Regression Channel.
    
    Args:
        close: Close prices
        period: Lookback period (default 20)
    
    Returns:
        Tuple of (upper, middle, lower) series
    """
    # Middle line (linear regression)
    channel_middle = close.rolling(window=period).mean()
    
    # Standard deviation
    std = close.rolling(window=period).std()
    
    # Upper and lower bands (2 standard deviations)
    channel_upper = channel_middle + (std * 2)
    channel_lower = channel_middle - (std * 2)
    
    return channel_upper, channel_middle, channel_lower


def calculate_indicators(
    klines: List,
    mfi_period: int = 14,
    cci_period: int = 20,
    adx_period: int = 14,
    channel_period: int = 20,
    channel_type: str = "pivot"
) -> List[Dict[str, Any]]:
    """
    Calculate all indicators for given klines.
    
    Args:
        klines: List of kline tuples (time, open, high, low, close, volume)
        mfi_period: MFI lookback period (default 14)
        cci_period: CCI lookback period (default 20)
        adx_period: ADX lookback period (default 14)
        channel_period: Channel lookback period (default 20)
        channel_type: Channel type - "pivot", "donchian", or "linear_regression"
    
    Returns:
        List of dictionaries with OHLCV and indicator values
    """
    # Create DataFrame with lowercase column names
    df = pd.DataFrame(
        klines,
        columns=['time', 'open', 'high', 'low', 'close', 'volume']
    )
    
    # Ensure numeric types
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df.loc[:, col] = pd.to_numeric(df[col])
    
    # Calculate MFI
    df.loc[:, 'mfi'] = calculate_mfi(
        df['high'], df['low'], df['close'], df['volume'],
        period=mfi_period
    )
    
    # Calculate CCI
    df.loc[:, 'cci'] = calculate_cci(
        df['high'], df['low'], df['close'],
        period=cci_period
    )
    
    # Calculate ADX, DI+, DI-
    adx_result = calculate_adx(
        df['high'], df['low'], df['close'],
        period=adx_period
    )
    df.loc[:, 'adx'] = adx_result['adx']
    df.loc[:, 'di_plus'] = adx_result['di_plus']
    df.loc[:, 'di_minus'] = adx_result['di_minus']
    
    # Calculate Price Channel based on type
    if channel_type == 'pivot':
        ch_upper, ch_lower = calculate_pivot_channel(
            df['high'], df['low'],
            period=channel_period
        )
        df.loc[:, 'channel_upper'] = ch_upper
        df.loc[:, 'channel_lower'] = ch_lower
        df.loc[:, 'channel_middle'] = None
    elif channel_type == 'donchian':
        ch_upper, ch_lower = calculate_donchian_channel(
            df['high'], df['low'],
            period=channel_period
        )
        df.loc[:, 'channel_upper'] = ch_upper
        df.loc[:, 'channel_lower'] = ch_lower
        df.loc[:, 'channel_middle'] = None
    elif channel_type == 'linear_regression':
        ch_upper, ch_middle, ch_lower = calculate_linear_regression_channel(
            df['close'],
            period=channel_period
        )
        df.loc[:, 'channel_upper'] = ch_upper
        df.loc[:, 'channel_middle'] = ch_middle
        df.loc[:, 'channel_lower'] = ch_lower
    
    # Convert to list of dicts
    result = df.to_dict(orient='records')
    
    # Convert numpy types to native Python types for JSON serialization
    for row in result:
        for key, value in row.items():
            if pd.isna(value) or value is None:
                row[key] = None
            elif isinstance(value, (np.integer, np.floating)):
                row[key] = float(value) if isinstance(value, np.floating) else int(value)
    
    return result


async def calculate_mtf_channel(
    symbol: str,
    interval: str,
    higher_tf: str,
    period: int = 20,
    channel_type: str = "pivot"
) -> List[Dict[str, Any]]:
    """
    Calculate channel from higher timeframe data.
    
    Args:
        symbol: Trading symbol (e.g., BTC/USDT)
        interval: Current timeframe
        higher_tf: Higher timeframe (e.g., 4h, 1d, 1w)
        period: Channel lookback period
        channel_type: Channel type - "pivot", "donchian", or "linear_regression"
    
    Returns:
        List of dictionaries with time and channel values
    """
    from app.services.binance import fetch_klines
    
    # Fetch higher TF data
    higher_klines = await fetch_klines(symbol, higher_tf, limit=100)
    df = pd.DataFrame(higher_klines, columns=['time', 'open', 'high', 'low', 'close', 'volume'])
    
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df[col] = pd.to_numeric(df[col])
    
    # Calculate channel based on type
    if channel_type == 'pivot':
        df['channel_upper'] = df['high'].rolling(period).max().shift(1)
        df['channel_lower'] = df['low'].rolling(period).min().shift(1)
        df['channel_middle'] = None
    elif channel_type == 'donchian':
        df['channel_upper'] = df['high'].rolling(period).max()
        df['channel_lower'] = df['low'].rolling(period).min()
        df['channel_middle'] = None
    elif channel_type == 'linear_regression':
        df['channel_middle'] = df['close'].rolling(period).mean()
        std = df['close'].rolling(period).std()
        df['channel_upper'] = df['channel_middle'] + (std * 2)
        df['channel_lower'] = df['channel_middle'] - (std * 2)
    
    # Select only required columns
    result = df[['time', 'channel_upper', 'channel_middle', 'channel_lower']].to_dict(orient='records')
    
    # Convert numpy types
    for row in result:
        for key, value in row.items():
            if pd.isna(value) or value is None:
                row[key] = None
            elif isinstance(value, (np.integer, np.floating)):
                row[key] = float(value) if isinstance(value, np.floating) else int(value)
    
    return result

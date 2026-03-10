"""
Indicator calculation service using pandas.
Calculates MFI, CCI, ADX, DI+, DI-, and Price Channel indicators.
Full 1:1 translation of PineScript CCI + MFI Combined indicator.
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple


def calculate_mfi(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    volume: pd.Series,
    period: int = 14
) -> pd.Series:
    """
    Money Flow Index (MFI) - 1:1 PineScript translation.
    
    Uses hlc3 as source and scales to -100 to +100 range.
    """
    # hlc3 = typical price
    hlc3 = (high + low + close) / 3
    
    # Raw money flow = hlc3 * volume
    raw_money_flow = hlc3 * volume
    
    # Money flow direction based on hlc3 change
    mf_change = hlc3.diff()
    mf_direction = pd.Series(np.where(mf_change > 0, 1, np.where(mf_change < 0, -1, 0)), index=hlc3.index)
    
    # Signed money flow
    signed_mf = raw_money_flow * mf_direction
    
    # Positive and negative money flows
    positive_mf = signed_mf.apply(lambda x: x if x > 0 else 0)
    negative_mf = signed_mf.apply(lambda x: abs(x) if x < 0 else 0)
    
    # Rolling sums
    positive_mf_sum = positive_mf.rolling(window=period).sum()
    negative_mf_sum = negative_mf.rolling(window=period).sum()
    
    # Money ratio with zero handling
    money_ratio = positive_mf_sum / negative_mf_sum.replace(0, np.nan)
    money_ratio = money_ratio.fillna(999999999)
    
    # MFI = 100 - (100 / (1 + money_ratio))
    mfi = 100 - (100 / (1 + money_ratio))
    
    # Scale from 0-100 to -100 to +100
    # PineScript: mfi = (mfiRaw - 50) * 2
    mfi = (mfi - 50) * 2
    
    return mfi


def calculate_cci(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 20
) -> pd.Series:
    """
    Commodity Channel Index (CCI) - 1:1 PineScript translation.
    
    PineScript formula:
    cciMA = ta.sma(hlc3, cciLength)
    cci = (hlc3 - cciMA) / (0.015 * ta.dev(hlc3, cciLength))
    
    NOTE: ta.dev is MEAN DEVIATION (average absolute deviation), NOT standard deviation!
    """
    # hlc3 = typical price (matches PineScript cciSrc)
    hlc3 = (high + low + close) / 3
    
    # SMA of hlc3
    cci_ma = hlc3.rolling(window=period).mean()
    
    # Mean deviation (NOT standard deviation!)
    # PineScript ta.dev calculates: mean(|x - mean(x)|)
    mean_dev = hlc3.rolling(window=period).apply(
        lambda x: np.mean(np.abs(x - np.mean(x)))
    )
    
    # Replace zero mean_dev with NaN to avoid division by zero
    mean_dev = mean_dev.replace(0, np.nan)
    
    # CCI = (src - sma) / (0.015 * mean_deviation)
    cci = (hlc3 - cci_ma) / (0.015 * mean_dev)
    
    return cci


def calculate_indicators_with_extras(
    klines: List,
    cci_period: int = 20,
    mfi_period: int = 14,
    ma_type: str = "SMA",
    ma_length: int = 14,
    bb_mult: float = 2.0
) -> Dict[str, Any]:
    """
    Full PineScript CCI + MFI Combined indicator with all extras:
    - CCI and MFI (both scaled to -100 to +100)
    - CCI SMA (optional MA on CCI)
    - Bollinger Bands around CCI SMA
    - Threshold levels at ±60
    
    Args:
        klines: List of kline tuples
        cci_period: CCI period (default 20)
        mfi_period: MFI period (default 14)
        ma_type: MA type for CCI smoothing ("None", "SMA", "EMA", "WMA", "SMMA")
        ma_length: MA period for CCI smoothing
        bb_mult: Bollinger Bands multiplier
    
    Returns:
        Dictionary with all indicator values
    """
    # Create DataFrame
    df = pd.DataFrame(klines, columns=['time', 'open', 'high', 'low', 'close', 'volume'])
    
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df[col] = pd.to_numeric(df[col])
    
    hlc3 = (df['high'] + df['low'] + df['close']) / 3
    
    # === CCI ===
    # PineScript: cci = (hlc3 - ta.sma(hlc3, cciLength)) / (0.015 * ta.dev(hlc3, cciLength))
    # NOTE: ta.dev is MEAN DEVIATION, not standard deviation!
    cci_ma = hlc3.rolling(window=cci_period).mean()
    cci_mean_dev = hlc3.rolling(window=cci_period).apply(
        lambda x: np.mean(np.abs(x - np.mean(x)))
    ).replace(0, np.nan)
    df['cci'] = (hlc3 - cci_ma) / (0.015 * cci_mean_dev)
    
    # === MFI ===
    # MFI: raw = ta.mfi(hlc3, period), scaled = (raw - 50) * 2
    raw_mf = hlc3 * df['volume']
    mf_change = hlc3.diff()
    mf_direction = pd.Series(np.where(mf_change > 0, 1, np.where(mf_change < 0, -1, 0)), index=df.index)
    signed_mf = raw_mf * mf_direction
    positive_mf = signed_mf.apply(lambda x: x if x > 0 else 0).rolling(window=mfi_period).sum()
    negative_mf = signed_mf.apply(lambda x: abs(x) if x < 0 else 0).rolling(window=mfi_period).sum()
    mfi_ratio = positive_mf / negative_mf.replace(0, np.nan)
    mfi_raw = 100 - (100 / (1 + mfi_ratio.fillna(999999999)))
    df['mfi'] = (mfi_raw - 50) * 2  # Scaled to -100 to +100
    
    # === CCI MA (optional smoothing) ===
    if ma_type == "SMA":
        df['cci_ma'] = df['cci'].rolling(window=ma_length).mean()
    elif ma_type == "EMA":
        df['cci_ma'] = df['cci'].ewm(span=ma_length, adjust=False).mean()
    elif ma_type == "WMA":
        weights = np.arange(1, ma_length + 1)
        df['cci_ma'] = df['cci'].rolling(window=ma_length).apply(
            lambda x: np.sum(weights * x) / weights.sum() if len(x) == ma_length else np.nan, raw=True
        )
    elif ma_type == "SMMA" or ma_type == "RMA":
        df['cci_ma'] = df['cci'].ewm(alpha=1/ma_length, adjust=False).mean()
    else:
        df['cci_ma'] = None
    
    # === Bollinger Bands around CCI MA ===
    if df['cci_ma'] is not None and not df['cci_ma'].isna().all():
        bb_std = df['cci'].rolling(window=ma_length).std()
        df['bb_upper'] = df['cci_ma'] + (bb_std * bb_mult)
        df['bb_lower'] = df['cci_ma'] - (bb_std * bb_mult)
    else:
        df['bb_upper'] = None
        df['bb_lower'] = None
    
    # === Threshold levels (scaled) ===
    # PineScript uses ±60 for MFI thresholds (scaled from ±100)
    # CCI bands at ±100
    df['cci_band_upper'] = 100
    df['cci_band_lower'] = -100
    df['mfi_upper'] = 60
    df['mfi_lower'] = -60
    
    # === Crossover detection ===
    # MFI crossing above/below threshold (only MFI, not CCI per user request)
    df['mfi_cross_above'] = (df['mfi'] > df['mfi_upper']) & (df['mfi'].shift(1) <= df['mfi_upper'])
    df['mfi_cross_below'] = (df['mfi'] < df['mfi_lower']) & (df['mfi'].shift(1) >= df['mfi_lower'])
    
    # === Background zones ===
    # MFI overbought (>60) = red, oversold (<-60) = green
    df['mfi_zone'] = 'neutral'
    df.loc[df['mfi'] > df['mfi_upper'], 'mfi_zone'] = 'overbought'
    df.loc[df['mfi'] < df['mfi_lower'], 'mfi_zone'] = 'oversold'
    
    # === ADX Calculation - 1:1 PineScript Translation ===
    # PineScript:
    # TrueRange = math.max(math.max(high - low, math.abs(high - nz(close[1]))), math.abs(low - nz(close[1])))
    # DirectionalMovementPlus = high - nz(high[1]) > nz(low[1]) - low ? math.max(high - nz(high[1]), 0) : 0
    # DirectionalMovementMinus = nz(low[1]) - low > high - nz(high[1]) ? math.max(nz(low[1]) - low, 0) : 0
    
    high = df['high']
    low = df['low']
    close = df['close']
    
    # Previous values (nz = 0 if na)
    prev_high = high.shift(1).fillna(0)
    prev_low = low.shift(1).fillna(0)
    prev_close = close.shift(1).fillna(0)
    
    # True Range
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    # Directional Movement - PineScript 1:1
    # +DM = high - prev_high > prev_low - low ? max(high - prev_high, 0) : 0
    dm_plus_raw = high - prev_high
    dm_minus_raw = prev_low - low
    
    # PineScript conditions using np.where
    plus_dm = pd.Series(
        np.where(
            dm_plus_raw > dm_minus_raw,
            np.maximum(dm_plus_raw, 0),
            0
        ),
        index=df.index
    )
    
    minus_dm = pd.Series(
        np.where(
            dm_minus_raw > dm_plus_raw,
            np.maximum(dm_minus_raw, 0),
            0
        ),
        index=df.index
    )
    
    period = 14
    
    # Wilder's Smoothing using pandas ewm (equivalent to PineScript's ta.rma)
    # alpha = 1/period gives Wilder smoothing behavior
    alpha = 1.0 / period
    
    smoothed_tr = true_range.ewm(alpha=alpha, adjust=False).mean()
    smoothed_plus_dm = plus_dm.ewm(alpha=alpha, adjust=False).mean()
    smoothed_minus_dm = minus_dm.ewm(alpha=alpha, adjust=False).mean()
    
    # DI+ and DI- (multiply by 100)
    # DIPlus = SmoothedDirectionalMovementPlus / SmoothedTrueRange * 100
    di_plus = 100 * (smoothed_plus_dm / pd.Series(smoothed_tr).replace(0, np.nan))
    di_minus = 100 * (smoothed_minus_dm / pd.Series(smoothed_tr).replace(0, np.nan))
    
    # DX
    # DX = math.abs(DIPlus - DIMinus) / (DIPlus + DIMinus) * 100
    di_sum = pd.Series(di_plus + di_minus).replace(0, np.nan)
    dx = pd.Series(100 * np.abs(di_plus - di_minus) / di_sum, index=df.index)
    
    # ADX = Wilder's smoothing (RMA) of DX - use ewm
    adx = dx.ewm(alpha=alpha, adjust=False).mean()
    
    df['adx'] = adx
    df['di_plus'] = di_plus
    df['di_minus'] = di_minus
    
    # Result
    result = df[['time', 'open', 'high', 'low', 'close', 'volume', 
                  'cci', 'mfi', 'cci_ma', 'bb_upper', 'bb_lower',
                  'adx', 'di_plus', 'di_minus',
                  'cci_band_upper', 'cci_band_lower', 'mfi_upper', 'mfi_lower',
                  'mfi_cross_above', 'mfi_cross_below',
                  'mfi_zone']].to_dict(orient='records')
    
    # Convert numpy types
    for row in result:
        for key, value in row.items():
            if pd.isna(value) or value is None:
                row[key] = None
            elif isinstance(value, (np.integer, np.floating)):
                row[key] = float(value) if isinstance(value, np.floating) else int(value)
            elif isinstance(value, (np.bool_, bool)):
                row[key] = bool(value)
    
    return result

def calculate_adx(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 14
) -> pd.DataFrame:
    """
    Calculate Average Directional Index (ADX), DI+, and DI-
    matching Pine Script's implementation exactly.

    Args:
        high: High prices
        low: Low prices
        close: Close prices
        period: Lookback period (default 14)

    Returns:
        DataFrame with adx, di_plus, di_minus columns
    """

    def wilder_smooth(series: pd.Series, period: int) -> pd.Series:
        """
        Wilder's smoothing: smoothed = prev - (prev / period) + current
        First bar seeds with its own value (nz behavior).
        Falls back to current value if prev is NaN.
        """
        result = pd.Series(np.nan, index=series.index)

        for i in range(len(series)):
            if i == 0:
                result.iloc[i] = series.iloc[i]
            else:
                prev = result.iloc[i - 1]
                # Match Pine Script nz(): if prev is NaN, treat as current value
                prev = series.iloc[i] if pd.isna(prev) else prev
                result.iloc[i] = prev - (prev / period) + series.iloc[i]

        return result

    # ── True Range ────────────────────────────────────────────────────────────
    # Use fillna(close) on shift to match Pine Script's nz(close[1]) on bar 0
    prev_close = close.shift(1).fillna(close)

    high_low        = high - low
    high_prev_close = (high - prev_close).abs()
    low_prev_close  = (low  - prev_close).abs()

    tr = pd.concat([high_low, high_prev_close, low_prev_close], axis=1).max(axis=1)

    # ── Directional Movement ──────────────────────────────────────────────────
    # Use fillna to match Pine Script's nz(high[1]) and nz(low[1]) on bar 0
    prev_high = high.shift(1).fillna(high)
    prev_low  = low.shift(1).fillna(low)

    high_diff = high - prev_high   # high - high[1]
    low_diff  = prev_low - low     # low[1] - low

    # DM+ = high_diff > low_diff AND high_diff > 0 → max(high_diff, 0), else 0
    plus_dm  = pd.Series(0.0, index=high.index)
    minus_dm = pd.Series(0.0, index=high.index)

    dm_plus_cond  = (high_diff > low_diff)  & (high_diff > 0)
    dm_minus_cond = (low_diff  > high_diff) & (low_diff  > 0)

    plus_dm[dm_plus_cond]   = high_diff[dm_plus_cond].clip(lower=0)
    minus_dm[dm_minus_cond] = low_diff[dm_minus_cond].clip(lower=0)

    # ── Wilder Smoothing ──────────────────────────────────────────────────────
    smoothed_tr       = wilder_smooth(tr,       period)
    smoothed_plus_dm  = wilder_smooth(plus_dm,  period)
    smoothed_minus_dm = wilder_smooth(minus_dm, period)

    # ── DI+ and DI- ───────────────────────────────────────────────────────────
    smoothed_tr_safe = smoothed_tr.replace(0, np.nan)

    di_plus  = (smoothed_plus_dm  / smoothed_tr_safe * 100).fillna(0)
    di_minus = (smoothed_minus_dm / smoothed_tr_safe * 100).fillna(0)

    # ── DX ────────────────────────────────────────────────────────────────────
    di_sum = (di_plus + di_minus).replace(0, np.nan)
    dx = ((di_plus - di_minus).abs() / di_sum * 100).fillna(0)

    # ── ADX = SMA of DX (matches Pine Script's ta.sma) ───────────────────────
    adx = dx.rolling(window=period, min_periods=1).mean()

    return pd.DataFrame({
        'adx':      adx,
        'di_plus':  di_plus,
        'di_minus': di_minus
    }, index=high.index)

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

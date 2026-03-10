"""
Test user's exact ADX script.
"""
import pandas as pd
import numpy as np
import asyncio
import sys
sys.path.insert(0, 'backend')

from app.services.binance import fetch_klines


def calculate_adx_user(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 14
) -> pd.DataFrame:
    """User's exact ADX implementation."""

    def wilder_smooth(series: pd.Series, period: int) -> pd.Series:
        """Apply Wilder's smoothing technique, handling leading NaNs correctly."""
        result = pd.Series(np.nan, index=series.index)

        # Find first valid (non-NaN) position
        first_valid = series.first_valid_index()
        if first_valid is None:
            return result

        start_loc = series.index.get_loc(first_valid)
        seed_loc = start_loc + period - 1

        if seed_loc >= len(series):
            return result

        # Seed: sum of first `period` valid values
        result.iloc[seed_loc] = series.iloc[start_loc:seed_loc + 1].sum()

        # Wilder's smoothing forward
        for i in range(seed_loc + 1, len(series)):
            result.iloc[i] = result.iloc[i - 1] - (result.iloc[i - 1] / period) + series.iloc[i]

        return result

    # Calculate +DM and -DM
    high_diff = high.diff()
    low_diff = -low.diff()
    plus_dm = high_diff.where((high_diff > low_diff) & (high_diff > 0), 0)
    minus_dm = low_diff.where((low_diff > high_diff) & (low_diff > 0), 0)

    # True Range
    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    # Smooth TR, +DM, -DM using Wilder's smoothing
    smoothed_tr = wilder_smooth(tr, period)
    smoothed_plus_dm = wilder_smooth(plus_dm, period)
    smoothed_minus_dm = wilder_smooth(minus_dm, period)

    # +DI and -DI
    plus_di = 100 * (smoothed_plus_dm / smoothed_tr)
    minus_di = 100 * (smoothed_minus_dm / smoothed_tr)

    # DX
    di_sum = plus_di + minus_di
    dx = 100 * (plus_di - minus_di).abs() / di_sum
    dx = dx.where(di_sum != 0, np.nan)  # Avoid division by zero

    # ADX: Wilder smooth of DX
    adx = wilder_smooth(dx, period)

    return pd.DataFrame({
        'adx': adx,
        'di_plus': plus_di,
        'di_minus': minus_di
    }, index=high.index)


async def test():
    print("Testing USER's exact script...")
    
    # Fetch data
    klines = await fetch_klines("ETH/USDT", "1h", limit=100)
    
    df = pd.DataFrame(klines, columns=['time', 'open', 'high', 'low', 'close', 'volume'])
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df[col] = pd.to_numeric(df[col])
    
    # User's function
    result = calculate_adx_user(df['high'], df['low'], df['close'], period=14)
    
    print(f"\n{'Index':<6} {'ADX':<10} {'DI+':<10} {'DI-':<10}")
    print("-" * 36)
    
    for i in range(20, min(30, len(result))):
        adx = result['adx'].iloc[i]
        di_p = result['di_plus'].iloc[i]
        di_m = result['di_minus'].iloc[i]
        
        if pd.notna(adx):
            print(f"{i:<6} {adx:<10.2f} {di_p:<10.2f} {di_m:<10.2f}")
    
    valid_adx = result['adx'].dropna()
    print(f"\nADX range: {valid_adx.min():.2f} - {valid_adx.max():.2f}")
    print(f"[PASS] ADX in 0-100: {all((valid_adx >= 0) & (valid_adx <= 100))}")


if __name__ == "__main__":
    asyncio.run(test())

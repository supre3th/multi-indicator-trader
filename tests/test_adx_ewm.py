"""
Test ADX with pandas ewm (equivalent to Wilder smoothing).
"""
import pandas as pd
import numpy as np
import asyncio
import sys
sys.path.insert(0, 'backend')

from app.services.binance import fetch_klines


def calculate_adx_ewm(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 14
) -> pd.DataFrame:
    """ADX using pandas ewm (should be equivalent to Wilder smoothing)."""
    
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

    # Use pandas ewm with alpha = 1/period (equivalent to Wilder smoothing)
    alpha = 1.0 / period
    
    smoothed_tr = tr.ewm(alpha=alpha, adjust=False).mean()
    smoothed_plus_dm = plus_dm.ewm(alpha=alpha, adjust=False).mean()
    smoothed_minus_dm = minus_dm.ewm(alpha=alpha, adjust=False).mean()

    # +DI and -DI
    plus_di = 100 * (smoothed_plus_dm / smoothed_tr)
    minus_di = 100 * (smoothed_minus_dm / smoothed_tr)

    # DX
    di_sum = plus_di + minus_di
    dx = 100 * (plus_di - minus_di).abs() / di_sum
    dx = dx.replace([np.inf, -np.inf], np.nan)

    # ADX: ewm of DX
    adx = dx.ewm(alpha=alpha, adjust=False).mean()

    return pd.DataFrame({
        'adx': adx,
        'di_plus': plus_di,
        'di_minus': minus_di
    }, index=high.index)


async def test():
    print("Testing with pandas ewm...")
    
    # Fetch data
    klines = await fetch_klines("ETH/USDT", "1h", limit=200)
    
    df = pd.DataFrame(klines, columns=['time', 'open', 'high', 'low', 'close', 'volume'])
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df[col] = pd.to_numeric(df[col])
    
    # Test with ewm
    result = calculate_adx_ewm(df['high'], df['low'], df['close'], period=14)
    
    print(f"\n{'Index':<6} {'ADX':<10} {'DI+':<10} {'DI-':<10}")
    print("-" * 36)
    
    for i in range(30, min(40, len(result))):
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

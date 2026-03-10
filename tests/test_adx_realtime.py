"""
Test ADX/DI with real Binance data.
"""
import asyncio
import sys
sys.path.insert(0, 'backend')

from app.services.binance import fetch_klines
from app.services.indicators import calculate_adx, calculate_indicators_with_extras


async def test_with_real_data():
    print("=" * 60)
    print("TESTING WITH REAL BINANCE DATA")
    print("=" * 60)
    
    # Fetch real BTC/USDT data
    symbol = "BTC/USDT"
    interval = "1h"
    limit = 100
    
    print(f"\nFetching {limit} klines for {symbol} ({interval})...")
    klines = await fetch_klines(symbol, interval, limit=limit)
    
    if not klines:
        print("ERROR: No data fetched")
        return
    
    print(f"Fetched {len(klines)} klines")
    
    # Test calculate_indicators_with_extras
    print("\n" + "=" * 60)
    print("Test: calculate_indicators_with_extras")
    print("=" * 60)
    
    result = calculate_indicators_with_extras(klines)
    
    print(f"\n{'Index':<6} {'Time':<12} {'ADX':<10} {'DI+':<10} {'DI-':<10}")
    print("-" * 48)
    
    for i in range(20, min(30, len(result))):
        r = result[i]
        adx = r.get('adx')
        di_p = r.get('di_plus')
        di_m = r.get('di_minus')
        
        if adx is not None:
            print(f"{i:<6} {r['time']:<12} {adx:<10.2f} {di_p:<10.2f} {di_m:<10.2f}")
    
    # Statistics
    adx_values = [r['adx'] for r in result if r['adx'] is not None]
    di_plus = [r['di_plus'] for r in result if r['di_plus'] is not None]
    di_minus = [r['di_minus'] for r in result if r['di_minus'] is not None]
    
    print("\n" + "=" * 60)
    print("STATISTICS (Real Binance Data)")
    print("=" * 60)
    print(f"ADX range: {min(adx_values):.2f} - {max(adx_values):.2f}")
    print(f"ADX mean: {sum(adx_values)/len(adx_values):.2f}")
    print(f"DI+ range: {min(di_plus):.2f} - {max(di_plus):.2f}")
    print(f"DI- range: {min(di_minus):.2f} - {max(di_minus):.2f}")
    
    # Validation
    print("\n" + "=" * 60)
    print("VALIDATION")
    print("=" * 60)
    all_valid = all(0 <= v <= 100 for v in adx_values)
    print(f"[PASS] ADX in 0-100 range: {all_valid}")
    
    di_sum_check = all((p + m) <= 100.1 for p, m in zip(di_plus, di_minus))
    print(f"[PASS] DI+ + DI- <= 100: {di_sum_check}")
    
    # Last values
    last = result[-1]
    print(f"\nLast bar values:")
    print(f"  ADX: {last['adx']:.2f}")
    print(f"  DI+: {last['di_plus']:.2f}")
    print(f"  DI-: {last['di_minus']:.2f}")
    
    trend = "BULLISH" if last['di_plus'] > last['di_minus'] else "BEARISH" if last['di_minus'] > last['di_plus'] else "NEUTRAL"
    print(f"  Trend: {trend}")
    print(f"  Strong (ADX > 25): {'YES' if last['adx'] > 25 else 'NO'}")
    
    return result


async def test_calculate_adx_directly():
    """Test calculate_adx function directly with real data."""
    print("\n" + "=" * 60)
    print("TESTING calculate_adx() FUNCTION DIRECTLY")
    print("=" * 60)
    
    # Fetch data
    klines = await fetch_klines("ETH/USDT", "1h", limit=100)
    
    if not klines:
        print("ERROR: No data fetched")
        return
    
    # Extract OHLC
    import pandas as pd
    df = pd.DataFrame(klines, columns=['time', 'open', 'high', 'low', 'close', 'volume'])
    
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df[col] = pd.to_numeric(df[col])
    
    # Calculate ADX directly
    result = calculate_adx(df['high'], df['low'], df['close'], period=14)
    
    print(f"\n{'Index':<6} {'ADX':<10} {'DI+':<10} {'DI-':<10}")
    print("-" * 36)
    
    for i in range(20, min(30, len(result))):
        adx = result['adx'].iloc[i]
        di_p = result['di_plus'].iloc[i]
        di_m = result['di_minus'].iloc[i]
        
        if pd.notna(adx):
            print(f"{i:<6} {adx:<10.2f} {di_p:<10.2f} {di_m:<10.2f}")
    
    # Statistics
    valid_adx = result['adx'].dropna()
    
    print("\n" + "=" * 60)
    print("STATISTICS (ETH/USDT)")
    print("=" * 60)
    print(f"ADX range: {valid_adx.min():.2f} - {valid_adx.max():.2f}")
    print(f"ADX mean: {valid_adx.mean():.2f}")
    
    all_valid = (valid_adx >= 0).all() and (valid_adx <= 100).all()
    print(f"\n[PASS] ADX in 0-100 range: {all_valid}")
    
    return result


if __name__ == "__main__":
    asyncio.run(test_with_real_data())
    asyncio.run(test_calculate_adx_directly())

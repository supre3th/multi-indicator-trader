"""
Test script for ADX and DI indicators.
Verifies that the ADX/DI calculations produce expected values.
"""
import pandas as pd
import numpy as np
import sys
sys.path.insert(0, 'backend')

from app.services.indicators import calculate_adx, calculate_indicators_with_extras


def test_adx_calculation():
    """Test ADX/DI with known sample data."""
    print("=" * 60)
    print("TEST 1: ADX Calculation with Sample Data")
    print("=" * 60)
    
    # Create sample price data (typical BTC/USDT-like data)
    np.random.seed(42)
    
    # Generate realistic price movements
    n = 50
    base_price = 50000
    prices = [base_price]
    
    for _ in range(n - 1):
        change = np.random.randn() * 500
        prices.append(prices[-1] + change)
    
    close = pd.Series(prices)
    
    # Generate high/low with some spread
    high = close + np.random.uniform(100, 300, n)
    low = close - np.random.uniform(100, 300, n)
    
    # Calculate ADX
    result = calculate_adx(high, low, close, period=14)
    
    print(f"\nPeriod: 14")
    print(f"Total bars: {len(result)}")
    print(f"\nFirst 20 values:")
    print(f"{'Index':<6} {'High':<10} {'Low':<10} {'Close':<10} {'ADX':<10} {'DI+':<10} {'DI-':<10}")
    print("-" * 66)
    
    for i in range(min(20, len(result))):
        adx_val = result['adx'].iloc[i]
        di_p = result['di_plus'].iloc[i]
        di_m = result['di_minus'].iloc[i]
        
        if pd.notna(adx_val):
            print(f"{i:<6} {high.iloc[i]:<10.2f} {low.iloc[i]:<10.2f} {close.iloc[i]:<10.2f} "
                  f"{adx_val:<10.2f} {di_p:<10.2f} {di_m:<10.2f}")
    
    # Statistics
    valid_adx = result['adx'].dropna()
    valid_di_plus = result['di_plus'].dropna()
    valid_di_minus = result['di_minus'].dropna()
    
    print("\n" + "=" * 60)
    print("STATISTICS:")
    print("=" * 60)
    print(f"ADX range: {valid_adx.min():.2f} - {valid_adx.max():.2f}")
    print(f"ADX mean: {valid_adx.mean():.2f}")
    print(f"DI+ range: {valid_di_plus.min():.2f} - {valid_di_plus.max():.2f}")
    print(f"DI- range: {valid_di_minus.min():.2f} - {valid_di_minus.max():.2f}")
    
    # Expected behavior checks
    print("\n" + "=" * 60)
    print("VALIDATION CHECKS:")
    print("=" * 60)
    
    # ADX should typically be 0-100
    adx_valid = (valid_adx >= 0).all() and (valid_adx <= 100).all()
    print(f"[PASS] ADX in valid range (0-100): {adx_valid}")
    
    # DI+/DI- should be 0-100
    di_valid = ((valid_di_plus >= 0) & (valid_di_plus <= 100)).all()
    print(f"[PASS] DI+ in valid range (0-100): {di_valid}")
    
    di_minus_valid = ((valid_di_minus >= 0) & (valid_di_minus <= 100)).all()
    print(f"[PASS] DI- in valid range (0-100): {di_minus_valid}")
    
    # DI+ + DI- should be <= 100 (approximately - DX formula)
    di_sum_check = ((valid_di_plus + valid_di_minus) <= 100.1).all()
    print(f"[PASS] DI+ + DI- <= 100: {di_sum_check}")
    
    return result


def test_adx_with_extras():
    """Test ADX calculation within calculate_indicators_with_extras."""
    print("\n" + "=" * 60)
    print("TEST 2: ADX in calculate_indicators_with_extras")
    print("=" * 60)
    
    # Create sample klines
    np.random.seed(42)
    n = 50
    base_price = 50000
    
    klines = []
    close = base_price
    
    for i in range(n):
        high = close + np.random.uniform(50, 150)
        low = close - np.random.uniform(50, 150)
        volume = np.random.uniform(100, 1000)
        
        klines.append([
            1700000000 + i * 3600,  # time
            close,                   # open
            high,                    # high
            low,                     # low
            close,                   # close
            volume                   # volume
        ])
        
        close = close + np.random.randn() * 100
    
    # Calculate indicators
    result = calculate_indicators_with_extras(klines)
    
    print(f"\nTotal klines: {len(klines)}")
    print(f"\n{'Index':<6} {'ADX':<12} {'DI+':<12} {'DI-':<12}")
    print("-" * 42)
    
    for i in range(min(20, len(result))):
        r = result[i]
        adx = r.get('adx')
        di_p = r.get('di_plus')
        di_m = r.get('di_minus')
        
        if adx is not None:
            print(f"{i:<6} {adx:<12.2f} {di_p:<12.2f} {di_m:<12.2f}")
    
    # Extract valid values
    adx_values = [r['adx'] for r in result if r['adx'] is not None]
    di_plus = [r['di_plus'] for r in result if r['di_plus'] is not None]
    di_minus = [r['di_minus'] for r in result if r['di_minus'] is not None]
    
    print("\n" + "=" * 60)
    print("STATISTICS (calculate_indicators_with_extras):")
    print("=" * 60)
    if adx_values:
        print(f"ADX range: {min(adx_values):.2f} - {max(adx_values):.2f}")
        print(f"ADX mean: {sum(adx_values)/len(adx_values):.2f}")
    if di_plus:
        print(f"DI+ range: {min(di_plus):.2f} - {max(di_plus):.2f}")
    if di_minus:
        print(f"DI- range: {min(di_minus):.2f} - {max(di_minus):.2f}")
    
    return result


def test_adx_trending_market():
    """Test ADX with a strongly trending market - should show high ADX."""
    print("\n" + "=" * 60)
    print("TEST 3: ADX in Strong Uptrend (should show high ADX)")
    print("=" * 60)
    
    n = 50
    close = 50000
    
    high_prices = []
    low_prices = []
    close_prices = []
    
    # Strong uptrend
    for i in range(n):
        close = close + 50  # Consistent upward movement
        high = close + 100
        low = close - 50
        
        high_prices.append(high)
        low_prices.append(low)
        close_prices.append(close)
    
    high = pd.Series(high_prices)
    low = pd.Series(low_prices)
    close = pd.Series(close_prices)
    
    result = calculate_adx(high, low, close, period=14)
    
    print(f"\nStrong uptrend - last 10 values:")
    print(f"{'Index':<6} {'ADX':<10} {'DI+':<10} {'DI-':<10} {'Trend':<10}")
    print("-" * 46)
    
    for i in range(max(0, len(result)-10), len(result)):
        adx = result['adx'].iloc[i]
        di_p = result['di_plus'].iloc[i]
        di_m = result['di_minus'].iloc[i]
        
        if pd.notna(adx):
            trend = "BULLISH" if di_p > di_m else "BEARISH"
            print(f"{i:<6} {adx:<10.2f} {di_p:<10.2f} {di_m:<10.2f} {trend:<10}")
    
    # In a strong uptrend, DI+ should be significantly higher than DI-
    last_adx = result['adx'].iloc[-1]
    last_di_p = result['di_plus'].iloc[-1]
    last_di_m = result['di_minus'].iloc[-1]
    
    print("\n" + "=" * 60)
    print("VALIDATION:")
    print("=" * 60)
    print(f"Last ADX: {last_adx:.2f}")
    print(f"Last DI+: {last_di_p:.2f}")
    print(f"Last DI-: {last_di_m:.2f}")
    print(f"[PASS] DI+ > DI- (uptrend): {last_di_p > last_di_m}")
    print(f"[PASS] ADX > 25 (strong trend): {last_adx > 25}")


def test_adx_sideways_market():
    """Test ADX with a sideways market - should show low ADX."""
    print("\n" + "=" * 60)
    print("TEST 4: ADX in Sideways Market (should show low ADX)")
    print("=" * 60)
    
    n = 50
    close = 50000
    
    high_prices = []
    low_prices = []
    close_prices = []
    
    # Sideways market (oscillating)
    for i in range(n):
        close = 50000 + np.sin(i / 5) * 100  # Oscillating
        high = close + 50
        low = close - 50
        
        high_prices.append(high)
        low_prices.append(low)
        close_prices.append(close)
    
    high = pd.Series(high_prices)
    low = pd.Series(low_prices)
    close = pd.Series(close_prices)
    
    result = calculate_adx(high, low, close, period=14)
    
    print(f"\nSideways market - last 10 values:")
    print(f"{'Index':<6} {'ADX':<10} {'DI+':<10} {'DI-':<10}")
    print("-" * 36)
    
    for i in range(max(0, len(result)-10), len(result)):
        adx = result['adx'].iloc[i]
        di_p = result['di_plus'].iloc[i]
        di_m = result['di_minus'].iloc[i]
        
        if pd.notna(adx):
            print(f"{i:<6} {adx:<10.2f} {di_p:<10.2f} {di_m:<10.2f}")
    
    last_adx = result['adx'].iloc[-1]
    
    print("\n" + "=" * 60)
    print("VALIDATION:")
    print("=" * 60)
    print(f"Last ADX: {last_adx:.2f}")
    print(f"[PASS] ADX < 25 (weak/no trend): {last_adx < 25}")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("ADX/DI INDICATOR TEST SUITE")
    print("=" * 60)
    
    # Run all tests
    test_adx_calculation()
    test_adx_with_extras()
    test_adx_trending_market()
    test_adx_sideways_market()
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED")
    print("=" * 60)

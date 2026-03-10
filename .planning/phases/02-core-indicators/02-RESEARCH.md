# Phase 2: Core Indicators - Research

**Researched:** 2026-03-03
**Domain:** Technical Analysis Indicators (MFI, CCI, ADX, DI, Price Channel)
**Confidence:** HIGH

## Summary

Phase 2 implements 4 core momentum/trend indicators with TradingView-style display. Backend (FastAPI) calculates indicators using pandas/numpy, returning OHLCV with indicator values. Frontend uses Lightweight Charts v5 with native pane support for dual indicator panes. Price Channel supports multiple types (pivot, step, linear regression) and multi-timeframe display.

**Primary recommendation:** Use pandas-ta library for indicator calculations (includes all MFI, CCI, ADX) with custom pivot detection for dynamic channels. Lightweight Charts v5 panes API for multi-pane layout.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Two indicator panes below chart:**
   - CCI + MFI combined in one pane
   - ADX + DI in another pane

2. **Price Channel:**
   - Pivot-based dynamic channel
   - Configurable (pivot, step, linear regression)
   - Multi-timeframe support (current TF + user-selected higher TF)
   - Distinct colors for each timeframe

3. **Setup Detection Table:** Top-right overlay showing setup name, ADX/DI/CCI/MFI values with colors

4. **Background Colors:** Chart background tints based on setup (green for uptrend, red for downtrend, etc.)

5. **UI:** Toolbar button to toggle, settings popup with list + period inputs

6. **Calculation:** Backend (FastAPI) calculates indicators

7. **Colors:** CCI blue, MFI yellow, ADX navy, DI+ green, DI- red

### Default Periods (from Phase 1)
- MFI: 14
- CCI: 20
- ADX: 14
- Channel: Configurable (default 20)
- ADX Threshold: 20
- MFI Overbought: 80
- MFI Oversold: 20

### Claude's Discretion
- Exact component structure
- Pivot detection algorithm details
- Line styling (solid/dashed)
- Settings popup exact layout
</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pandas | >=2.0 | Data manipulation, rolling calculations | Industry standard for financial data |
| numpy | >=1.24 | Numerical operations | Required by pandas-ta |
| pandas-ta | >=0.3.14 | Technical indicator library | 70+ indicators, MFI/CCI/ADX included |
| lightweight-charts | ^5.0 | Charting with native pane support | TradingView library, panes API available |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| scipy | >=1.10 | Peak detection for pivots | Finding local maxima/minima |
| pydantic | >=2.0 | Request/response validation | API endpoint types |

**Installation:**
```bash
# Backend
pip install pandas pandas-ta numpy scipy

# Frontend
npm install lightweight-charts@^5.0.0
```

---

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── klines.py        # Existing
│   │   └── indicators.py    # NEW - indicators endpoint
│   ├── services/
│   │   ├── binance.py       # Existing
│   │   └── indicators.py    # NEW - calculation logic
│   └── models/
│       └── indicators.py    # NEW - Pydantic models
frontend/
├── src/
│   ├── components/
│   │   ├── chart/
│   │   │   ├── Chart.tsx          # Main chart with panes
│   │   │   ├── IndicatorPane.tsx # NEW - indicator sub-pane
│   │   │   ├── PriceChannel.tsx  # NEW - channel overlay
│   │   │   └── SetupTable.tsx     # NEW - setup detection overlay
│   │   └── ui/
│   │       └── IndicatorSettings.tsx  # NEW - settings popup
│   ├── hooks/
│   │   └── useIndicators.ts      # NEW - indicator data hook
│   └── stores/
│       └── indicatorStore.ts     # NEW - indicator settings state
```

### Backend API Pattern
```python
# backend/app/api/indicators.py
from fastapi import APIRouter, Query
from typing import Optional
from app.services.indicators import calculate_indicators

router = APIRouter()

@router.get("/indicators")
async def get_indicators(
    symbol: str = Query("BTC/USDT"),
    interval: str = Query("1h"),
    mfi_period: int = Query(14),
    cci_period: int = Query(20),
    adx_period: int = Query(14),
    channel_period: int = Query(20),
    channel_type: str = Query("pivot"),  # pivot, step, linear_regression
    channel_tf: Optional[str] = Query(None),  # Higher TF for MTF
):
    """Calculate MFI, CCI, ADX, DI, and Price Channel."""
    klines = await fetch_klines(symbol, interval, limit=500)
    indicators = calculate_indicators(
        klines,
        mfi_period=mfi_period,
        cci_period=cci_period,
        adx_period=adx_period,
        channel_period=channel_period,
        channel_type=channel_type,
        channel_tf=channel_tf
    )
    return indicators
```

### Indicator Calculation Service Pattern
```python
# backend/app/services/indicators.py
import pandas as pd
import pandas_ta as ta
import numpy as np

def calculate_mfi(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calculate Money Flow Index."""
    # pandas-ta mfi: requires columns 'high', 'low', 'close', 'volume'
    return ta.mfi(df['high'], df['low'], df['close'], df['volume'], length=period)

def calculate_cci(df: pd.DataFrame, period: int = 20) -> pd.Series:
    """Calculate Commodity Channel Index."""
    return ta.cci(df['high'], df['low'], df['close'], length=period)

def calculate_adx(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """Calculate ADX, DI+, DI-."""
    result = ta.adx(df['high'], df['close'], df['low'], length=period)
    return result

def find_pivot_highs(highs: pd.Series, length: int = 5) -> list:
    """Find pivot highs (local maxima)."""
    pivots = []
    for i in range(length, len(highs) - length):
        if highs.iloc[i] == highs.iloc[i-length:i+length+1].max():
            pivots.append(i)
    return pivots

def find_pivot_lows(lows: pd.Series, length: int = 5) -> list:
    """Find pivot lows (local minima)."""
    pivots = []
    for i in range(length, len(lows) - length):
        if lows.iloc[i] == lows.iloc[i-length:i+length+1].min():
            pivots.append(i)
    return pivots
```

### Lightweight Charts Multi-Pane Pattern
```typescript
// frontend/src/components/chart/Chart.tsx
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts';

const chart = createChart(container, {
  layout: { textColor: '#d1d5db', background: { color: '#1f2937' } },
  grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
  panes: {
    separatorColor: '#4b5563',
    separatorHoverColor: '#6b7280',
  },
});

// Main candlestick pane (pane 0)
const candleSeries = chart.addSeries(CandlestickSeries, {
  pane: 0,
});

// CCI+MFI pane (pane 1)
const cciPane = chart.addSeries(LineSeries, {
  pane: 1,
  color: '#2962FF',  // CCI blue
});
const mfiPane = chart.addSeries(LineSeries, {
  pane: 1,
  color: '#FDE832',  // MFI yellow
  topColor: 'rgba(253, 232, 50, 0.2)',
  lineWidth: 1,
});

// ADX+DI pane (pane 2)
const adxPane = chart.addSeries(LineSeries, {
  pane: 2,
  color: '#000080',  // Navy
  lineWidth: 2,
});
const diPlusPane = chart.addSeries(LineSeries, { pane: 2, color: '#22c55e' }); // Green
const diMinusPane = chart.addSeries(LineSeries, { pane: 2, color: '#ef4444' }); // Red

// Set pane heights
chart.panes()[0].setHeight(400);  // Main chart
chart.panes()[1].setHeight(150);  // CCI+MFI
chart.panes()[2].setHeight(150);  // ADX+DI
```

### Setup Detection Logic
```typescript
// Setup detection based on indicator values
type SetupType = 
  | 'Strong Uptrend'
  | 'Strong Downtrend'
  | 'Trend Long'
  | 'Trend Short'
  | 'Oversold Long'
  | 'Overbought Short'
  | 'Rangebound'
  | 'Neutral';

function detectSetup(adx: number, diPlus: number, diMinus: number, 
                      cci: number, mfi: number): SetupType {
  const ADX_THRESHOLD = 20;
  
  if (adx > ADX_THRESHOLD && diPlus > diMinus && cci > 0) {
    return adx > 30 ? 'Strong Uptrend' : 'Trend Long';
  }
  if (adx > ADX_THRESHOLD && diMinus > diPlus && cci < 0) {
    return adx > 30 ? 'Strong Downtrend' : 'Trend Short';
  }
  if (mfi < 20 && cci < -100) return 'Oversold Long';
  if (mfi > 80 && cci > 100) return 'Overbought Short';
  if (adx < ADX_THRESHOLD) return 'Rangebound';
  return 'Neutral';
}
```

### Background Color Logic
```typescript
function getBackgroundColor(setup: SetupType): string {
  switch (setup) {
    case 'Strong Uptrend': return 'rgba(34, 197, 94, 0.05)';   // Green tint
    case 'Strong Downtrend': return 'rgba(239, 68, 68, 0.05)';  // Red tint
    case 'Trend Long': return 'rgba(74, 222, 128, 0.03)';       // Light green
    case 'Trend Short': return 'rgba(251, 146, 60, 0.03)';      // Light orange
    case 'Oversold Long': return 'rgba(34, 211, 238, 0.03)';    // Light aqua
    case 'Overbought Short': return 'rgba(232, 121, 249, 0.03)'; // Light fuchsia
    default: return 'transparent';
  }
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MFI calculation | Custom implementation | pandas-ta `mfi()` | Handles edge cases, NaN values, period validation |
| CCI calculation | Custom formula | pandas-ta `cci()` | Includes proper mean deviation calculation |
| ADX/DI calculation | Manual smoothing | pandas-ta `adx()` | Wilder's smoothing correctly implemented |
| ATR-based pivots | Custom zigzag | scipy `find_peaks` | Robust peak detection with prominence |

**Key insight:** pandas-ta is battle-tested across millions of backtests. Custom implementations often fail on edge cases (all equal prices, zero volume, single candle sequences).

---

## Common Pitfalls

### Pitfall 1: Pandas Column Name Mismatch
**What goes wrong:** pandas-ta expects specific column names ('close', 'high', 'low', 'volume')
**Why it happens:** Binance returns different casing or column names
**How to avoid:** Normalize column names to lowercase before calculation
**Warning signs:** `KeyError: 'close'`, all NaN values returned

### Pitfall 2: Lightweight Charts v4 Pane API
**What goes wrong:** Panes API only available from v5.0.0+
**Why it happens:** Installing `lightweight-charts@latest` may get v4
**How to avoid:** Explicitly specify `^5.0.0` in package.json
**Warning signs:** `pane` option not recognized, runtime errors

### Pitfall 3: Indicator Scale Conflicts
**What goes wrong:** MFI (-100 to 100) doesn't align with CCI (-200 to +200 typically)
**Why it happens:** Different indicators have different natural ranges
**How to avoid:** Use separate panes OR implement scale shifting for combined display
**Warning signs:** One indicator invisible, squished to edge

### Pitfall 4: Pivot Repainting
**What goes wrong:** Latest pivot changes as new data arrives
**Why it happens:** Pivot detection needs confirmation bars
**How to avoid:** Only render confirmed pivots (require N bars after pivot)
**Warning signs:** Channel lines jump around on live data

### Pitfall 5: MTF Data Alignment
**What goes wrong:** Higher TF candles don't align with current TF
**Why it happens:** Different start times, weekend gaps
**How to avoid:** Floor/cemap current time to higher TF candle boundary
**Warning signs:** Channel appears offset, wrong price levels

---

## Code Examples

### Complete Indicator Calculation (Backend)
```python
# Source: pandas-ta library + custom pivot logic
import pandas as pd
import pandas_ta as ta
import numpy as np

def calculate_indicators(
    klines: list,
    mfi_period: int = 14,
    cci_period: int = 20,
    adx_period: int = 14,
    channel_period: int = 20,
    channel_type: str = "pivot",
    channel_tf: str = None
) -> dict:
    """Calculate all indicators from klines data."""
    
    # Convert to DataFrame
    df = pd.DataFrame(klines, columns=[
        'time', 'open', 'high', 'low', 'close', 'volume'
    ])
    
    # Ensure numeric types
    for col in ['open', 'high', 'low', 'close', 'volume']:
        df[col] = pd.to_numeric(df[col])
    
    # Calculate MFI
    df['mfi'] = ta.mfi(
        df['high'], df['low'], df['close'], df['volume'], 
        length=mfi_period
    )
    
    # Calculate CCI
    df['cci'] = ta.cci(
        df['high'], df['low'], df['close'], 
        length=cci_period
    )
    
    # Calculate ADX, DI+, DI-
    adx_result = ta.adx(
        df['high'], df['close'], df['low'], 
        length=adx_period
    )
    df['adx'] = adx_result['ADX_14']
    df['di_plus'] = adx_result['DMP_14']
    df['di_minus'] = adx_result['DMN_14']
    
    # Calculate Price Channel based on type
    if channel_type == "pivot":
        df['channel_upper'], df['channel_lower'] = calculate_pivot_channel(
            df['high'], df['low'], channel_period
        )
    elif channel_type == "donchian":
        df['channel_upper'] = df['close'].rolling(channel_period).max()
        df['channel_lower'] = df['close'].rolling(channel_period).min()
    elif channel_type == "linear_regression":
        df['channel_upper'], df['channel_lower'] = calculate_lr_channel(
            df['close'], channel_period
        )
    
    return df.to_dict(orient='records')


def calculate_pivot_channel(highs, lows, lookback: int = 20):
    """Calculate pivot-based dynamic channel."""
    upper = highs.rolling(lookback).max().shift(1)
    lower = lows.rolling(lookback).min().shift(1)
    return upper, lower
```

### Multi-Timeframe Price Channel
```python
async def calculate_mtf_channel(symbol: str, interval: str, 
                                  higher_tf: str, period: int) -> dict:
    """Calculate channel from higher timeframe."""
    # Fetch higher TF data
    higher_klines = await fetch_klines(symbol, higher_tf, limit=100)
    df = pd.DataFrame(higher_klines, columns=[
        'time', 'open', 'high', 'low', 'close', 'volume'
    ])
    
    # Calculate channel on higher TF
    df['channel_upper'] = df['high'].rolling(period).max().shift(1)
    df['channel_lower'] = df['low'].rolling(period).min().shift(1)
    
    return df[['time', 'channel_upper', 'channel_lower']].to_dict(orient='records')
```

### Setup Detection (Frontend)
```typescript
// Source: CONTEXT.md requirements
interface SetupState {
  name: string;
  adx: { value: number; color: string };
  diPlus: { value: number; color: string };
  diMinus: { value: number; color: string };
  cci: { value: number; color: string };
  mfi: { value: number; color: string };
}

function computeSetup(data: IndicatorData): SetupState {
  const ADX_THRESHOLD = 20;
  const adx = data.adx;
  const diPlus = data.di_plus;
  const diMinus = data.di_minus;
  const cci = data.cci;
  const mfi = data.mfi;
  
  // Determine setup name
  let name: string;
  if (adx > ADX_THRESHOLD) {
    if (diPlus > diMinus && cci > 0) {
      name = adx > 30 ? 'Strong Uptrend' : 'Trend Long';
    } else if (diMinus > diPlus && cci < 0) {
      name = adx > 30 ? 'Strong Downtrend' : 'Trend Short';
    } else {
      name = 'Neutral';
    }
  } else if (mfi < 20 && cci < -100) {
    name = 'Oversold Long';
  } else if (mfi > 80 && cci > 100) {
    name = 'Overbought Short';
  } else {
    name = 'Rangebound';
  }
  
  return {
    name,
    adx: { value: adx, color: adx > ADX_THRESHOLD ? '#22c55e' : '#9ca3af' },
    diPlus: { value: diPlus, color: '#22c55e' },
    diMinus: { value: diMinus, color: '#ef4444' },
    cci: { value: cci, color: cci > 100 ? '#ef4444' : cci < -100 ? '#22c55e' : '#2962FF' },
    mfi: { value: mfi, color: mfi > 80 ? '#ef4444' : mfi < 20 ? '#22c55e' : '#FDE832' },
  };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TA-Lib (C extension) | pandas-ta (pure Python) | 2020+ | Easier install, pandas native |
| Manual indicator formulas | Library implementations | 2019+ | Battle-tested, fewer bugs |
| Single chart + overlay | Native panes API | Lightweight Charts v5 (2023) | True TradingView layout |
| Client-side calculation | Server-side calculation | This phase | Consistent results, less client CPU |

**Deprecated/outdated:**
- TA-Lib: Requires C compilation, hard to install on some systems
- Client-side indicators: Inconsistent results, CPU intensive
- Fixed Donchian channels: Dynamic pivot channels more adaptive

---

## Open Questions

1. **How many historical candles needed?**
   - What we know: Need at least `max_period * 2` for reliable indicators
   - What's unclear: Optimal buffer for live trading vs backtesting
   - Recommendation: Fetch 500 candles, use last 200 for display

2. **Pivot lookback period defaults?**
   - What we know: User wants configurable, default 20
   - What's unclear: How to auto-tune based on volatility
   - Recommendation: Start with 20, allow user adjustment

3. **Background color implementation?**
   - What we know: Lightweight Charts supports pane backgrounds
   - What's unclear: Main chart pane vs full chart area
   - Recommendation: Use chart background color, update on setup change

---

## Validation Architecture

> Skipped - workflow.nyquist_validation is not enabled in config

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-IND-01 | MFI indicator with 14-period default | pandas-ta mfi() implementation documented |
| REQ-IND-02 | CCI indicator with 20-period default | pandas-ta cci() implementation documented |
| REQ-IND-03 | ADX indicator with 14-period default | pandas-ta adx() returns ADX, DI+, DI- |
| REQ-IND-04 | Price Channel (pivot-based) | Custom pivot detection + rolling max/min |
| REQ-IND-05 | Multi-timeframe channel | MTF endpoint design with higher_tf param |
| REQ-IND-06 | CCI+MFI combined pane | Lightweight Charts pane API with multi-series |
| REQ-IND-07 | ADX+DI combined pane | Second pane with 3 line series |
| REQ-IND-08 | Setup detection table | Setup detection logic with color mapping |
| REQ-IND-09 | Background tints | Dynamic background color based on setup |
| REQ-IND-10 | Indicator settings UI | Toolbar button + period inputs per indicator |

---

## Sources

### Primary (HIGH confidence)
- pandas-ta GitHub - MFI/CCI/ADX implementation
  - https://github.com/twopirllc/pandas-ta
- Lightweight Charts v5 Pane Tutorial
  - https://tradingview.github.io/lightweight-charts/tutorials/how_to/panes
- Stock Indicators Python - MFI/CCI/ADX formulas
  - https://python.stockindicators.dev/

### Secondary (MEDIUM confidence)
- CodeRivers - ADX Python calculation guide
  - https://coderivers.org/blog/python-adx-calculation/
- Medium - MFI/CCI calculation tutorials
  - https://medium.com/@huzaifazahoor654

### Tertiary (LOW confidence)
- Community discussions on pivot detection
  - https://stackoverflow.com/questions/76333454/

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - pandas-ta is well-documented, Lightweight Charts v5 has panes
- Architecture: HIGH - Follows existing backend/frontend patterns
- Pitfalls: MEDIUM - Identified common issues, but some edge cases may surface during implementation

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days - stable libraries)

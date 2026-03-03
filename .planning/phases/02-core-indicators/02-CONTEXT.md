# Phase 2: Core Indicators - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement MFI, CCI, ADX, DI, and Price Channel indicators with TradingView-style display. Two separate indicator panes below the chart: one for CCI+MFI, one for ADX+DI. Price Channel overlaid on main chart as dynamic channel lines.

</domain>

<decisions>
## Implementation Decisions

### Indicator Panes
- **CCI + MFI Pane**: Combined in one pane below chart (per user's first Pine Script)
  - CCI: Line with +/-100 bands, blue background fill
  - MFI: Line (yellow) scaled to -100/+100 range, overbought/oversold backgrounds
  - Optional smoothing MA with Bollinger Bands
- **ADX + DI Pane**: Separate pane below chart (per user's second Pine Script)
  - ADX: Navy line (linewidth 2)
  - DI+: Green line
  - DI-: Red line

### Setup Detection Table
- Top-right overlay showing:
  - Current setup name (Strong Uptrend, Strong Downtrend, Trend Long, Trend Short, Oversold Long, Overbought Short, Rangebound, Neutral)
  - ADX value with color (green if > threshold)
  - DI+ value
  - DI- value
  - CCI value with color
  - MFI value with color

### Background Colors
- Chart background subtly changes based on setup:
  - Strong Uptrend: green tint
  - Strong Downtrend: red tint
  - Trend Long: light green
  - Trend Short: light orange
  - Oversold Long: light aqua
  - Overbought Short: light fuchsia
  - Rangebound/Neutral: no tint

### Price Channel (Dynamic)
- **Type**: Pivot-based (connects significant pivot highs/lows)
- **Configurable**: Make all channel types available (pivot, step, linear regression)
- **Multi-timeframe**: Show channels from multiple timeframes
  - Both current TF and user-selected higher TF channels visible
  - Each timeframe with distinct colors (user can differentiate)
  - User selects which higher timeframe to display
- **Default**: Pivot-based, user can switch to other types

### UI/UX
- **Toggle**: Toolbar button opens indicator settings panel
- **Settings Popup**: List of indicators with toggles and period inputs
- **Colors**: Use Pine Script colors
  - CCI: Blue (#2962FF)
  - MFI: Yellow (#FDE832)
  - ADX: Navy
  - DI+: Green
  - DI-: Red

### Calculation
- **Location**: Backend (FastAPI) calculates all indicators
- **Returns**: Indicator data with OHLCV

### Default Periods (from Phase 1 CONTEXT.md)
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

</decisions>

<specifics>
## Specific Ideas

User provided two Pine Scripts as reference:
1. CCI + MFI Combined (first script)
2. ADX + DI + CCI + MFI Combined (second script)

Display patterns from scripts:
- CCI: Line with background fill between +100/-100
- MFI: Line scaled -100/+100, background red when overbought, green when oversold
- ADX/DI: Lines with threshold line
- Setup detection with color-coded table

Price Channel: Dynamic, pivot-based like human would draw, with MTF support

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Zustand store (chartStore.ts): CandleData interface with OHLCV
- FastAPI backend: /api/klines endpoint
- Lightweight Charts: Used for candlestick display
- Existing UI components: Card, Button, Select, Toggle

### Established Patterns
- REST API between frontend and backend
- Zustand for state management
- Tailwind CSS for styling
- Component-based architecture

### Integration Points
- Backend: Add new endpoint for indicators (/api/indicators)
- Frontend: Add indicator panes below chart
- Lightweight Charts: Use createChart with additional series
- Settings: Connect to existing chartStore for theme

</code_context>

<deferred>
## Deferred Ideas

- Support/Resistance level detection (Phase 3)
- Fair Value Gap identification (Phase 3)
- Signal generation (Phase 4)
- Alert system for threshold crossings

</deferred>

---

*Phase: 02-core-indicators*
*Context gathered: 2026-03-03*

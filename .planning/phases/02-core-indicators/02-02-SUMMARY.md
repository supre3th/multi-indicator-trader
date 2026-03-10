---
phase: 02-core-indicators
plan: "02"
subsystem: frontend
tags: [indicators, frontend, chart, cci, mfi, adx, di]
dependency_graph:
  requires:
    - Phase 1 (foundation)
    - Plan 02-01 (backend indicators)
  provides:
    - frontend/src/stores/indicatorStore.ts
    - frontend/src/components/Chart.tsx (indicator panes)
tech_stack:
  added:
    - Indicator data types
    - Zustand store for indicator state
  patterns:
    - Lightweight Charts v5 panes API
    - Line series with LOCKED colors
key_files:
  created:
    - frontend/src/stores/indicatorStore.ts
  modified:
    - frontend/src/lib/api.ts
    - frontend/src/components/Chart.tsx
decisions:
  - Used Lightweight Charts v5 panes API with third parameter for pane index
  - Used layout.panes for separator color configuration
---

# Phase 02 Plan 02: Frontend Indicator Panes Summary

## Objective

Implement indicator panes in frontend - CCI+MFI combined pane and ADX+DI combined pane below the main chart.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create indicator Zustand store | e8a3d56 | stores/indicatorStore.ts |
| 2 | Add fetchIndicators API | c0bef3a | lib/api.ts |
| 3 | Integrate indicator panes | a82f25e | components/Chart.tsx |

## Key Implementation Details

### Indicator Store (indicatorStore.ts)
- **IndicatorData interface**: Includes time, OHLCV, and indicator values (mfi, cci, adx, di_plus, di_minus, channel_*)
- **IndicatorState**: Settings (periods, show/hide toggles) + data storage
- **Default periods (LOCKED)**: MFI=14, CCI=20, ADX=14

### API Function (api.ts)
- **fetchIndicators**: Accepts symbol, interval, and options for all indicator periods
- **IndicatorsResponse**: Returns data array with indicator values + optional MTF channel

### Chart Component (Chart.tsx)
- **Pane 1 (CCI+MFI)**: LineSeries with CCI blue (#2962FF), MFI yellow (#FDE832)
- **Pane 2 (ADX+DI)**: LineSeries with ADX navy (#000080), DI+ green (#22c55e), DI- red (#ef4444)
- **Pane heights**: Main chart 400px, indicator panes 150px each

### Colors (LOCKED from CONTEXT.md)
| Indicator | Color | Hex |
|-----------|-------|-----|
| CCI | Blue | #2962FF |
| MFI | Yellow | #FDE832 |
| ADX | Navy | #000080 |
| DI+ | Green | #22c55e |
| DI- | Red | #ef4444 |

## Deviations from Plan

### Rule 1 - Auto-fix: Lightweight Charts v5 API
- **Issue**: Initial implementation used incorrect API for panes
- **Fix**: 
  1. Moved `panes` option inside `layout` object (not root level)
  2. Used third parameter for pane index instead of `pane` property in addSeries()
  3. Removed invalid `rightPriceScale` from series options
- **Files modified**: frontend/src/components/Chart.tsx
- **Commit**: a82f25e

## Verification

- [x] indicatorStore.ts exists with settings and data
- [x] fetchIndicators function exists in api.ts
- [x] Chart has two panes below: CCI+MFI pane 1, ADX+DI pane 2
- [x] Colors match locked values
- [x] Build passes (npm run build)
- [x] All 3 tasks committed individually

## Metrics

| Metric | Value |
|--------|-------|
| Duration | ~15 minutes |
| Files created | 1 |
| Files modified | 2 |
| Commits | 3 |
| Requirements covered | REQ-IND-06, REQ-IND-07 |

## Self-Check

- [x] frontend/src/stores/indicatorStore.ts exists
- [x] frontend/src/lib/api.ts contains fetchIndicators
- [x] frontend/src/components/Chart.tsx has indicator panes
- [x] Commits e8a3d56, c0bef3a, a82f25e exist

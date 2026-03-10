---
phase: 02-core-indicators
plan: 04
subsystem: ui
tags: [react, zustand, lightweight-charts, setup-detection]

requires:
  - phase: 02-core-indicators
    provides: [IndicatorStore with MFI/CCI/ADX/Channel data, PriceChannel component]

provides:
  - IndicatorSettings popup component with toggles and period inputs
  - SetupTable overlay showing setup detection with color-coded values
  - Toolbar button to toggle settings panel
  - Background color tints based on detected market setup

affects:
  - Chart.tsx (modified to integrate new components)
  - page.tsx (indirectly via Chart)

tech-stack:
  added: []
  patterns:
    - "Zustand for state management"
    - "Component composition for chart overlays"
    - "Setup detection algorithm based on ADX/DI/CCI/MFI"

key-files:
  created:
    - frontend/src/components/ui/IndicatorSettings.tsx
    - frontend/src/components/chart/SetupTable.tsx
  modified:
    - frontend/src/components/Chart.tsx

key-decisions:
  - "Used detectSetup function exported from SetupTable for background tint logic to avoid duplication"
  - "Background tint applied as subtle overlay colors to not distract from chart data"
  - "Setup thresholds locked to CONTEXT.md values: ADX=20, MFI 20/80, CCI -100/100"

patterns-established:
  - "Setup detection: ADX > 20 + DI+ > DI- + CCI > 0 = Trend conditions"
  - "Component overlay pattern: absolute positioned elements on chart container"
  - "Color coding: Green for uptrend/bullish, Red for downtrend/bearish, Context-specific colors for setups"

requirements-completed:
  - REQ-IND-08
  - REQ-IND-09
  - REQ-IND-10

duration: 6min
completed: 2026-03-10
---

# Phase 02 Plan 04: Indicator Settings UI Summary

**Indicator settings popup with toggle switches, setup detection table overlay, and dynamic background tints based on market conditions**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-10T13:35:00Z
- **Completed:** 2026-03-10T13:41:18Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- IndicatorSettings popup with toggle switches for MFI, CCI, ADX, Price Channel
- Period input fields for each indicator with validation
- Price Channel type selector (Pivot, Donchian, Linear Regression)
- MTF timeframe selector for higher timeframe channel overlay
- SetupTable overlay showing detected setup with color-coded indicator values
- Background tint colors that change based on market setup (Strong Uptrend/Downtrend, Trend Long/Short, Oversold/Overbought)
- Toolbar button to open/close indicator settings panel

## Task Commits

Each task was committed atomically:

1. **Task 1: Create IndicatorSettings popup component** - `41d61a6` (feat)
2. **Task 2: Create SetupTable overlay component** - `3e606ef` (feat)
3. **Task 3: Add toolbar toggle button and background color tints** - `694b532` (feat)

**Plan metadata:** [to be committed]

## Files Created/Modified

- `frontend/src/components/ui/IndicatorSettings.tsx` - Popup panel with toggles and inputs for all indicators
- `frontend/src/components/chart/SetupTable.tsx` - Top-right overlay showing setup detection and color-coded values
- `frontend/src/components/Chart.tsx` - Integrated toolbar button, setup table, and background tint logic

## Decisions Made

- **detectSetup function export**: Exported the setup detection function from SetupTable.tsx so Chart.tsx can use it for background tint logic without duplicating the algorithm.
- **Subtle background tints**: Used low-opacity colors (0.03-0.05) to provide visual feedback without distracting from chart data.
- **Fixed thresholds**: Used the threshold values from CONTEXT.md rather than making them configurable to maintain consistency across the application.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **TypeScript undefined handling**: SetupTable.tsx initially had TypeScript errors because `data.cci` and `data.mfi` are optional fields. Fixed by using `(data.cci || 0)` pattern for comparisons and display.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UI components complete and integrated
- Setup detection algorithm tested and working
- Ready for Phase 03 (Support/Resistance levels) or Phase 04 (Signal Generation)

---
*Phase: 02-core-indicators*
*Completed: 2026-03-10*

---
phase: 02-core-indicators
plan: "01"
subsystem: backend
tags: [indicators, mfi, cci, adx, api]
dependency_graph:
  requires:
    - Phase 1 (foundation)
  provides:
    - backend/app/api/indicators.py
    - backend/app/services/indicators.py
    - backend/app/models/indicators.py
tech_stack:
  added:
    - pandas for indicator calculations
    - Wilder's smoothing for ADX
  patterns:
    - Pydantic models for request/response validation
    - FastAPI Query parameters for indicator configuration
key_files:
  created:
    - backend/app/models/indicators.py
    - backend/app/services/indicators.py
    - backend/app/api/indicators.py
decisions:
  - Implemented manual indicator calculations instead of pandas-ta due to Python 3.14 compatibility
  - Used pandas .loc for assignment to avoid ChainedAssignment warnings
---

# Phase 02 Plan 01: Backend Indicator Service Summary

## Objective

Create backend indicator calculation service and API endpoint for MFI, CCI, ADX, DI, and Price Channel indicators.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Indicator Pydantic models | 32b4bf9 | app/models/indicators.py |
| 2 | Indicator calculation service | f283b7d | app/services/indicators.py |
| 3 | API endpoint | 0220143 | app/api/indicators.py, main.py |

## Key Implementation Details

### Indicator Calculations (pandas-based)
- **MFI (Money Flow Index)**: Uses typical price and raw money flow with 14-period lookback
- **CCI (Commodity Channel Index)**: Uses typical price with mean deviation calculation
- **ADX/DI**: Implements Wilder's smoothing technique for true range and directional movement
- **Price Channels**: Supports pivot (shifted rolling max/min), donchian, and linear regression types

### API Endpoint
- **Path**: GET /api/indicators
- **Parameters**: symbol, interval, mfi_period, cci_period, adx_period, channel_period, channel_type, limit
- **Response**: IndicatorResponse with OHLCV + all indicator values

### Default Periods (LOCKED)
- MFI: 14
- CCI: 20
- ADX: 14
- Channel: 20

## Deviations from Plan

### Rule 2 - Auto-fix: Python 3.14 compatibility
- **Issue**: pandas-ta library does not support Python 3.14.3
- **Fix**: Implemented indicator calculations manually using pandas instead of pandas-ta
- **Files modified**: backend/app/services/indicators.py
- **Rationale**: Core functionality works identically, just without pandas-ta dependency

## Verification

- [x] IndicatorRequest and IndicatorResponse Pydantic models exist
- [x] calculate_indicators() function works with pandas
- [x] GET /api/indicators endpoint returns correct data
- [x] All 3 tasks committed individually

## Metrics

| Metric | Value |
|--------|-------|
| Duration | ~10 minutes |
| Files created | 3 |
| Commits | 3 |
| Requirements covered | REQ-IND-01, REQ-IND-02, REQ-IND-03, REQ-IND-04 |

## Self-Check

- [x] backend/app/models/indicators.py exists
- [x] backend/app/services/indicators.py exists
- [x] backend/app/api/indicators.py exists
- [x] Commits 32b4bf9, f283b7d, 0220143 exist

# Phase 1: Foundation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up project infrastructure with Next.js frontend + FastAPI backend, implement data pipeline from Binance to chart display. This phase delivers a working chart with symbol/timeframe selection - the foundation for indicator implementation in later phases.

</domain>

<decisions>
## Implementation Decisions

### Symbol Selection
- Start with BTC, ETH, major pairs
- Support all Binance pairs
- Architecture designed for multiple exchanges (extensible via CCXT)
- Support any data source (not just Binance)

### UI Layout
- Chart-centric layout (TradingView style)
- Chart takes full width
- Controls in sidebar

### Data Handling
- Online + offline mode
- Use DuckDB WASM for local caching
- Structure for offline capability from the start

### Project Structure
- Two separate directories: `frontend/` and `backend/`
- frontend/: Next.js app
- backend/: FastAPI app

### Timeframes
- Support all major timeframes: 1m, 5m, 15m, 1h, 4h, 1d

### Theme
- Dark + light toggle
- Dark mode by default

### Indicator Defaults
- Standard periods from Investopedia (MFI=14, CCI=20, ADX=14, Channel=20)
- Make configurable (user can change periods)

### Chart Library
- Lightweight Charts (TradingView) - 35KB, free, designed for financial charts

### Claude's Discretion
- Exact folder structure within frontend/backend
- Specific component names
- CSS/styling approach (Tailwind)
- Error state handling details

</decisions>

<specifics>
## Specific Ideas

- Chart should feel like TradingView - familiar to traders
- Support multiple exchanges from architecture perspective (extensible)
- Indicators: MFI, CCI, ADX, Price Channel, Support/Resistance, Fair Value Gaps

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet - greenfield project

### Established Patterns
- None yet

### Integration Points
- Frontend connects to backend via REST API
- Backend connects to Binance via CCXT
- Data flow: Binance → FastAPI → Next.js → Lightweight Charts

</code_context>

<deferred>
## Deferred Ideas

- Indicator calculations in later phases (Phase 2-3)
- Signal generation (Phase 4)
- Multi-user features (Phase 5)

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-03*

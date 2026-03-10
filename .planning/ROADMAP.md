# Roadmap

**Project:** Trading Indicator System
**Version:** 1.0
**Created:** 2026-03-03

## Phase Overview

| Phase | Name | Goal |
|-------|------|------|
| 1 | Foundation | Setup project, data pipeline, basic chart |
| 2 | Core Indicators | Implement MFI, CCI, ADX, Price Channel |
| 3 | Advanced Indicators | S/R detection, Fair Value Gaps |
| 4 | Signal System | Combine indicators into trading signals |
| 5 | Multi-User | User accounts, watchlists, settings |

---

## Phase 1: Foundation

**Goal:** Project setup, data fetching, basic chart display

**Status:** Complete (Plan 03/03 complete)

**Requirements addressed:**
- [x] Project setup (frontend + backend)
- [x] Binance API integration
- [x] Candlestick chart display
- [x] Symbol/timeframe selection
- [x] Dark/light theme toggle

---

## Phase 2: Core Indicators

**Goal:** Implement the 4 momentum/trend indicators

**Status:** Complete (04/04 plans complete)

**Requirements addressed:**
- [x] MFI (Money Flow Index)
- [x] CCI (Commodity Channel Index)
- [x] ADX (Average Directional Index)
- [x] Price Channel (dynamic pivot-based with MTF)
- [x] Setup detection table with background tints

**Plans:**
- [x] 02-01-PLAN.md — Backend indicator calculations (MFI, CCI, ADX, DI)
- [x] 02-02-PLAN.md — Frontend indicator panes (CCI+MFI, ADX+DI panes)
- [x] 02-03-PLAN.md — Price Channel + MTF support
- [x] 02-04-PLAN.md — Settings UI + Setup Table overlay

---

## Phase 3: Advanced Indicators

**Goal:** S/R detection and Fair Value Gaps

**Requirements addressed:**
- [ ] Support/Resistance level detection
- [ ] Fair Value Gap identification

---

## Phase 4: Signal System

**Goal:** Combine indicators into unified signals

**Requirements addressed:**
- [ ] Multi-indicator confluence
- [ ] Signal visualization on chart
- [ ] Signal history

---

## Phase 5: Multi-User

**Goal:** User accounts and personalization

**Requirements addressed:**
- [ ] User authentication
- [ ] Watchlists
- [ ] Indicator settings persistence

---

*Last updated: 2026-03-10 (Phase 02 complete - 4/4 plans)*

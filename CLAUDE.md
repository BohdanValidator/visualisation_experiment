# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands must be run from within the `my-data-dashboard/` directory:

```bash
cd my-data-dashboard

npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check (tsc -b) then build to dist/
npm run lint      # Run ESLint
npm run preview   # Preview the production build locally
```

There is no test suite configured.

## Architecture

This is a single-page React + TypeScript + Vite dashboard app. **All logic lives in one file: `my-data-dashboard/src/App.tsx` (~1668 lines).**

### Data Flow

```
public/data.json (16MB)
    ↓  fetched on mount via useEffect
buildBrands()  ← aggregates raw rows into per-brand summaries
    ↓
State: rows, brands, brand, tab, selCreative
    ↓
Render: Header → TabBar → Tab Content
```

The dataset (`public/data.json`, sourced from `DF/Dataflow Share of Content - Telecom.xlsx`) is a static file with creative/brand advertising data. It is loaded entirely into memory — no pagination or lazy loading.

### State & Navigation

Tab state (`"overview" | "cep" | "creatives" | "detail"`) drives which view renders. There is no router. Brand selection filters all derived metrics.

Key types defined in App.tsx:
- `Row` — raw dataset record
- `Brand` — aggregated stats per brand (built by `buildBrands()`)
- `CepStat` — Category Entry Point metrics
- `Feature` — creative feature metrics

### UI

All components are defined inline in App.tsx (no separate component files):
- `KpiCard`, `FBar`, `Card`, `SectionLabel`, `CepTag`, `Tip` (custom chart tooltip)

Styling is entirely inline (`CSSProperties`) plus a `<style>` block injected into App.tsx. There are no CSS modules, Tailwind, or external stylesheet beyond `index.css`/`App.css`.

Charts use **Recharts** (bar charts on Overview tab, radar chart on CEP tab).

### Dependencies

| Package | Role |
|---|---|
| `recharts` | Bar and radar charts |
| `lucide-react` | Icons |
| `clsx` | Conditional classnames |
| `papaparse` | CSV parsing (imported but data is served as JSON) |

### Vite Config Note

`vite.config.ts` has explicit aliases pinning `react` and `react-dom` to the local `node_modules` — this was added to fix dependency resolution issues and should not be removed.

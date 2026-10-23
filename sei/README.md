# Smart Energy Intelligence Platform

Big Data Engineering graduation project: a Next.js dashboard for smart-meter analytics.
**All data shown is simulated.** The target pipeline is
`Python generator → Kafka → Spark → MinIO (Parquet/Iceberg) → Snowflake → backend API → this dashboard`
(Airflow optional for orchestration). Only the dashboard is in this repository; the other
components are not connected to it yet (see `/system` in the app).

## Run locally

Requires Node.js 20+ and pnpm (the repo pins pnpm in `package.json`).

```bash
pnpm install
cp .env.example .env.local   # optional; defaults work
pnpm dev                     # http://localhost:3000
pnpm typecheck               # TypeScript check
pnpm build && pnpm start     # production build
```

## Demo login

Authentication is a **placeholder**: any valid email plus a password of 8+ characters signs in
for the selected role (customer, analyst, admin). Nothing is verified or sent to a server; the
session is kept in `sessionStorage`. Role-based navigation is cosmetic, not a security boundary.

## Pages

| Route | Purpose |
|---|---|
| `/login` | Demo sign-in |
| `/dashboard` | KPIs (energy, avg power, peak, meters, active anomalies), trends |
| `/consumption` | Time series, comparisons by location and meter, peak/summary, CSV export |
| `/grid` | Transformer loading, voltage by region, overload and voltage-drop alerts |
| `/anomalies` | Filterable anomaly list (date, location, severity, type, status, source) with CSV export |
| `/reports` | Summary tables, charts, CSV exports, report catalog |
| `/system` | Pipeline architecture, runtime config, sample record schema, proposed API |
| `/my-usage` | Customer role: own meter usage |
| `/admin` | Admin role: sample users and permission matrix (read-only) |

## Data layer

UI → `hooks/use-platform-data.ts` → `lib/api/energy-service.ts` → either `lib/mock-data/`
(default) or the backend via `lib/api/http-client.ts`. Switch with
`NEXT_PUBLIC_DATA_SOURCE=mock|api`. The backend contract is **proposed, not implemented**:
see `docs/API_CONTRACT.md`. Never put Snowflake or other secrets in `NEXT_PUBLIC_*` variables.

## Simulated vs. detected anomalies

Every alert has an `origin`. The bundled generator labels all alerts `simulated`; `detected`
is reserved for alerts written by a real Spark detection job and served by the backend. The
anomalies page shows both counts and lets you filter by source.

## Known limitations

- No backend, real auth, or database is included. Alert status changes are kept in memory.
- Grid alerts on `/grid` are derived in the browser from thresholds on simulated data.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` (inherited from v0). Run
  `pnpm typecheck`, fix anything it reports, then remove that flag.
- Power BI reports are placeholders; none are published.

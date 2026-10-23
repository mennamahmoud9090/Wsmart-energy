# Backend API contract (PROPOSED — nothing here is implemented)

The repository contains **no backend**. The front end calls these endpoints only when
`NEXT_PUBLIC_DATA_SOURCE=api` and `NEXT_PUBLIC_API_BASE_URL` is set. Until then it uses
simulated data from `lib/mock-data/`. Request/response shapes are the TypeScript types in
`lib/types.ts` (snake_case, mirroring warehouse columns). Paths live in `lib/api/endpoints.ts`.

| Status | Method | Path | Query | Response type |
|---|---|---|---|---|
| Proposed | GET | `/v1/dashboard/summary` | `range`, `region`, `meterType` | `DashboardData` |
| Proposed | GET | `/v1/consumption/timeseries` | `granularity`, `periods`, `region`, `meterId` | `ConsumptionData` |
| Proposed | GET | `/v1/consumption/meters` | `granularity`, `periods` | `MeterComparisonRow[]` |
| Proposed | GET | `/v1/grid/transformers` | `region`, `range` | `GridData` |
| Proposed | GET | `/v1/anomalies/alerts` | `region`, `range` | `Alert[]` (each with `origin`: `simulated` or `detected`) |
| Proposed | PATCH | `/v1/anomalies/alerts/{id}/status` | body `{status}` | `Alert` |
| Proposed | GET | `/v1/reports` | – | `ReportDefinition[]` |
| Proposed | GET | `/v1/customers/me/usage` | – | `CustomerUsage` |
| Proposed | GET | `/v1/admin/users` | – | `PlatformUser[]` |
| Proposed | POST | `/v1/auth/login`, `/v1/auth/logout`; GET `/v1/auth/session` | – | session cookie (HttpOnly) |

Note: the login and session calls are listed in `endpoints.ts` but the UI does not call them yet;
login is currently demo-only (`lib/auth/demo-auth.ts`).

## Suggested structure (FastAPI)

```
backend/
  app/main.py            # FastAPI app, CORS for the front-end origin, cookie sessions
  app/routers/           # dashboard.py, consumption.py, grid.py, anomalies.py, reports.py, auth.py
  app/schemas.py         # Pydantic models mirroring lib/types.ts
  app/warehouse.py       # Snowflake connector; credentials from server-side env vars only
```

Rules:
- Snowflake credentials stay in the backend environment. The browser never connects to Snowflake.
- Use a read-only Snowflake role for the API, parameterised queries, and short result caching.
- Enforce authorization on every request (the front-end role gating is cosmetic).
- Serve `Alert.origin = "detected"` only for rows written by the real Spark detection job.
- CORS: allow only the front-end origin, with credentials, for the cookie session.

## Suggested warehouse mapping (to be designed)

| Endpoint | Likely source |
|---|---|
| dashboard / consumption | 15-minute and daily aggregate tables (`energy_kwh`, `active_power_kw`) |
| grid | transformer dimension + loading/voltage aggregates |
| anomalies | anomaly table written by Spark (type, severity, observed/expected, timestamps) |

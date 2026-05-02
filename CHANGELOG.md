# Changelog

## 1.0.3 — 2026-05-02

- **Drawing coach:** `POST /api/canvas/coach` with `lib/canvas-coach-analyze.ts`, HUD (`drawing-coach-hud.tsx`), subject helpers (`drawing-subjects.ts`), and Vitest coverage. Canvas/checkpoint/recall glue + prior-board modal tweaks; schema updates in `lib/canvas-schema.ts`.
- **Bright Data:** `lib/brightdata-reference-images.ts` (+ tests), `scripts/` helpers (`brightdata-print-env.mjs`, etc.) and root `README.md` for setup. Lockfile updates for Bright Data CLI where applicable.
- **Ops / MCP docs:** Expanded `.env.example`, `lib/tools.ts` / tooling rail / layout copy; escaped inner backticks in `lib/system-prompt.ts`; tests `lib/app-origin.test.ts`, `lib/resolve-vercel-documentation-links.test.ts`.

## 1.0.2 — 2026-05-02

- **Track A (MCP honesty):** Added `README.md` describing REST vs Streamable MCP (`/api/mcp`) merge in `/api/chat`. Expanded `.env.example` (`APP_ORIGIN`, `VERCEL_DISABLE_LOCAL_MCP`, `VERCEL_TEAM_ID`). Clarified metadata, tooling rail, and `lib/tools.ts` header. Tests: `lib/app-origin.test.ts`, `lib/resolve-vercel-documentation-links.test.ts`.

## 1.0.1 — 2026-05-02

- Root `/` redirects to `/canvas` (new board flow).
- Deployment chat stays at **`/copilot`**; Canvas header stripe and Copilot back-link removed from the drawing surface.
- Copilot chrome: removed Canvas shortcut button from the Ship Check Copilot header.

## 1.0.0 — 2026-05-02

First stable release tag. Same app as 0.2.0 merge to `main`; semver promoted for launch / Vercel production.

## 0.2.0 — 2026-05-02

- Infinite whiteboard at `/canvas` and `/canvas/[canvasId]` (tldraw, IndexedDB persistence per canvas id).
- Server routes: `POST /api/canvas/checkpoint` (MuBit `remember` + upsert) and `POST /api/canvas/session-open` (MuBit `recall` → prior-board modal).
- Anonymous tenant cookie `sc_tenant_id` via middleware; Copilot header link to Canvas.
- Vitest + unit tests for MuBit recall hit extraction.

# Changelog

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

# Changelog

## 0.2.0 — 2026-05-02

- Infinite whiteboard at `/canvas` and `/canvas/[canvasId]` (tldraw, IndexedDB persistence per canvas id).
- Server routes: `POST /api/canvas/checkpoint` (MuBit `remember` + upsert) and `POST /api/canvas/session-open` (MuBit `recall` → prior-board modal).
- Anonymous tenant cookie `sc_tenant_id` via middleware; Copilot header link to Canvas.
- Vitest + unit tests for MuBit recall hit extraction.

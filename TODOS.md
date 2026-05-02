# Deferred work

Captured from `/plan-eng-review` (2026-05-02).

## Ship lock-in (2026-05-02)

- **Engineering forks:** Frozen in `PLAN_ENG_DIET.md` — **Fork A:** Alpic owns MCP for the hosted ChatGPT app; Vercel hosts tool execution. In-repo `/api/mcp` is secondary (local/Next merges).
- **Env contract:** `.env.example` documents `BRIGHTDATA_*` + Alpic/Vercel/Mubit keys; `.env` is local-only.
- **MVP scoring axis:** Calories only until thaw in `lib/diet/mvp-goal.ts` + plan doc — then wire Mubit + Bright Data-backed tools against that contract.

## Add Vitest (or runner) + coverage for `lib/tools.ts`

- **What:** Introduce automated tests and cover `vercelFetch` branches: 401 with JSON `{ error.code }`; plain `{ error }` body; `meta`/branch omissions; deployments array vs `{ deployments }` wrapper.
- **Why:** The repo ships zero automated tests today. Any refactor of tool wiring or MCP merge will break silently until manual chat checks.
- **Pros:** Faster iteration, regressions caught in CI.
- **Cons:** Boilerplate (`vitest`/config/`pnpm test`).
- **Context:** Implement in `lib/tools.test.ts` (or beside `tools.ts`). Mock global `fetch`. Start from design doc appendix test matrix.
- **Depends on:** None.

## Route integration test for `POST /api/chat`

- **What:** Add a deterministic test harness that mocks `streamText`/tool execution (or invokes route handler with mocked AI provider) so tool registration and merging cannot drift without failing CI.
- **Why:** `app/api/chat/route.ts` is the highest blast-radius surface (`maxDuration`, model, `stopWhen`).
- **Pros:** Guards MCP + REST merge regressions without live Anthropic/Vercel.
- **Cons:** Harness complexity (AI SDK test patterns).
- **Context:** Prefer official AI SDK Next.js testing patterns where available.
- **Depends on:** Vitest/runner scaffold from item above.

## MCP OAuth refresh path

- **What:** If the chosen HTTP MCP emits `metadata['mcp/oauth']`, implement OAuth provider flow with token refresh hooks so MCP calls do not silently fail mid-demo.
- **Why:** Bearer tokens expire. Hackathon demos love to die on stage for this reason alone.
- **Pros:** Credibility during live judging.
- **Cons:** UX + secret handling time not needed if MCP host uses long-lived server keys instead.
- **Context:** Deferred until MCP URL/auth shape is finalized.
- **Blocked by:** MCP server contract (HTTP MCP connect + credential model).

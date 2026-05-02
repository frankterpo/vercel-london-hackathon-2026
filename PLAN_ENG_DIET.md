# Diet agent — frozen engineering choices (hackathon MVP)

Locks decisions so Mubit wiring and scoring stay consistent across PRs.

## Fork A vs Fork B — **chosen: Fork A**

| Option | MCP host | Typical use |
|--------|----------|-------------|
| **Fork A** | Alpic-hosted HTTP MCP surface; tool execution hits Vercel routes | Alpic owns the connector the ChatGPT app talks to |
| **Fork B** | Next.js app on Vercel exposes Streamable HTTP MCP (e.g. `/api/mcp`) | Single deploy boundary; dev-only shortcut if GPT never leaves Vercel |

**Locked: Fork A** — Alpic is the platform hosting the ChatGPT app and must own the MCP entrypoint users (and GPT) attach to for tool discovery/calls. Vercel remains where tool handlers run (`/api/agent/*`-style HTTPS routes).

**Still in-repo:** `app/api/mcp/route.ts` is fine for **local/demo wiring** inside Next.js (e.g. web UI + AI SDK merges). The **product-truth** MCP URL for the shipped GPT experience is Alpic’s host; configure Alpic to forward tool invocations to this project’s Vercel deployment.

Operator checklist: [docs/alpic-host.md](./docs/alpic-host.md).

**If you ever simplify to Fork B:** only if the hackathon surface is not Alpic-hosted ChatGPT anymore (all traffic through this Next app only).

## Bright Data (`BRIGHTDATA_*`)

Bright Data backs constrained web research/citations behind tools. Credentials come from Bright Data dashboard (zone / API tokens per product). See `hack-breif.md`, [Bright Data docs](https://docs.brightdata.com/), and `.env.example` for placeholder names — **never commit secrets**.

## Mubit

Deferred until AFTER env contract + MCP tool surface are stable per `hack-breif.md`. Prefer tool handlers reading `process.env.MUBIT_API_KEY` only on server routes; no keys in ChatGPT payloads.

## MVP goal metric — **frozen: calorie**

Exactly one primary optimisation goal for MVP scoring narratives and UI copy: **daily calorie target adherence** (`lib/diet/mvp-goal.ts`). Protein (and micronutrients) stay post-MVP unless we explicitly thaw this doc.

# Diet agent — frozen engineering choices (hackathon MVP)

Locks decisions so Mubit wiring and scoring stay consistent across PRs.

## Fork A vs Fork B — **chosen: Fork B**

| Option | MCP host | Typical use |
|--------|----------|-------------|
| **Fork A** | Alpic-hosted HTTP MCP surface; tool execution hits Vercel routes | Judges see MCP “owned” by Alpic; dual surface to operate |
| **Fork B** | Next.js app on Vercel exposes Streamable HTTP MCP (e.g. `/api/mcp`) | Single deploy boundary; simpler demo + fewer moving parts |

**Locked: Fork B** — this repo already implements MCP beside chat (`app/api/mcp/route.ts`). `ALPIC_API_KEY` remains for Alpic Deploy / management APIs and connector-facing setup, not for replacing in-app MCP routing in MVP.

**If you pivot to Fork A:** stand up Alpic MCP config to forward tool calls into this project’s HTTPS tool routes on Vercel; document new env + URL contract here.

## Bright Data (`BRIGHTDATA_*`)

Bright Data backs constrained web research/citations behind tools. Credentials come from Bright Data dashboard (zone / API tokens per product). See `hack-breif.md`, [Bright Data docs](https://docs.brightdata.com/), and `.env.example` for placeholder names — **never commit secrets**.

## Mubit

Deferred until AFTER env contract + MCP tool surface are stable per `hack-breif.md`. Prefer tool handlers reading `process.env.MUBIT_API_KEY` only on server routes; no keys in ChatGPT payloads.

## MVP goal metric — **frozen: calorie**

Exactly one primary optimisation goal for MVP scoring narratives and UI copy: **daily calorie target adherence** (`lib/diet/mvp-goal.ts`). Protein (and micronutrients) stay post-MVP unless we explicitly thaw this doc.

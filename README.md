# Ship Check Copilot

Next.js 16 app: **deployment copilot chat** (`/copilot`) backed by the Vercel REST API, plus **drawing coach** on `/canvas`.

## Tooling model (Track A)

| Surface | Transport | What it does |
|--------|-----------|----------------|
| **Vercel data** | HTTPS `api.vercel.com` with `VERCEL_API_TOKEN` | `listProjects`, `listDeployments`, deployment logs, domains, env names (redacted). Implemented in `lib/tools.ts`. |
| **Docs helper** | **MCP** Streamable HTTP over this app’s **`/api/mcp`** | `search_documentation`: heuristic Vercel doc links + docs search URL. Registered in `app/api/mcp/route.ts`, merged into chat via `@ai-sdk/mcp` in `lib/local-mcp-client.ts`. |

Chat handler: `app/api/chat/route.ts` merges **`vercelTools` (REST)** and **MCP-derived tools** before `streamText`.

To **disable** MCP merge (REST only), set `VERCEL_DISABLE_LOCAL_MCP=true`. The UI tooling rail reads the same flag via `GET /api/config`.

### Production note

`POST /api/chat` opens an MCP client to `{origin}/api/mcp`. Origin resolution: `APP_ORIGIN` or `NEXT_PUBLIC_APP_URL` → else `https://${VERCEL_URL}` → else `http://localhost:${PORT}`. Use `APP_ORIGIN` if your public URL differs from `VERCEL_URL` (custom domain).

### Vercel env vars & AI Gateway

Server routes read **`process.env` at runtime** on Vercel (values are **not baked into client JS**). After you change **Settings → Environment Variables**, **redeploy Production** so new instances see them: **Deployments → … → Redeploy**, or merge to `main`, or `vercel deploy --prod` from this repo.

| Feature | Vars / routing |
|---------|----------------|
| REST copilot tools | `VERCEL_API_TOKEN` (+ optional `VERCEL_TEAM_ID`) → `api.vercel.com`. |
| Copilot chat + streaming | Uses **AI SDK provider strings** (e.g. `anthropic/claude-sonnet-4`), which route through **[Vercel AI Gateway](https://vercel.com/ai-gateway)** on your deployment. Billing / card-on-file applies per your team. |
| Drawing coach vision | Same Gateway model **unless** you set **`ANTHROPIC_API_KEY`**, then coach calls Anthropic directly (see `.env.example`). |

For Gateway-only setups: **do not** set `ANTHROPIC_API_KEY`; complete AI Gateway onboarding and redeploy after adding `VERCEL_API_TOKEN`.

## Setup

```bash
pnpm install
cp .env.example .env
# Fill VERCEL_API_TOKEN for REST tools; optional VERCEL_TEAM_ID
pnpm dev
```

- **Copilot:** `/copilot`
- **MCP inspector (dev):** POST/GET `http://localhost:3000/api/mcp` (Streamable HTTP; see [Vercel MCP / AI SDK MCP](https://ai-sdk.dev/docs/ai-sdk-core/mcp))

## Alpic + Fork A

For the hosted GPT-style surface, MCP discovery may live on **Alpic** while tool execution still hits this Vercel deploy. See `docs/alpic-host.md` and `PLAN_ENG_DIET.md`.

## Tests

```bash
pnpm test
```

## License

Private / hackathon project unless stated otherwise.

# Alpic host (Fork A)

Engineering freeze: **Alpic owns the MCP entrypoint** for the hosted ChatGPT-style app. **Vercel** runs this repo and answers tool execution over HTTPS.

Authority: `PLAN_ENG_DIET.md` Fork A vs Fork B table.

## What lives where

| Layer | Responsibility |
|--------|----------------|
| Alpic | Connector / GPT app UX / MCP discovery the user attaches in ChatGPT (or sibling host). Users do not browse this repo for that surface. |
| Vercel (this project) | `POST /api/chat` (AI SDK + merged tools/MCP), `POST\|GET /api/mcp` (streamable MCP for doc helper), `/api/config` for shell settings. Deploy URL is your **tool backend base**. |

## Wire-up checklist

1. Deploy this repo on Vercel; note **`https://<production-host>`**.
2. In Alpic (or whatever exposes the MCP URL to GPT), configure the MCP server URL and auth per Alpic docs so **tool calls** resolve to endpoints this app exposes (`/api/mcp` pattern for `mcp-handler`, or your chosen proxy paths).
3. Keep secrets only in Vercel env (see `.env.example`). Do **not** embed keys in MCP payloads surfaced to ChatGPT clients.
4. Optional: validate locally with Streamable MCP at `http://localhost:3000/api/mcp` (`lib/local-mcp-client.ts`).

## Repo-only shortcut

`app/api/mcp/route.ts` is valid for Next-only demos and merges in `app/api/chat`. It is **not** the Fork A source of truth for the GPT product UX; Alpic-hosted MCP **is**.

## Change control

Move to Fork B (single MCP on Vercel) **only** if the hackathon retracts Alpic-hosted ChatGPT as the primary surface (`PLAN_ENG_DIET.md`).

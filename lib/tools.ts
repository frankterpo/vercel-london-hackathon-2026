/**
 * # Iteration knobs: PERSONA_LINE, MCP_SERVER, SURFACE (chat-only vs +dashboard)
 *
 * MCP_SERVER: Vercel MCP (projects/deployments/logs)
 * SURFACE: chat-only (MVP)
 * PERSONA_LINE: "Terse CTO-on-call. Ends with actionable next steps."
 *
 * Future: GitHub MCP for PR status, commit diffs
 */

import { tool } from "ai"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Vercel API helpers
// ---------------------------------------------------------------------------

const VERCEL_API = "https://api.vercel.com"

async function vercelFetch(path: string) {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) {
    throw new Error(
      "VERCEL_API_TOKEN not set. Add it in project settings (Vars tab)."
    )
  }
  const teamId = process.env.VERCEL_TEAM_ID
  const separator = path.includes("?") ? "&" : "?"
  const url = teamId
    ? `${VERCEL_API}${path}${separator}teamId=${teamId}`
    : `${VERCEL_API}${path}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Vercel API ${res.status}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Tools exposed to the model
// ---------------------------------------------------------------------------

export const vercelTools = {
  listProjects: tool({
    description:
      "List all Vercel projects for the authenticated team/user. Returns project names, frameworks, and latest deployment status.",
    inputSchema: z.object({
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe("Max projects to return"),
    }),
    execute: async ({ limit }) => {
      const data = await vercelFetch(`/v9/projects?limit=${limit}`)
      return (data.projects ?? []).map(
        (p: Record<string, unknown>) => ({
          name: p.name,
          id: p.id,
          framework: p.framework ?? "unknown",
          updatedAt: p.updatedAt,
          latestDeploymentState:
            (p.latestDeployments as Record<string, unknown>[])?.[0]?.readyState ??
            "unknown",
        })
      )
    },
  }),

  listDeployments: tool({
    description:
      "List recent deployments for a specific Vercel project. Shows deployment state, URL, branch, commit, and created time.",
    inputSchema: z.object({
      projectId: z
        .string()
        .describe("The Vercel project ID or name"),
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(5)
        .describe("Max deployments to return"),
    }),
    execute: async ({ projectId, limit }) => {
      const data = await vercelFetch(
        `/v6/deployments?projectId=${projectId}&limit=${limit}`
      )
      return (data.deployments ?? []).map(
        (d: Record<string, unknown>) => ({
          id: d.uid,
          url: d.url,
          state: d.state ?? d.readyState,
          target: d.target,
          createdAt: d.createdAt,
          meta: d.meta
            ? {
                branch: (d.meta as Record<string, unknown>).githubCommitRef,
                commit: (d.meta as Record<string, unknown>).githubCommitSha,
                message: (d.meta as Record<string, unknown>).githubCommitMessage,
              }
            : null,
        })
      )
    },
  }),

  getDeployment: tool({
    description:
      "Get detailed information about a specific deployment by its ID or URL. Shows build logs URL, status, error info, domains, and environment.",
    inputSchema: z.object({
      deploymentId: z
        .string()
        .describe("Deployment ID (e.g. dpl_xxx) or deployment URL"),
    }),
    execute: async ({ deploymentId }) => {
      const data = await vercelFetch(`/v13/deployments/${deploymentId}`)
      return {
        id: data.id,
        url: data.url,
        state: data.readyState,
        target: data.target,
        createdAt: data.createdAt,
        buildingAt: data.buildingAt,
        ready: data.ready,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        inspectorUrl: data.inspectorUrl,
        domains: data.alias,
      }
    },
  }),

  getDeploymentEvents: tool({
    description:
      "Get build logs / events for a deployment. Shows build steps, errors, and warnings. Useful for debugging failed deployments.",
    inputSchema: z.object({
      deploymentId: z
        .string()
        .describe("The deployment ID to get logs for"),
    }),
    execute: async ({ deploymentId }) => {
      const data = await vercelFetch(
        `/v3/deployments/${deploymentId}/events?limit=50`
      )
      const events = Array.isArray(data) ? data : data.events ?? []
      return events
        .filter(
          (e: Record<string, unknown>) =>
            e.type === "stderr" ||
            e.type === "stdout" ||
            e.type === "error" ||
            e.type === "command"
        )
        .slice(-30)
        .map((e: Record<string, unknown>) => ({
          type: e.type,
          text:
            typeof e.text === "string"
              ? e.text.slice(0, 500)
              : (e.payload as Record<string, unknown>)?.text ??
                JSON.stringify(e.payload ?? "").slice(0, 500),
          created: e.created,
        }))
    },
  }),

  getProjectDomains: tool({
    description:
      "List domains configured for a Vercel project. Shows custom domains, their verification status, and redirect configuration.",
    inputSchema: z.object({
      projectId: z
        .string()
        .describe("The project ID or name"),
    }),
    execute: async ({ projectId }) => {
      const data = await vercelFetch(
        `/v9/projects/${projectId}/domains`
      )
      return (data.domains ?? []).map(
        (d: Record<string, unknown>) => ({
          name: d.name,
          verified: d.verified,
          redirect: d.redirect,
          gitBranch: d.gitBranch,
        })
      )
    },
  }),

  getProjectEnvVars: tool({
    description:
      "List environment variables for a project (names and targets only, values are redacted for security). Useful for checking if required env vars exist.",
    inputSchema: z.object({
      projectId: z
        .string()
        .describe("The project ID or name"),
    }),
    execute: async ({ projectId }) => {
      const data = await vercelFetch(
        `/v10/projects/${projectId}/env`
      )
      return (data.envs ?? []).map(
        (e: Record<string, unknown>) => ({
          key: e.key,
          target: e.target,
          type: e.type,
          updatedAt: e.updatedAt,
        })
      )
    },
  }),
} as const

// ---------------------------------------------------------------------------
// Tool metadata for the UI tooling checklist
// ---------------------------------------------------------------------------

export const TOOL_REGISTRY = [
  {
    name: "listProjects",
    label: "List Projects",
    description: "List all Vercel projects",
    server: "Vercel API",
  },
  {
    name: "listDeployments",
    label: "List Deployments",
    description: "Recent deployments for a project",
    server: "Vercel API",
  },
  {
    name: "getDeployment",
    label: "Get Deployment",
    description: "Detailed deployment info",
    server: "Vercel API",
  },
  {
    name: "getDeploymentEvents",
    label: "Deployment Logs",
    description: "Build events and error output",
    server: "Vercel API",
  },
  {
    name: "getProjectDomains",
    label: "Project Domains",
    description: "Domain config and verification",
    server: "Vercel API",
  },
  {
    name: "getProjectEnvVars",
    label: "Environment Vars",
    description: "Env var names (redacted values)",
    server: "Vercel API",
  },
] as const

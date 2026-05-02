export async function GET() {
  const localMcpDisabled = process.env.VERCEL_DISABLE_LOCAL_MCP === "true"

  return Response.json({
    hasApiToken: !!process.env.VERCEL_API_TOKEN,
    hasTeamId: !!process.env.VERCEL_TEAM_ID,
    localMcp: !localMcpDisabled,
  })
}

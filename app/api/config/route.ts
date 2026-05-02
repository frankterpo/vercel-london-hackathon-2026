export async function GET() {
  return Response.json({
    hasApiToken: !!process.env.VERCEL_API_TOKEN,
    hasTeamId: !!process.env.VERCEL_TEAM_ID,
  })
}

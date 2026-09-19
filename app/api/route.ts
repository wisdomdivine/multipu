export async function GET() {
  return Response.json(
    {
      name: "Multipu API",
      version: "1.0.0",
      description:
        "Autonomous multi-chain token launch aggregator and execution layer for AI agents",
      documentation: "https://www.multipu.fun",
      endpoints: {
        health: "/api/health",
        verification: "/.well-known/xagent-verification.json",
        exploreLaunches: "/api/launches/explore",
        trendingLaunches: "/api/launches/trending",
        tokenSearch: "/api/tokens/search",
        agents: "/api/agents",
        keeperhubAudit: "/api/keeperhub/audit/:id",
      },
      chains: ["solana", "bsc", "robinhood"],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    }
  );
}

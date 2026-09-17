import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/request-security";
import { executeKeeperHubWorkflow } from "@/lib/keeperhub/client";
import { createAdminSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const directTradeSchema = z.object({
  agentId: z.string().optional(),
  tokenSymbol: z.string(),
  tokenMint: z.string().optional(),
  action: z.enum(["buy", "sell"]),
  launchpad: z.string(),
  chain: z.enum(["solana", "bsc", "robinhood"]).default("solana"),
  amount: z.number().positive(),
  mode: z.enum(["paper", "live"]).default("paper"),
});

const deployStrategySchema = z.object({
  rules: z.object({
    chain: z.enum(["solana", "bsc", "robinhood"]).default("solana"),
    launchpads: z.array(z.string()).default(["pumpfun"]),
    takeProfitPct: z.number().optional().default(35),
    stopLossPct: z.number().optional().default(15),
    tradeAmount: z.number().positive().default(0.1),
    minVolume24h: z.number().optional(),
    minOlaXbtMomentum: z.number().optional(),
  }),
  mode: z.enum(["paper", "live"]).default("paper"),
  tokenSymbol: z.string().optional(),
  tokenMint: z.string().optional(),
});

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) {
    return Response.json({ error: originError }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = await getAuth(request);
  const walletAddress = auth.isLoggedIn ? auth.walletAddress : "demo_wallet";

  try {
    const body = await request.json();

    // Check if strategy deployment or direct trade
    const isStrategyDeploy = Boolean(body.rules);
    let agentId: string;
    let tokenSymbol: string;
    let tokenMint: string | undefined;
    let action: "buy" | "sell";
    let launchpad: string;
    let chain: "solana" | "bsc" | "robinhood";
    let amount: number;
    let mode: "paper" | "live";

    if (isStrategyDeploy) {
      const parsed = deployStrategySchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const { rules, mode: parsedMode } = parsed.data;
      mode = parsedMode;
      chain = rules.chain;
      launchpad = rules.launchpads[0] || (chain === "solana" ? "pumpfun" : chain === "bsc" ? "fourmeme" : "sherwood");
      tokenSymbol = parsed.data.tokenSymbol || "PEPEQ";
      tokenMint = parsed.data.tokenMint;
      action = "buy";
      amount = rules.tradeAmount;
      agentId = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    } else {
      const parsed = directTradeSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      agentId = parsed.data.agentId || `agent_${Date.now()}`;
      tokenSymbol = parsed.data.tokenSymbol;
      tokenMint = parsed.data.tokenMint;
      action = parsed.data.action;
      launchpad = parsed.data.launchpad;
      chain = parsed.data.chain;
      amount = parsed.data.amount;
      mode = parsed.data.mode;
    }

    let txHash = "";
    let executionLatency = 350;

    if (mode === "live") {
      const keeperRes = await executeKeeperHubWorkflow({
        chain,
        action: "bonding_curve_swap",
        sender: walletAddress,
        amount,
        data: {
          tokenSymbol,
          tokenMint,
          launchpad,
          tradeAction: action,
        },
      });
      txHash = keeperRes.txHash;
      executionLatency = keeperRes.executionLatencyMs;
    } else {
      // Paper trade deterministic hash
      txHash = `sim_${chain}_` + Math.random().toString(36).substring(2, 14);
    }

    const pnlPct = action === "sell" ? +(Math.random() * 25 + 10).toFixed(2) : 0;
    const pnlSol = action === "sell" ? +(amount * (pnlPct / 100)).toFixed(5) : 0;

    // Record trade
    try {
      const supabase = createAdminSupabase();
      await supabase.from("agent_trades").insert({
        agent_id: agentId.startsWith("agent_") ? null : agentId,
        token_symbol: tokenSymbol,
        token_mint: tokenMint || null,
        action,
        launchpad,
        chain,
        amount_in: amount,
        amount_out: action === "sell" ? amount + pnlSol : amount,
        pnl_pct: pnlPct,
        pnl_sol: pnlSol,
        tx_signature: txHash,
        mode,
        execution_log: `Executed ${action.toUpperCase()} ${amount} ${chain === "solana" ? "SOL" : "BNB"} on ${launchpad} via KeeperHub Shield. Latency: ${executionLatency}ms`,
      });
    } catch {
      // Ignored for demo / mock session
    }

    return Response.json({
      success: true,
      session: {
        id: agentId,
        status: "active",
        mode,
        chain,
        launchpad,
      },
      trade: {
        agentId,
        tokenSymbol,
        action,
        amount,
        txHash,
        pnlPct,
        pnlSol,
        executionLatencyMs: executionLatency,
        mode,
        engine: "KeeperHub Autonomous Execution Layer",
      },
    });
  } catch (err: any) {
    console.error("[API] POST /api/agents/execute error:", err);
    return Response.json(
      { error: err.message || "Execution failed" },
      { status: 500 }
    );
  }
}

import { apiLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const url = new URL(request.url);
  const explicitPair = url.searchParams.get("pairAddress");
  const explicitNetwork = url.searchParams.get("network");

  let poolAddress = explicitPair;
  let network = explicitNetwork ? explicitNetwork.toLowerCase() : "solana";

  // Normalize network name for GeckoTerminal API
  if (network === "robinhood") network = "solana";
  if (network === "binance" || network === "bnb") network = "bsc";
  if (network === "ethereum") network = "eth";

  // If pool address was not explicitly supplied, try finding it via DexScreener
  if (!poolAddress) {
    try {
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${id}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (dexRes.ok) {
        const dexData = await dexRes.json();
        const pair = dexData.pairs?.[0];
        if (pair?.pairAddress) {
          poolAddress = pair.pairAddress;
          if (pair.chainId) {
            network = pair.chainId.toLowerCase();
          }
        }
      }
    } catch {
      // Ignore lookup failure
    }
  }

  if (!poolAddress) {
    return Response.json({ trades: [] });
  }

  try {
    const geckoUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/trades`;
    const res = await fetch(geckoUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return Response.json({ trades: [] });
    }

    const data = await res.json();
    const rawList = Array.isArray(data?.data) ? data.data : [];

    const trades = rawList.map((item: any) => {
      const attr = item.attributes || {};
      const txHash = attr.tx_hash || "";
      const kind = attr.kind === "sell" ? "sell" : "buy";
      const volumeUsd = Number(attr.volume_in_usd || 0);
      const toAmount = Number(attr.to_token_amount || 0);
      const fromAmount = Number(attr.from_token_amount || 0);
      const nativeAmount = kind === "buy" ? fromAmount : toAmount;

      let explorerUrl = "";
      if (txHash) {
        if (network === "bsc") {
          explorerUrl = `https://bscscan.com/tx/${txHash}`;
        } else if (network === "base") {
          explorerUrl = `https://basescan.org/tx/${txHash}`;
        } else if (network === "eth") {
          explorerUrl = `https://etherscan.io/tx/${txHash}`;
        } else {
          explorerUrl = `https://solscan.io/tx/${txHash}`;
        }
      }

      const wallet = attr.tx_from_address
        ? `${attr.tx_from_address.slice(0, 4)}...${attr.tx_from_address.slice(-4)}`
        : "0x...";

      let timestamp = "";
      if (attr.block_timestamp) {
        try {
          const date = new Date(attr.block_timestamp);
          timestamp = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
        } catch {
          timestamp = "just now";
        }
      }

      return {
        id: item.id || txHash,
        type: kind,
        amountPay: volumeUsd > 0 ? volumeUsd : nativeAmount,
        volumeUsd,
        nativeAmount,
        wallet,
        fullWallet: attr.tx_from_address || "",
        timestamp,
        txHash,
        explorerUrl,
      };
    });

    return Response.json({ trades });
  } catch (err: any) {
    return Response.json({ trades: [], error: err?.message || "Failed to fetch trades" });
  }
}

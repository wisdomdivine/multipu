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
  const timeframe = url.searchParams.get("timeframe") || "1h";
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
    return Response.json({ timeframe, candles: [] });
  }

  // Map requested timeframe to GeckoTerminal parameters
  let geckoTimeframe = "hour";
  let aggregate = 1;
  let limit = 100;

  switch (timeframe) {
    case "5m":
      geckoTimeframe = "minute";
      aggregate = 5;
      limit = 100;
      break;
    case "15m":
      geckoTimeframe = "minute";
      aggregate = 15;
      limit = 100;
      break;
    case "1h":
      geckoTimeframe = "hour";
      aggregate = 1;
      limit = 100;
      break;
    case "4h":
      geckoTimeframe = "hour";
      aggregate = 4;
      limit = 100;
      break;
    case "1d":
      geckoTimeframe = "day";
      aggregate = 1;
      limit = 100;
      break;
    default:
      geckoTimeframe = "hour";
      aggregate = 1;
      limit = 100;
  }

  try {
    const geckoUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/ohlcv/${geckoTimeframe}?aggregate=${aggregate}&limit=${limit}`;
    const res = await fetch(geckoUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return Response.json({ timeframe, candles: [] });
    }

    const data = await res.json();
    const rawList: number[][] = data?.data?.attributes?.ohlcv_list || [];

    // Filter out invalid items and map to chart structure: { time, open, high, low, close, volume }
    // Sort ascending by time (GeckoTerminal returns newest first)
    const candles = rawList
      .filter((item) => Array.isArray(item) && item.length >= 5)
      .map(([timestamp, open, high, low, close, volume = 0]) => ({
        time: timestamp,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
      }))
      .sort((a, b) => a.time - b.time);

    return Response.json({
      timeframe,
      candles,
    });
  } catch (err: any) {
    return Response.json({ timeframe, candles: [], error: err?.message || "Failed to fetch OHLCV" });
  }
}

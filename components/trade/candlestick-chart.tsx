"use client";

interface CandlestickChartProps {
  currentPrice: number;
  priceDirection: "up" | "down" | "flat";
  gasSymbol: string;
  pairAddress?: string | null;
  chainId?: string | null;
  tokenSymbol?: string;
}

export function CandlestickChart({
  currentPrice,
  priceDirection,
  gasSymbol,
  pairAddress,
  chainId,
  tokenSymbol,
}: CandlestickChartProps) {
  const normalizedChain = chainId ? chainId.toLowerCase() : "solana";

  if (pairAddress) {
    return (
      <div className="bg-[#181818] p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-medium text-white">
              Live DEX Chart
            </span>
            {tokenSymbol && (
              <span className="text-[11px] font-mono text-neutral-400">
                ${tokenSymbol}
              </span>
            )}
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.04] text-neutral-400">
              {normalizedChain}
            </span>
          </div>
          {currentPrice > 0 && (
            <div className="text-xs font-mono text-neutral-300">
              {currentPrice < 0.0001
                ? `$${currentPrice.toFixed(8)}`
                : `$${currentPrice.toFixed(4)}`}
            </div>
          )}
        </div>
        <div className="w-full h-[500px] rounded-xl overflow-hidden bg-[#121212]">
          <iframe
            src={`https://dexscreener.com/${normalizedChain}/${pairAddress}?embed=1&theme=dark&trades=0&info=0`}
            title="Live DEX Chart"
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#181818] p-8 rounded-2xl flex flex-col items-center justify-center min-h-[380px] gap-3 text-center">
      <span className="text-sm font-sans font-medium text-white">
        DEX Chart
      </span>
      <p className="text-xs font-mono text-neutral-400 max-w-md leading-relaxed">
        Liquidity pool pending automated market maker indexing. Chart will stream live automatically once liquidity pool transactions are indexed.
      </p>
      {currentPrice > 0 && (
        <div className="text-xs font-mono text-neutral-300 mt-2 px-3 py-1 rounded bg-white/[0.04]">
          Initial Reference: {currentPrice.toFixed(6)} {gasSymbol}
        </div>
      )}
    </div>
  );
}

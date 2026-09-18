"use client";

import { cn } from "@/lib/utils";

export interface ExecutedTrade {
  id: string;
  type: "buy" | "sell";
  amountPay: number;
  amountReceive: number;
  wallet: string;
  timestamp: string;
  txHash?: string;
  explorerUrl?: string;
}

interface TradeHistoryProps {
  launchId: string;
  gasSymbol: string;
  sessionTrades?: ExecutedTrade[];
  txns24h?: { buys: number; sells: number };
}

export function TradeHistory({
  launchId,
  gasSymbol,
  sessionTrades = [],
  txns24h,
}: TradeHistoryProps) {
  const total24h = (txns24h?.buys || 0) + (txns24h?.sells || 0);

  return (
    <div className="bg-[#181818] p-6 rounded-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white font-sans">
            Trade Activity
          </h3>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            Verified on-chain executions and session order flow
          </p>
        </div>
        {total24h > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-neutral-300">
              24h: {txns24h?.buys || 0} buys / {txns24h?.sells || 0} sells
            </span>
          </div>
        )}
      </div>

      {sessionTrades.length > 0 ? (
        <div className="flex flex-col gap-2">
          {sessionTrades.map((trade) => (
            <div
              key={trade.id}
              className="bg-[#141414] rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "uppercase tracking-wider text-[10px] font-mono font-semibold px-2 py-0.5 rounded",
                    trade.type === "buy"
                      ? "text-emerald-400 bg-emerald-400/10"
                      : "text-red-400 bg-red-400/10"
                  )}
                >
                  {trade.type}
                </span>
                <span className="font-mono text-xs text-neutral-300">
                  {trade.wallet}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-white font-medium">
                  {trade.amountPay.toFixed(4)} {gasSymbol}
                </span>
                {trade.explorerUrl ? (
                  <a
                    href={trade.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-purple-400 hover:text-purple-300 underline"
                  >
                    view tx
                  </a>
                ) : (
                  <span className="text-[11px] font-mono text-neutral-500">
                    {trade.timestamp}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#141414] rounded-xl p-6 text-center">
          <p className="text-xs font-mono text-neutral-400">
            No trades executed in this session yet. Orders submitted above settle on-chain and appear here with block explorer receipts.
          </p>
        </div>
      )}
    </div>
  );
}

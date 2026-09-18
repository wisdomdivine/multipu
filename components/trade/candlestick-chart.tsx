"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

interface CandlestickChartProps {
  currentPrice: number;
  priceDirection?: "up" | "down" | "flat";
  gasSymbol: string;
  pairAddress?: string | null;
  chainId?: string | null;
  tokenSymbol?: string;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface HoverState {
  open: number;
  high: number;
  low: number;
  close: number;
  time: string | number;
}

const TIMEFRAMES = [
  { label: "5M", value: "5m" },
  { label: "15M", value: "15m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
];

function formatPrice(val: number): string {
  if (val <= 0) return "$0.00";
  if (val < 0.00001) return `$${val.toFixed(8)}`;
  if (val < 0.01) return `$${val.toFixed(6)}`;
  if (val < 1) return `$${val.toFixed(4)}`;
  return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function CandlestickChart({
  currentPrice,
  gasSymbol,
  pairAddress,
  chainId,
  tokenSymbol,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [timeframe, setTimeframe] = useState("1h");
  const [loading, setLoading] = useState(true);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [hoverData, setHoverData] = useState<HoverState | null>(null);

  const normalizedChain = chainId ? chainId.toLowerCase() : "solana";

  // Fetch OHLCV candles
  useEffect(() => {
    if (!pairAddress) {
      setLoading(false);
      setCandles([]);
      return;
    }

    let isSubscribed = true;

    const fetchOHLCV = async () => {
      try {
        const query = new URLSearchParams({
          timeframe,
          pairAddress,
          network: normalizedChain,
        });

        const res = await fetch(`/api/launches/${pairAddress}/ohlcv?${query.toString()}`);
        if (!res.ok) {
          if (isSubscribed) setLoading(false);
          return;
        }

        const data = await res.json();
        if (isSubscribed) {
          if (Array.isArray(data?.candles)) {
            setCandles(data.candles);
          }
          setLoading(false);
        }
      } catch {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchOHLCV();
    // Poll every 10 seconds for live active market updates
    const pollInterval = setInterval(fetchOHLCV, 10000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [pairAddress, normalizedChain, timeframe]);

  // Mount Lightweight Charts canvas once per timeframe/mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = containerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#121212" },
        textColor: "#737373",
        fontSize: 11,
        fontFamily: "monospace",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.02)" },
        horzLines: { color: "rgba(255, 255, 255, 0.02)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: "#262626",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: "#262626",
        },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.22,
        },
      },
      width: container.clientWidth || 800,
      height: 500,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      priceFormat: {
        type: "price",
        precision: currentPrice < 0.01 ? 8 : 4,
        minMove: currentPrice < 0.01 ? 0.00000001 : 0.0001,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Hover crosshair tracking
    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        setHoverData(null);
        return;
      }

      const seriesData = param.seriesData.get(candleSeries);
      if (seriesData && "open" in seriesData) {
        setHoverData({
          open: Number(seriesData.open),
          high: Number(seriesData.high),
          low: Number(seriesData.low),
          close: Number(seriesData.close),
          time: param.time as number,
        });
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect && chartRef.current) {
          chartRef.current.applyOptions({
            width: entry.contentRect.width,
            height: 500,
          });
        }
      }
    });

    resizeObserver.observe(container);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [timeframe]);

  // Seamless in-place updates when candles arrive
  const initialFittedRef = useRef(false);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    const formattedCandles = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const formattedVolumes = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
    }));

    candleSeriesRef.current.setData(formattedCandles);
    volumeSeriesRef.current.setData(formattedVolumes);

    if (!initialFittedRef.current && chartRef.current) {
      chartRef.current.timeScale().fitContent();
      initialFittedRef.current = true;
    }
  }, [candles]);

  // Real-time tick update if currentPrice moves
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0 || currentPrice <= 0) return;

    const last = candles[candles.length - 1];
    const updatedHigh = Math.max(last.high, currentPrice);
    const updatedLow = Math.min(last.low, currentPrice);

    candleSeriesRef.current.update({
      time: last.time as UTCTimestamp,
      open: last.open,
      high: updatedHigh,
      low: updatedLow,
      close: currentPrice,
    });
  }, [currentPrice, candles]);

  const latestPrice = candles.length > 0 ? candles[candles.length - 1].close : currentPrice;

  if (pairAddress) {
    return (
      <div className="bg-[#181818] p-4 rounded-2xl flex flex-col gap-3">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
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

          {/* Timeframe Selectors */}
          <div className="flex items-center gap-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  timeframe === tf.value
                    ? "bg-white text-black font-semibold"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price & OHLC Status Row */}
        <div className="flex items-center justify-between px-1 text-xs font-mono text-neutral-400 min-h-[20px]">
          {hoverData ? (
            <div className="flex items-center gap-3 text-[11px]">
              <span>O: {formatPrice(hoverData.open)}</span>
              <span>H: {formatPrice(hoverData.high)}</span>
              <span>L: {formatPrice(hoverData.low)}</span>
              <span
                className={
                  hoverData.close >= hoverData.open ? "text-[#22c55e]" : "text-[#ef4444]"
                }
              >
                C: {formatPrice(hoverData.close)}
              </span>
            </div>
          ) : (
            <div className="text-xs font-mono text-neutral-300">
              {formatPrice(latestPrice)}
            </div>
          )}

          {candles.length > 0 && (
            <span className="text-[10px] text-neutral-500 font-mono">
              {candles.length} bars
            </span>
          )}
        </div>

        {/* Canvas Chart Area */}
        <div className="w-full h-[500px] rounded-xl overflow-hidden bg-[#121212] relative">
          {loading && candles.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs font-mono text-neutral-500">
                Loading market data...
              </span>
            </div>
          ) : candles.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-sm font-sans font-medium text-white">
                DEX Chart
              </span>
              <p className="text-xs font-mono text-neutral-400 max-w-md leading-relaxed">
                Liquidity pool pending automated market maker indexing. Chart will stream live automatically once transactions are indexed.
              </p>
              {latestPrice > 0 && (
                <div className="text-xs font-mono text-neutral-300 mt-2 px-3 py-1 rounded bg-white/[0.04]">
                  Initial Reference: {formatPrice(latestPrice)}
                </div>
              )}
            </div>
          ) : (
            <div ref={containerRef} className="w-full h-full" />
          )}
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

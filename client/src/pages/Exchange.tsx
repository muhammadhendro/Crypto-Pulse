import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";

type Ticker = {
  symbol: string;
  price: string;
  change: string;
  volume: string;
  high: string;
  low: string;
  source: "binance" | "mock";
};

const PAIRS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT", "XRPUSDT", "DOGEUSDT", "DOTUSDT"];

function generateMockData(): Ticker[] {
  return PAIRS.map((pair) => {
    const basePrice = pair.startsWith("BTC") ? 64000 : pair.startsWith("ETH") ? 3400 : pair.startsWith("SOL") ? 145 : 10;
    const random = (Math.random() - 0.5) * (basePrice * 0.005);
    const price = basePrice + random;
    const change = (Math.random() - 0.5) * 5;

    return {
      symbol: pair,
      price: price.toFixed(2),
      change: change.toFixed(2),
      volume: (Math.random() * 1_000_000).toFixed(0),
      high: (price * 1.02).toFixed(2),
      low: (price * 0.98).toFixed(2),
      source: "mock",
    };
  });
}

export default function Exchange() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");

  const loadTickers = useCallback(async () => {
    try {
      const data = await Promise.all(
        PAIRS.map(async (symbol) => {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
          if (!res.ok) throw new Error("ticker fetch failed");
          const raw = await res.json();

          return {
            symbol,
            price: Number(raw.lastPrice || 0).toFixed(2),
            change: Number(raw.priceChangePercent || 0).toFixed(2),
            volume: Number(raw.quoteVolume || 0).toFixed(0),
            high: Number(raw.highPrice || 0).toFixed(2),
            low: Number(raw.lowPrice || 0).toFixed(2),
            source: "binance" as const,
          };
        })
      );

      setTickers(data);
      setConnectionStatus("connected");
      setLastUpdate(new Date());
    } catch (_error) {
      setTickers(generateMockData());
      setConnectionStatus("disconnected");
      setLastUpdate(new Date());
    }
  }, []);

  useEffect(() => {
    setConnectionStatus("connecting");
    loadTickers();
    const interval = setInterval(loadTickers, 10_000);
    return () => clearInterval(interval);
  }, [loadTickers]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="container py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Live Exchange Rates</h2>
            <p className="text-muted-foreground">Market data from Binance API with fallback mode</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-success" : connectionStatus === "connecting" ? "bg-yellow-500" : "bg-destructive"} animate-pulse`} />
            <span className="text-muted-foreground uppercase font-mono text-xs">{connectionStatus}</span>
            <span className="text-muted-foreground text-xs">{lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="w-[150px]">Pair</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">24h Change</TableHead>
                  <TableHead className="text-right hidden md:table-cell">24h High</TableHead>
                  <TableHead className="text-right hidden md:table-cell">24h Low</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Volume</TableHead>
                  <TableHead className="w-[120px]">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickers.map((ticker) => {
                  const isPositive = parseFloat(ticker.change) >= 0;
                  return (
                    <TableRow key={ticker.symbol} className="hover:bg-accent/50 border-white/5 transition-colors font-mono">
                      <TableCell className="font-bold text-foreground font-sans">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          {ticker.symbol}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-base">${ticker.price}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`ml-auto font-mono ${isPositive ? "text-success border-success/30 bg-success/10" : "text-destructive border-destructive/30 bg-destructive/10"}`}>
                          {isPositive ? "+" : ""}{ticker.change}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden md:table-cell">{ticker.high}</TableCell>
                      <TableCell className="text-right text-muted-foreground hidden md:table-cell">{ticker.low}</TableCell>
                      <TableCell className="text-right text-muted-foreground hidden lg:table-cell">{parseInt(ticker.volume).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ticker.source}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { getTopCoins, getCoinOHLCV } from "@/lib/crypto-api";
import { calculateIndicators } from "@/lib/indicators";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Helper component to calculate and display row data
function AnalysisRow({ coin }: { coin: any }) {
  const { data: ohlcv, isLoading } = useQuery({
    queryKey: ["ohlcv", coin.id],
    queryFn: () => getCoinOHLCV(coin.id, "30"),
    staleTime: 60000 // Cache for 1 min
  });

  if (isLoading || !ohlcv) {
    return (
      <TableRow>
        <TableCell><div className="flex items-center gap-2"><img src={coin.image} className="h-6 w-6 rounded-full"/>{coin.name}</div></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      </TableRow>
    );
  }

  const prices = ohlcv.map(c => c[4]);
  const highs = ohlcv.map(c => c[2]);
  const lows = ohlcv.map(c => c[3]);
  const closes = ohlcv.map(c => c[4]);
  
  const { indicators, signals } = calculateIndicators(prices, highs, lows, closes);
  const signal = signals.summary.signal;

  return (
    <TableRow className="hover:bg-accent/50 cursor-pointer group">
      <TableCell className="font-medium">
        <Link href={`/coin/${coin.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
          <img src={coin.image} alt={coin.name} className="h-6 w-6 rounded-full" />
          <span className="font-bold">{coin.name}</span>
          <span className="text-muted-foreground text-xs uppercase">{coin.symbol}</span>
        </Link>
      </TableCell>
      <TableCell className="font-mono text-right">${coin.current_price.toLocaleString()}</TableCell>
      <TableCell className="text-center font-mono">{indicators.rsi.toFixed(0)}</TableCell>
      <TableCell className="text-center font-mono">
        <span className={(indicators.macd.histogram || 0) > 0 ? "text-success" : "text-destructive"}>
           {(indicators.macd.histogram || 0).toFixed(2)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className={
          signal === "Bullish" ? "border-success text-success bg-success/10" : 
          signal === "Bearish" ? "border-destructive text-destructive bg-destructive/10" : 
          "border-yellow-500 text-yellow-500 bg-yellow-500/10"
        }>
          {signal === "Bullish" && <TrendingUp className="h-3 w-3 mr-1" />}
          {signal === "Bearish" && <TrendingDown className="h-3 w-3 mr-1" />}
          {signal === "Neutral" && <Minus className="h-3 w-3 mr-1" />}
          {signal} ({signals.summary.score})
        </Badge>
      </TableCell>
      <TableCell>
         <Link href={`/coin/${coin.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
            <ArrowRight className="h-4 w-4" />
         </Link>
      </TableCell>
    </TableRow>
  );
}

export default function Analysis() {
  const { data: coins, isLoading } = useQuery({
    queryKey: ["topCoins"],
    queryFn: getTopCoins,
  });

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Market Analysis Scanner</h2>
          <p className="text-muted-foreground">Automated technical signals for top cryptocurrencies based on daily timeframe.</p>
        </div>

        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle>Technical Screener</CardTitle>
            <CardDescription>RSI (14), MACD (12,26,9), and Moving Average Confluence</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Asset</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">RSI</TableHead>
                  <TableHead className="text-center">MACD Hist</TableHead>
                  <TableHead className="text-right">Signal Score</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  coins?.map(coin => (
                    <AnalysisRow key={coin.id} coin={coin} />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

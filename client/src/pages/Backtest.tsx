import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { getCoinOHLCV } from "@/lib/crypto-api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Play, RotateCcw } from "lucide-react";
import { calculateIndicators } from "@/lib/indicators";
import { toast } from "@/hooks/use-toast";

export default function Backtest() {
  const [strategy, setStrategy] = useState("rsi_oversold");
  const [asset, setAsset] = useState("bitcoin");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const { data: ohlcv } = useQuery({
    queryKey: ["ohlcv", asset, "365"], // Get 1 year of data
    queryFn: () => getCoinOHLCV(asset, "365"),
  });

  const runBacktest = () => {
    if (!ohlcv) return;
    setIsRunning(true);
    setResults(null);

    // Simulate computation delay
    setTimeout(() => {
      const prices = ohlcv.map(c => c[4]);
      const { indicators } = calculateIndicators(
        prices,
        ohlcv.map(c => c[2]),
        ohlcv.map(c => c[3]),
        ohlcv.map(c => c[4])
      );

      // Simple mock logic for backtesting
      let trades = 0;
      let wins = 0;
      let pnl = 0;

      // Mock results based on strategy
      if (strategy === "rsi_oversold") {
         trades = 24;
         wins = 14;
         pnl = 1250;
      } else if (strategy === "golden_cross") {
         trades = 8;
         wins = 5;
         pnl = 3400;
      } else {
         trades = 45;
         wins = 20;
         pnl = -500;
      }

      setResults({
        totalTrades: trades,
        winRate: ((wins/trades) * 100).toFixed(1),
        netProfit: pnl,
        profitFactor: 1.5
      });
      setIsRunning(false);
      toast({ title: "Backtest Complete", description: "Strategy simulation finished successfully." });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="container py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Strategy Backtester</h2>
          <p className="text-muted-foreground">Simulate trading strategies on historical data (Sandbox Mode)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Setup your strategy parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Asset</Label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                    <SelectItem value="solana">Solana (SOL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rsi_oversold">RSI Oversold (Buy &lt; 30)</SelectItem>
                    <SelectItem value="golden_cross">SMA Golden Cross (20/50)</SelectItem>
                    <SelectItem value="bollinger_breakout">Bollinger Breakout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Initial Capital ($)</Label>
                <Input type="number" defaultValue={10000} disabled />
              </div>

              <Button className="w-full" onClick={runBacktest} disabled={isRunning || !ohlcv}>
                {isRunning ? "Simulating..." : <><Play className="mr-2 h-4 w-4" /> Run Backtest</>}
              </Button>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            {results ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
                <Card className="p-4 bg-accent/5">
                  <div className="text-sm text-muted-foreground">Net Profit</div>
                  <div className={`text-2xl font-mono font-bold ${results.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                    ${results.netProfit}
                  </div>
                </Card>
                <Card className="p-4 bg-accent/5">
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="text-2xl font-mono font-bold">{results.winRate}%</div>
                </Card>
                <Card className="p-4 bg-accent/5">
                  <div className="text-sm text-muted-foreground">Total Trades</div>
                  <div className="text-2xl font-mono font-bold">{results.totalTrades}</div>
                </Card>
                 <Card className="p-4 bg-accent/5">
                  <div className="text-sm text-muted-foreground">Profit Factor</div>
                  <div className="text-2xl font-mono font-bold">{results.profitFactor}</div>
                </Card>
              </div>
            ) : (
               <Card className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground border-dashed">
                 <RotateCcw className="h-12 w-12 mb-4 opacity-20" />
                 <p>Select a strategy and click "Run Backtest" to see results.</p>
               </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Equity Curve (Simulated)</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="h-[300px] w-full bg-accent/5 rounded flex items-center justify-center text-muted-foreground text-sm">
                   {results ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={Array.from({length: 20}, (_, i) => ({ i, val: 10000 + (results.netProfit/20)*i + Math.random()*500 }))}>
                           <Area type="monotone" dataKey="val" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                           <XAxis dataKey="i" hide />
                           <YAxis hide domain={['auto', 'auto']} />
                           <Tooltip />
                        </AreaChart>
                     </ResponsiveContainer>
                   ) : "Chart will appear after simulation"}
                 </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Grid Bot (3Commas Style)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    Automated grid trading helps capture profit in sideways markets. This is an educational simulation.
                  </p>
                  <Button variant="outline" className="w-full" disabled>Configure Grid (Coming Soon)</Button>
                </CardContent>
              </Card>
               <Card>
                <CardHeader><CardTitle className="text-sm">DCA Bot (Pionex Style)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    Dollar Cost Averaging reduces the impact of volatility. Setup recurring buys here.
                  </p>
                  <Button variant="outline" className="w-full" disabled>Configure DCA (Coming Soon)</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

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


      const prices = ohlcv.map(c => c[4]);
      const highs = ohlcv.map(c => c[2]);
      const lows = ohlcv.map(c => c[3]);
      const closes = ohlcv.map(c => c[4]);

      let trades = 0;
      let wins = 0;
      let pnl = 0;

      for (let i = 200; i < prices.length; i += 1) {
        const current = prices[i];
        const previous = prices[i - 1];

        const { indicators } = calculateIndicators(
          prices.slice(0, i + 1),
          highs.slice(0, i + 1),
          lows.slice(0, i + 1),
          closes.slice(0, i + 1)
        );

        const rsiValue = indicators.rsi;
        const smaFast = indicators.sma.period20;
        const smaSlow = indicators.sma.period50;
        const bandUpper = indicators.bollingerBands.upper;
        const bandLower = indicators.bollingerBands.lower;

        let enterLong = false;
        let exitLong = false;

        if (strategy === "rsi_oversold") {
          enterLong = rsiValue < 35;
          exitLong = rsiValue > 60;
        } else if (strategy === "golden_cross") {
          enterLong = current > smaFast && smaFast > smaSlow;
          exitLong = current < smaFast;
        } else {
          enterLong = current < bandLower;
          exitLong = current > bandUpper;
        }

        if (enterLong) {
          trades += 1;
          const movePct = ((previous - current) / current) * 100;
          const tradePnl = Math.max(-4, Math.min(6, movePct));
          pnl += tradePnl * 120;
          if (tradePnl > 0.4 || exitLong) wins += 1;
        }
      }

      const safeTrades = Math.max(trades, 1);
      const winRate = (wins / safeTrades) * 100;
      const grossProfit = Math.max(pnl, 0) + 1;
      const grossLoss = Math.abs(Math.min(pnl, 0)) + 1;

      setResults({
        totalTrades: trades,
        winRate: winRate.toFixed(1),
        netProfit: Number(pnl.toFixed(2)),
        profitFactor: (grossProfit / grossLoss).toFixed(2)
      });
      setIsRunning(false);
      toast({ title: "Backtest Complete", description: "Strategy simulation finished successfully." });
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
                        <AreaChart data={Array.from({length: 20}, (_, i) => ({ i, val: 10000 + (results.netProfit/20)*i + Math.sin(i/2)*120 }))}>
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
                  <Button variant="outline" className="w-full">Configure Grid</Button>
                </CardContent>
              </Card>
               <Card>
                <CardHeader><CardTitle className="text-sm">DCA Bot (Pionex Style)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    Dollar Cost Averaging reduces the impact of volatility. Setup recurring buys here.
                  </p>
                  <Button variant="outline" className="w-full">Configure DCA</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Trailing TP Bot</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    Lock profits dynamically by moving take-profit levels as trend extends.
                  </p>
                  <Button variant="outline" className="w-full">Configure Trailing TP</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

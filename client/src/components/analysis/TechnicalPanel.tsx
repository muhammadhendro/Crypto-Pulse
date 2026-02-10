import { useMemo } from "react";
import { calculateIndicators, TechnicalAnalysisResult } from "@/lib/indicators";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, TrendingUp, TrendingDown, Activity, Minus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TechnicalPanelProps {
  ohlcv: number[][]; // [time, open, high, low, close]
}

export function TechnicalPanel({ ohlcv }: TechnicalPanelProps) {
  const analysis = useMemo(() => {
    if (!ohlcv || ohlcv.length === 0) return null;
    
    const prices = ohlcv.map(c => c[4]);
    const highs = ohlcv.map(c => c[2]);
    const lows = ohlcv.map(c => c[3]);
    const closes = ohlcv.map(c => c[4]);
    
    return calculateIndicators(prices, highs, lows, closes);
  }, [ohlcv]);

  if (!analysis) return <div>Loading technical data...</div>;

  const { indicators, signals } = analysis;
  const signalColor = signals.summary.signal === "Bullish" ? "text-success" : signals.summary.signal === "Bearish" ? "text-destructive" : "text-yellow-500";
  const signalBg = signals.summary.signal === "Bullish" ? "bg-success" : signals.summary.signal === "Bearish" ? "bg-destructive" : "bg-yellow-500";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Signal Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle>Summary Signal</CardTitle>
            <CardDescription>Based on moving averages & oscillators</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className={`relative flex items-center justify-center h-32 w-32 rounded-full border-4 ${signalColor.replace('text-', 'border-')}/30 ${signalBg}/5`}>
              <span className={`text-2xl font-bold ${signalColor}`}>{signals.summary.signal}</span>
            </div>
            <div className="mt-6 w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bearish</span>
                <span>Neutral</span>
                <span>Bullish</span>
              </div>
              <Progress value={signals.summary.score} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Signal Drivers</CardTitle>
            <CardDescription>Key factors influencing the technical score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {signals.summary.reason.length > 0 ? signals.summary.reason.map((reason, i) => (
                <Badge key={i} variant="outline" className="px-3 py-1">
                  {reason.includes("Bullish") || reason.includes("above") || reason.includes("Golden") ? <TrendingUp className="h-3 w-3 mr-2 text-success" /> : 
                   reason.includes("Bearish") || reason.includes("below") || reason.includes("Death") ? <TrendingDown className="h-3 w-3 mr-2 text-destructive" /> : 
                   <Activity className="h-3 w-3 mr-2" />}
                  {reason}
                </Badge>
              )) : <span className="text-muted-foreground text-sm">No strong signals detected.</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Oscillators</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">RSI (14)</TableCell>
                  <TableCell className="text-right font-mono">{indicators.rsi.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={indicators.rsi > 70 ? "text-destructive" : indicators.rsi < 30 ? "text-success" : "text-muted-foreground"}>
                      {indicators.rsi > 70 ? "Sell" : indicators.rsi < 30 ? "Buy" : "Neutral"}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Stochastic (14,3,3)</TableCell>
                  <TableCell className="text-right font-mono">{indicators.stochastic.k.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={indicators.stochastic.k > 80 ? "text-destructive" : indicators.stochastic.k < 20 ? "text-success" : "text-muted-foreground"}>
                      {indicators.stochastic.k > 80 ? "Overbought" : indicators.stochastic.k < 20 ? "Oversold" : "Neutral"}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">MACD (12,26)</TableCell>
                  <TableCell className="text-right font-mono">{indicators.macd.MACD?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={(indicators.macd.histogram || 0) > 0 ? "text-success" : "text-destructive"}>
                      {(indicators.macd.histogram || 0) > 0 ? "Buy" : "Sell"}
                    </span>
                  </TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-medium">ATR (14)</TableCell>
                  <TableCell className="text-right font-mono">{indicators.atr.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-muted-foreground">Volatility</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Moving Averages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">EMA (12)</TableCell>
                  <TableCell className="text-right font-mono">{indicators.ema.period12.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-medium">SMA (20)</TableCell>
                  <TableCell className="text-right font-mono">{indicators.sma.period20.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">SMA (50)</TableCell>
                  <TableCell className="text-right font-mono">{indicators.sma.period50.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">SMA (200)</TableCell>
                  <TableCell className="text-right font-mono">{indicators.sma.period200.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-medium">Bollinger Upper</TableCell>
                  <TableCell className="text-right font-mono">{indicators.bollingerBands.upper.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">Res</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-medium">Bollinger Lower</TableCell>
                  <TableCell className="text-right font-mono">{indicators.bollingerBands.lower.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">Sup</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       {/* Pivot Points */}
       <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pivot Points (Classic)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
             <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground text-xs">S3</span>
              <span className="font-mono">{indicators.pivotPoints.classic.s3.toFixed(2)}</span>
            </div>
             <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground text-xs">S2</span>
              <span className="font-mono">{indicators.pivotPoints.classic.s2.toFixed(2)}</span>
            </div>
             <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground text-xs">S1</span>
              <span className="font-mono">{indicators.pivotPoints.classic.s1.toFixed(2)}</span>
            </div>
             <div className="flex flex-col space-y-1 bg-accent/20 rounded p-1">
              <span className="text-primary text-xs font-bold">Pivot</span>
              <span className="font-mono font-bold text-primary">{indicators.pivotPoints.classic.pp.toFixed(2)}</span>
            </div>
             <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground text-xs">R1</span>
              <span className="font-mono">{indicators.pivotPoints.classic.r1.toFixed(2)}</span>
            </div>
             <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground text-xs">R2</span>
              <span className="font-mono">{indicators.pivotPoints.classic.r2.toFixed(2)}</span>
            </div>
             <div className="flex flex-col space-y-1">
              <span className="text-muted-foreground text-xs">R3</span>
              <span className="font-mono">{indicators.pivotPoints.classic.r3.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Disclaimer</AlertTitle>
        <AlertDescription>
          This technical analysis is generated automatically by algorithms and should not be considered financial advice. 
          Crypto markets are highly volatile. Always do your own research.
        </AlertDescription>
      </Alert>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useRoute } from "wouter";
import Navbar from "@/components/layout/Navbar";
import { getCoinHistory, getCoinDetails, getCoinOHLCV } from "@/lib/crypto-api"; 
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowUp, ArrowDown, BookOpen, BarChart2, LineChart, Database, Activity, Layers, Code, Bell, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { TechnicalPanel } from "@/components/analysis/TechnicalPanel";
import { FundamentalPanel } from "@/components/analysis/FundamentalPanel";
import { DerivativesPanel } from "@/components/analysis/DerivativesPanel";
import { OnChainPanel } from "@/components/analysis/OnChainPanel";
import { SentimentPanel } from "@/components/analysis/SentimentPanel";
import { MultiExchangePanel } from "@/components/analysis/MultiExchangePanel";
import { QuantPanel } from "@/components/analysis/QuantPanel";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { getAlerts, createAlert, deleteAlert, evaluateAlerts, type AlertRule } from "@/lib/app-api";
import { calculateIndicators } from "@/lib/indicators";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Detail() {
  const [match, params] = useRoute("/coin/:id");
  const id = params?.id || "bitcoin";
  const [timeRange, setTimeRange] = useState("7"); 
  const [alertType, setAlertType] = useState<AlertRule["type"]>("price_above");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [chartInterval, setChartInterval] = useState<"1" | "5" | "15" | "60" | "240" | "D">("60");

  const { data: coin, isLoading: coinLoading } = useQuery({ 
    queryKey: ["coinDetail", id], 
    queryFn: () => getCoinDetails(id) 
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["history", id, timeRange],
    queryFn: () => getCoinHistory(id, timeRange),
  });

  const { data: ohlcv, isLoading: ohlcvLoading } = useQuery({
    queryKey: ["ohlcv", id],
    queryFn: () => getCoinOHLCV(id, "30")
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: getAlerts,
    refetchInterval: 15_000,
  });

  const createAlertMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const deleteAlertMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const chartData = history?.prices.map(([time, price]) => ({
    date: time,
    price: price
  })) || [];

  const isPositive = (coin?.price_change_percentage_24h || 0) >= 0;

  const technicalSnapshot = useMemo(() => {
    if (!ohlcv || ohlcv.length < 200) return null;
    const prices = ohlcv.map((c) => c[4]);
    const highs = ohlcv.map((c) => c[2]);
    const lows = ohlcv.map((c) => c[3]);
    const closes = ohlcv.map((c) => c[4]);
    return calculateIndicators(prices, highs, lows, closes);
  }, [ohlcv]);

  useEffect(() => {
    if (!coin || !technicalSnapshot) return;

    const evaluate = async () => {
      const result = await evaluateAlerts({
        coinId: id,
        price: coin.current_price,
        rsi: technicalSnapshot.indicators.rsi,
        macdHistogram: technicalSnapshot.indicators.macd.histogram || 0,
      });

      if (result.triggeredIds.length > 0) {
        toast({
          title: `Alert Triggered: ${coin.symbol.toUpperCase()}`,
          description: `${result.triggeredIds.length} alert(s) triggered and archived.`,
        });
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
      }
    };

    evaluate();
  }, [alerts, coin, id, technicalSnapshot]);

  const coinAlerts = alerts.filter((a) => a.coinId === id);

  const handleCreateAlert = async () => {
    if (!coin) return;

    const needsThreshold = !["macd_bullish", "macd_bearish"].includes(alertType);
    const parsedThreshold = alertThreshold === "" ? null : Number(alertThreshold);

    if (needsThreshold && (parsedThreshold === null || Number.isNaN(parsedThreshold))) {
      toast({ title: "Validation", description: "Threshold is required for this alert type", variant: "destructive" });
      return;
    }

    await createAlertMutation.mutateAsync({
      coinId: id,
      coinSymbol: coin.symbol,
      type: alertType,
      threshold: needsThreshold ? parsedThreshold : null,
      enabled: true,
    });

    setAlertThreshold("");
    toast({ title: "Alert created", description: "Rule saved successfully." });
  };

  if (coinLoading || !coin) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {coin && <img src={coin.image} alt={coin.name} className="h-16 w-16 rounded-full" />}
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {coin.name} <span className="text-muted-foreground text-xl font-mono uppercase">({coin.symbol})</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono text-xs">Rank #{coin.market_cap_rank}</Badge>
                {coin.categories.slice(0, 2).map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold font-mono">
              ${coin.current_price.toLocaleString()}
            </div>
            <div className={`flex items-center justify-end font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
              {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}% (24h)
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="chart" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start overflow-x-auto pb-2">
             <TabsTrigger value="overview">Overview</TabsTrigger>
             <TabsTrigger value="chart">Chart</TabsTrigger>
             <TabsTrigger value="technical">Technical</TabsTrigger>
             <TabsTrigger value="derivatives">Derivs</TabsTrigger>
             <TabsTrigger value="onchain">On-Chain</TabsTrigger>
             <TabsTrigger value="exchanges">Exchanges</TabsTrigger>
             <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
             <TabsTrigger value="quant">Quant</TabsTrigger>
             <TabsTrigger value="fundamental">Fundam.</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Price History</CardTitle>
                    <Tabs defaultValue="7" onValueChange={setTimeRange}>
                      <TabsList>
                        <TabsTrigger value="1">24H</TabsTrigger>
                        <TabsTrigger value="7">7D</TabsTrigger>
                        <TabsTrigger value="30">30D</TabsTrigger>
                        <TabsTrigger value="365">1Y</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    {historyLoading ? <Skeleton className="h-full w-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(tick) => format(tick, timeRange === "1" ? "HH:mm" : "MMM d")}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            minTickGap={30}
                          />
                          <YAxis 
                            domain={['auto', 'auto']}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickFormatter={(val) => `$${val.toLocaleString()}`}
                            width={60}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            labelFormatter={(label) => format(label, "PP p")}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorPrice)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-muted-foreground">Market Cap</span>
                      <span className="font-mono">${(coin.market_cap || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-muted-foreground">Volume (24h)</span>
                      <span className="font-mono">${(coin.total_volume || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-muted-foreground">Circulating Supply</span>
                      <span className="font-mono">{coin.circulating_supply.toLocaleString()} {coin.symbol.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">All Time High</span>
                      <div className="text-right">
                        <div className="font-mono">${coin.ath.toLocaleString()}</div>
                        <div className="text-xs text-destructive">{coin.ath_change_percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                 <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> About {coin.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {coin.description?.en || "No description available."}
                    </p>
                 </div>
              </div>
            </div>
          </TabsContent>

          {/* TRADINGVIEW CHART TAB */}
          <TabsContent value="chart">
             <div className="h-[600px] w-full bg-card rounded-lg border overflow-hidden">
                <AdvancedRealTimeChart 
                  symbol={`${coin.symbol.toUpperCase()}USDT`} 
                  theme="dark" 
                  autosize
                  hide_side_toolbar={false}
                  allow_symbol_change={true}
                  interval={chartInterval}
                />
             </div>
             <div className="mt-3 flex flex-wrap items-center gap-2">
               {([
                 { label: "1m", value: "1" },
                 { label: "5m", value: "5" },
                 { label: "15m", value: "15" },
                 { label: "1H", value: "60" },
                 { label: "4H", value: "240" },
                 { label: "1D", value: "D" }
               ] as const).map((frame) => (
                 <Button
                   key={frame.value}
                   variant={chartInterval === frame.value ? "default" : "outline"}
                   size="sm"
                   onClick={() => setChartInterval(frame.value)}
                 >
                   {frame.label}
                 </Button>
               ))}
             </div>
             <div className="mt-2 text-xs text-muted-foreground text-center">
               Chart powered by TradingView. Includes Pine Script Strategy Tester capability (read-only).
             </div>
          </TabsContent>

          {/* TECHNICAL TAB */}
          <TabsContent value="technical">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BarChart2 className="h-6 w-6 text-primary" /> Technical Analysis
              </h2>
               <div className="flex items-center gap-2">
                 <Badge variant="outline">Daily Timeframe</Badge>
               </div>
            </div>
            {ohlcv ? <TechnicalPanel ohlcv={ohlcv} /> : <Skeleton className="h-96 w-full" />}

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Alerts (Price / RSI / MACD)</CardTitle>
                <CardDescription>Create rule-based alerts for current asset.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select value={alertType} onValueChange={(v: AlertRule["type"]) => setAlertType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_above">Price Above</SelectItem>
                      <SelectItem value="price_below">Price Below</SelectItem>
                      <SelectItem value="rsi_above">RSI Above</SelectItem>
                      <SelectItem value="rsi_below">RSI Below</SelectItem>
                      <SelectItem value="macd_bullish">MACD Bullish</SelectItem>
                      <SelectItem value="macd_bearish">MACD Bearish</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Threshold"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    disabled={["macd_bullish", "macd_bearish"].includes(alertType)}
                  />
                  <Button onClick={handleCreateAlert} disabled={createAlertMutation.isPending}>Create Alert</Button>
                </div>

                <div className="space-y-2">
                  {coinAlerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No alerts for this coin yet.</p>
                  ) : (
                    coinAlerts.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between border rounded-md p-2">
                        <div className="text-sm">
                          {rule.type.replaceAll("_", " ")}
                          {rule.threshold !== null ? ` @ ${rule.threshold}` : ""}
                          {!rule.enabled && <Badge variant="secondary" className="ml-2">Triggered</Badge>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteAlertMutation.mutate(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DERIVATIVES TAB */}
          <TabsContent value="derivatives">
            <div className="mb-4">
               <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <LineChart className="h-6 w-6 text-primary" /> Derivatives Data
              </h2>
              <p className="text-muted-foreground">Open Interest, Funding Rates, and Liquidations</p>
            </div>
            <DerivativesPanel coinSymbol={coin.symbol} />
          </TabsContent>

          {/* ON-CHAIN TAB */}
          <TabsContent value="onchain">
             <div className="mb-4">
               <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" /> On-Chain Analytics
              </h2>
              <p className="text-muted-foreground">Network activity, HODL waves, and Exchange flows</p>
            </div>
            <OnChainPanel coinSymbol={coin.symbol} />
          </TabsContent>
          
           {/* EXCHANGES TAB */}
          <TabsContent value="exchanges">
             <div className="mb-4">
               <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Layers className="h-6 w-6 text-primary" /> Multi-Exchange
              </h2>
              <p className="text-muted-foreground">Cross-exchange arbitrage opportunities and price comparison</p>
            </div>
            <MultiExchangePanel coinSymbol={coin.symbol} />
          </TabsContent>
          
           {/* SENTIMENT TAB */}
          <TabsContent value="sentiment">
             <div className="mb-4">
               <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" /> Sentiment Analysis
              </h2>
              <p className="text-muted-foreground">Social volume, Fear & Greed Index, and News Sentiment</p>
            </div>
            <SentimentPanel coinSymbol={coin.symbol} />
          </TabsContent>
          
           {/* QUANT TAB */}
          <TabsContent value="quant">
             <div className="mb-4">
               <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Code className="h-6 w-6 text-primary" /> Quant Lab
              </h2>
              <p className="text-muted-foreground">Backtesting engine using Backtrader/Python (Simulated)</p>
            </div>
            <QuantPanel />
          </TabsContent>

          {/* FUNDAMENTAL TAB */}
          <TabsContent value="fundamental">
             <div className="mb-4">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" /> Fundamental Research
              </h2>
            </div>
            <FundamentalPanel coin={coin} />
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}

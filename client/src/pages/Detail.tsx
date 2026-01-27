import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Navbar from "@/components/layout/Navbar";
import { getCoinHistory, getTopCoins } from "@/lib/crypto-api"; // We'll re-use getTopCoins to find the coin metadata for now
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowUp, ArrowDown, Info, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Detail() {
  const [match, params] = useRoute("/coin/:id");
  const id = params?.id || "bitcoin";
  const [timeRange, setTimeRange] = useState("7"); // 1, 7, 30, 365

  // 1. Get Coin Metadata (simulating a getCoinById call by filtering the list)
  const { data: coins } = useQuery({ queryKey: ["topCoins"], queryFn: getTopCoins });
  const coin = coins?.find(c => c.id === id);

  // 2. Get Chart History
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["history", id, timeRange],
    queryFn: () => getCoinHistory(id, timeRange),
  });

  // Calculate Simple Technicals
  const calculateTechnicals = (prices: number[]) => {
    if (!prices || prices.length < 14) return { rsi: 50, trend: "Neutral" };
    
    // Simple RSI-like calc (mock logic for prototype)
    const changes = prices.slice(1).map((p, i) => p - prices[i]);
    const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0);
    const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0));
    const rs = gains / (losses || 1);
    const rsi = 100 - (100 / (1 + rs));
    
    let trend = "Neutral";
    if (rsi > 70) trend = "Overbought (Bearish)";
    else if (rsi < 30) trend = "Oversold (Bullish)";
    else if (prices[prices.length - 1] > prices[0]) trend = "Bullish";
    else trend = "Bearish";

    return { rsi: Math.round(rsi), trend };
  };

  const chartData = history?.prices.map(([time, price]) => ({
    date: time,
    price: price
  })) || [];

  const technicals = calculateTechnicals(chartData.map(d => d.price));

  if (!coin && !coins) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  const isPositive = (coin?.price_change_percentage_24h || 0) >= 0;

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
                {coin?.name} <span className="text-muted-foreground text-xl font-mono uppercase">({coin?.symbol})</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-mono text-xs">Rank #{coin?.market_cap_rank}</Badge>
                <Badge variant="secondary" className="font-mono text-xs">PoS</Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold font-mono">
              ${coin?.current_price.toLocaleString()}
            </div>
            <div className={`flex items-center justify-end font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
              {Math.abs(coin?.price_change_percentage_24h || 0).toFixed(2)}% (24h)
            </div>
          </div>
        </div>

        {/* Main Chart Section */}
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

          {/* Technicals Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Technical Analysis
                </CardTitle>
                <CardDescription>Based on {timeRange === "1" ? "24h" : "daily"} timeframe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">RSI (14)</span>
                    <span className="font-mono font-bold">{technicals.rsi}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${technicals.rsi > 70 ? 'bg-destructive' : technicals.rsi < 30 ? 'bg-success' : 'bg-primary'}`} 
                      style={{ width: `${technicals.rsi}%` }} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {technicals.rsi > 70 ? "Overbought" : technicals.rsi < 30 ? "Oversold" : "Neutral"}
                  </p>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trend Signal</span>
                    <Badge variant={technicals.trend.includes("Bullish") ? "default" : technicals.trend.includes("Bearish") ? "destructive" : "secondary"}>
                      {technicals.trend}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5" />
                    <p>
                      Disclaimer: Technical indicators are calculated for educational purposes only. 
                      Not financial advice.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-mono">${(coin?.market_cap || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-muted-foreground">Volume (24h)</span>
                  <span className="font-mono">${(coin?.total_volume || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-muted-foreground">Circulating Supply</span>
                  <span className="font-mono">{coin?.circulating_supply.toLocaleString()} {coin?.symbol.toUpperCase()}</span>
                </div>
                 <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">All Time High</span>
                  <span className="font-mono">${coin?.ath.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

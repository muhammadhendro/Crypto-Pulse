import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Navbar from "@/components/layout/Navbar";
import { getCoinHistory, getCoinDetails, getCoinOHLCV } from "@/lib/crypto-api"; 
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowUp, ArrowDown, Info, Activity, Newspaper, BookOpen, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { TechnicalPanel } from "@/components/analysis/TechnicalPanel";
import { FundamentalPanel } from "@/components/analysis/FundamentalPanel";

export default function Detail() {
  const [match, params] = useRoute("/coin/:id");
  const id = params?.id || "bitcoin";
  const [timeRange, setTimeRange] = useState("7"); // 1, 7, 30, 365

  // 1. Get Coin Detail (Fundamental + Basic)
  const { data: coin, isLoading: coinLoading } = useQuery({ 
    queryKey: ["coinDetail", id], 
    queryFn: () => getCoinDetails(id) 
  });

  // 2. Get Chart History (for main chart)
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["history", id, timeRange],
    queryFn: () => getCoinHistory(id, timeRange),
  });

  // 3. Get OHLCV (for Technical Analysis) - defaulting to 30 days for robust analysis
  const { data: ohlcv, isLoading: ohlcvLoading } = useQuery({
    queryKey: ["ohlcv", id],
    queryFn: () => getCoinOHLCV(id, "30")
  });

  const chartData = history?.prices.map(([time, price]) => ({
    date: time,
    price: price
  })) || [];

  if (coinLoading || !coin) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  const isPositive = (coin.price_change_percentage_24h || 0) >= 0;

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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="fundamental">Fundamental</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
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
                    <Button variant="link" className="px-0 h-auto text-primary mt-2" onClick={() => (document.querySelector('[value="fundamental"]') as HTMLElement)?.click()}>
                      Read more in Fundamentals
                    </Button>
                 </div>
              </div>
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
          
           {/* NEWS TAB (Placeholder) */}
          <TabsContent value="news">
             <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg border-dashed">
               <Newspaper className="h-12 w-12 mb-4 opacity-50" />
               <h3 className="text-lg font-medium">News Feed</h3>
               <p>Latest news about {coin.name} will appear here.</p>
             </div>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}

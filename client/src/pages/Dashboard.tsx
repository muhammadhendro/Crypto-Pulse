import Navbar from "@/components/layout/Navbar";
import { getGlobalData, getTopCoins } from "@/lib/crypto-api";
import { useQuery } from "@tanstack/react-query";
import { PriceCard } from "@/components/ui/PriceCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowUp, Activity, BarChart3, Globe, Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Link } from "wouter";
import { useWatchlist } from "@/lib/use-watchlist";

export default function Dashboard() {
  const { data: coins, isLoading: coinsLoading, error: coinsError } = useQuery({
    queryKey: ["topCoins"],
    queryFn: getTopCoins,
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: global, isLoading: globalLoading } = useQuery({
    queryKey: ["globalData"],
    queryFn: getGlobalData,
  });

  const { watchlist } = useWatchlist();
  const watchlistCoins = coins?.filter(c => watchlist.includes(c.id)) || [];

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container py-6 space-y-8">
        {/* Global Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {globalLoading ? <Skeleton className="h-8 w-[100px]" /> : (
                <>
                  <div className="text-2xl font-bold font-mono">
                    ${((global?.total_market_cap?.usd || 0) / 1000000000000).toFixed(2)}T
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <span className={global?.market_cap_change_percentage_24h_usd && global.market_cap_change_percentage_24h_usd >= 0 ? "text-success" : "text-destructive"}>
                      {global?.market_cap_change_percentage_24h_usd?.toFixed(1)}%
                    </span>
                    <span className="ml-1">in 24h</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {globalLoading ? <Skeleton className="h-8 w-[100px]" /> : (
                <div className="text-2xl font-bold font-mono">
                  ${((global?.total_volume?.usd || 0) / 1000000000).toFixed(1)}B
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BTC Dominance</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {globalLoading ? <Skeleton className="h-8 w-[100px]" /> : (
                <div className="text-2xl font-bold font-mono">
                  {global?.market_cap_percentage?.btc.toFixed(1)}%
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ETH Dominance</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {globalLoading ? <Skeleton className="h-8 w-[100px]" /> : (
                <div className="text-2xl font-bold font-mono">
                  {global?.market_cap_percentage?.eth.toFixed(1)}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Watchlist Section */}
        {watchlist.length > 0 && (
          <div className="space-y-4">
             <div className="flex items-center gap-2">
               <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
               <h2 className="text-2xl font-bold tracking-tight">Your Watchlist</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {watchlistCoins.map((coin) => (
                  <Link key={coin.id} href={`/coin/${coin.id}`}>
                     <PriceCard coin={coin} />
                  </Link>
                ))}
             </div>
          </div>
        )}

        {/* Market Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Market Overview</h2>
            <div className="text-sm text-muted-foreground">
              Last updated: {format(new Date(), "HH:mm:ss")}
            </div>
          </div>
          
          {coinsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load market data. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {coinsLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="h-[180px]">
                  <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
                  <CardContent><Skeleton className="h-8 w-32 mb-4" /><Skeleton className="h-[60px] w-full" /></CardContent>
                </Card>
              ))
            ) : (
              coins?.map((coin) => (
                <Link key={coin.id} href={`/coin/${coin.id}`}>
                   <PriceCard coin={coin} />
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

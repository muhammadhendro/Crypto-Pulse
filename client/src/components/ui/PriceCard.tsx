import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { Coin } from "@/lib/crypto-api";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/lib/use-watchlist";

interface PriceCardProps {
  coin: Coin;
}

export function PriceCard({ coin }: PriceCardProps) {
  const { isInWatchlist, toggleWatchlist, isSaving } = useWatchlist();
  const isPositive = coin.price_change_percentage_24h >= 0;
  const isStarred = isInWatchlist(coin.id);

  // Format chart data for Recharts
  const chartData = coin.sparkline_in_7d?.price.map((price, index) => ({
    i: index,
    price
  })) || [];

  const handleStarClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a Link
    e.stopPropagation();
    await toggleWatchlist(coin.id);
  };

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-2 right-2 h-8 w-8 z-10 hover:bg-transparent",
          isStarred ? "text-yellow-400" : "text-muted-foreground/20 group-hover:text-muted-foreground"
        )}
        onClick={handleStarClick}
        disabled={isSaving}
      >
        <Star className={cn("h-5 w-5", isStarred && "fill-current")} />
      </Button>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full" />
          <div>
            <CardTitle className="text-sm font-medium">
              {coin.name}
            </CardTitle>
            <span className="text-xs text-muted-foreground uppercase font-mono">{coin.symbol}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
         <div className="flex items-center gap-2 mb-2">
           <div className="text-2xl font-bold font-mono">
            ${coin.current_price.toLocaleString()}
          </div>
           <div className={cn(
            "flex items-center text-xs font-bold px-2 py-0.5 rounded-full ml-auto",
            isPositive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
            {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mb-4">
          Vol: ${(coin.total_volume / 1000000000).toFixed(2)}B
        </p>
        
        <div className="h-[60px] w-full -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)"} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#gradient-${coin.id})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, MessageSquare, Twitter, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMarketNews } from "@/lib/app-api";
import { Skeleton } from "@/components/ui/skeleton";

export function SentimentPanel({ coinSymbol }: { coinSymbol: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["market-news", coinSymbol, "all", "all"],
    queryFn: () => getMarketNews({ sentiment: "all", impact: "all" }),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return <Skeleton className="h-[260px] w-full" />;
  }

  const related = data.items.filter((item) => item.title.toLowerCase().includes(coinSymbol.toLowerCase())).slice(0, 20);
  const sample = related.length > 0 ? related : data.items.slice(0, 20);

  const bullishCount = sample.filter((item) => item.sentiment === "positive").length;
  const bearishCount = sample.filter((item) => item.sentiment === "negative").length;
  const neutralCount = sample.filter((item) => item.sentiment === "neutral").length;
  const total = Math.max(sample.length, 1);

  const bullishSentiment = Math.round((bullishCount / total) * 100);
  const bearishSentiment = Math.round((bearishCount / total) * 100);

  const fearGreedIndex = Math.max(10, Math.min(90, 50 + bullishSentiment - bearishSentiment));
  const socialVolume = Math.min(100, 35 + sample.length * 3);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Fear & Greed Index</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-muted">
              <div
                className="absolute inset-0 rounded-full border-8 border-transparent border-t-success border-r-success"
                style={{ transform: `rotate(${(fearGreedIndex / 100) * 360}deg)` }}
              />
              <span className="text-4xl font-bold text-success">{fearGreedIndex}</span>
            </div>
            <p className="mt-4 font-medium text-success">{fearGreedIndex >= 55 ? "Greed" : fearGreedIndex <= 45 ? "Fear" : "Neutral"}</p>
            <p className="text-xs text-muted-foreground">Derived from latest market headlines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="h-4 w-4" /> Social/Headline Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Activity Score</span>
                <span className="font-bold">{socialVolume}/100</span>
              </div>
              <Progress value={socialVolume} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <Twitter className="h-4 w-4 text-sky-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Positive</div>
                  <div className="font-mono font-bold">{bullishCount}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <MessageSquare className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Neutral</div>
                  <div className="font-mono font-bold">{neutralCount}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">News Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-success">
                <TrendingUp className="h-5 w-5" />
                <span className="font-bold">Bullish</span>
              </div>
              <span className="font-mono text-xl">{bullishSentiment}%</span>
            </div>
            <Progress value={bullishSentiment} className="h-2 bg-muted" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bullish: {bullishSentiment}%</span>
              <span>Bearish: {bearishSentiment}%</span>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Crowd Psychology</span>
                <Badge variant="outline">{bearishSentiment > bullishSentiment ? "Risk-off" : "Risk-on"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Bearish headlines: {bearishCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { getMarketNews, type NewsImpact, type NewsSentiment } from "@/lib/app-api";

export default function News() {
  const [sentiment, setSentiment] = useState<"all" | NewsSentiment>("all");
  const [impact, setImpact] = useState<"all" | NewsImpact>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["market-news", sentiment, impact],
    queryFn: () => getMarketNews({ sentiment, impact }),
    refetchInterval: 60_000,
  });

  const news = data?.items ?? [];

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="container py-6 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Crypto News & Sentiment</h2>
            <p className="text-muted-foreground">Real-time headlines with sentiment + impact filters</p>
          </div>

          <div className="flex w-full gap-2 md:w-auto">
            <Select value={sentiment} onValueChange={(value: "all" | NewsSentiment) => setSentiment(value)}>
              <SelectTrigger className="w-full md:w-[170px]">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={impact} onValueChange={(value: "all" | NewsImpact) => setImpact(value)}>
              <SelectTrigger className="w-full md:w-[170px]">
                <SelectValue placeholder="Impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Impact</SelectItem>
                <SelectItem value="high">High Impact</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Data source:</span>
          <Badge variant="outline">{data?.source ?? "loading"}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-card/50 backdrop-blur border-primary/20">
              <CardHeader>
                <CardTitle>Market Sentiment</CardTitle>
                <CardDescription>Distribution from latest filtered headlines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Positive</span>
                  <span>{news.filter((n) => n.sentiment === "positive").length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Neutral</span>
                  <span>{news.filter((n) => n.sentiment === "neutral").length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Negative</span>
                  <span>{news.filter((n) => n.sentiment === "negative").length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>High Impact</span>
                  <span>{news.filter((n) => n.impact === "high").length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                  <CardContent><Skeleton className="h-4 w-full" /></CardContent>
                </Card>
              ))
            ) : (
              news.map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block">
                  <Card className="hover:border-primary/50 transition-colors group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs font-normal">{item.source}</Badge>
                            <Badge variant={item.impact === "high" ? "destructive" : "secondary"} className="text-xs font-normal">
                              {item.impact === "high" ? "High Impact" : "Normal"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="secondary"
                              className={`${
                                item.sentiment === "positive"
                                  ? "bg-success/10 text-success"
                                  : item.sentiment === "negative"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-yellow-500/10 text-yellow-500"
                              }`}
                            >
                              {item.sentiment === "positive" && <TrendingUp className="h-3 w-3 mr-1" />}
                              {item.sentiment === "negative" && <TrendingDown className="h-3 w-3 mr-1" />}
                              {item.sentiment === "neutral" && <Minus className="h-3 w-3 mr-1" />}
                              {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

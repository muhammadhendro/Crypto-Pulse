import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNews } from "@/lib/crypto-api";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function News() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: getNews,
  });

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container py-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Crypto News & Sentiment</h2>
          <p className="text-muted-foreground">Aggregated headlines and AI-powered sentiment analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sentiment Overview Panel */}
          <div className="md:col-span-1 space-y-6">
             <Card className="bg-card/50 backdrop-blur border-primary/20">
              <CardHeader>
                <CardTitle>Market Sentiment</CardTitle>
                <CardDescription>Daily sentiment score based on headlines</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-success/30 bg-success/5">
                  <span className="text-3xl font-bold text-success">68</span>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-lg font-medium text-success">Greed</p>
                  <p className="text-sm text-muted-foreground">Yesterday: 62 (Greed)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Trending Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["#Bitcoin", "#ETF", "#Solana", "#Regulation", "#DeFi", "#Memecoins"].map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary/20 transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* News Feed */}
          <div className="md:col-span-2 space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                  <CardContent><Skeleton className="h-4 w-full" /></CardContent>
                </Card>
              ))
            ) : (
              news?.map((item) => (
                <Card key={item.id} className="hover:border-primary/50 transition-colors group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-normal">
                            {item.source}
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
                            className={`
                              ${item.sentiment === 'positive' ? 'bg-success/10 text-success' : 
                                item.sentiment === 'negative' ? 'bg-destructive/10 text-destructive' : 
                                'bg-yellow-500/10 text-yellow-500'}
                            `}
                          >
                            {item.sentiment === 'positive' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {item.sentiment === 'negative' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {item.sentiment === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
                            {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

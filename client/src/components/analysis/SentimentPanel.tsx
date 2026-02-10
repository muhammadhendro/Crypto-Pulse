import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, MessageSquare, Twitter, Activity } from "lucide-react";

export function SentimentPanel({ coinSymbol }: { coinSymbol: string }) {
  // Mock data for sentiment
  const fearGreedIndex = 65; // Greed
  const socialVolume = 85; // High
  const bullishSentiment = 72;
  const bearishSentiment = 28;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fear & Greed Index */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Fear & Greed Index</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
             <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-muted">
               <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-success border-r-success" style={{ transform: `rotate(${(fearGreedIndex/100)*360}deg)` }} />
               <span className="text-4xl font-bold text-success">{fearGreedIndex}</span>
             </div>
             <p className="mt-4 font-medium text-success">Greed</p>
             <p className="text-xs text-muted-foreground">Market is optimistic</p>
          </CardContent>
        </Card>

        {/* LunarCrush Social Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="h-4 w-4" /> LunarCrush Social Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
               <div className="flex justify-between mb-1 text-sm">
                 <span>Social Volume</span>
                 <span className="font-bold">Very High</span>
               </div>
               <Progress value={socialVolume} className="h-2" />
             </div>
             
             <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                 <Twitter className="h-4 w-4 text-sky-500" />
                 <div>
                   <div className="text-xs text-muted-foreground">Mentions</div>
                   <div className="font-mono font-bold">12.5K</div>
                 </div>
               </div>
               <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                 <MessageSquare className="h-4 w-4 text-orange-500" />
                 <div>
                   <div className="text-xs text-muted-foreground">Reddit</div>
                   <div className="font-mono font-bold">3.2K</div>
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* CryptoPanic News Sentiment */}
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
               <span className="font-mono text-xl">72%</span>
             </div>
             <Progress value={72} className="h-2 bg-muted" />
             <div className="flex justify-between text-xs text-muted-foreground">
               <span>Bullish: 72%</span>
               <span>Bearish: 28%</span>
             </div>
             
             <div className="pt-4 border-t">
               <div className="flex justify-between items-center">
                 <span className="text-sm font-medium">Crowd Psychology</span>
                 <Badge variant="outline">FOMO Detected</Badge>
               </div>
               <p className="text-xs text-muted-foreground mt-2">
                 High retail activity suggests caution. Smart money distribution may be active.
               </p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

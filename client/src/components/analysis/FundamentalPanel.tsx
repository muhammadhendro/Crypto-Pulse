import { CoinDetail } from "@/lib/crypto-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Github, Globe, MessageSquare, Twitter, Users, Activity } from "lucide-react";

interface FundamentalPanelProps {
  coin: CoinDetail;
}

export function FundamentalPanel({ coin }: FundamentalPanelProps) {
  // Calculate a mock fundamental score
  const calculateScore = () => {
    let score = 50;
    // Liquidity
    if (coin.market_cap > 1000000000) score += 10;
    if (coin.market_cap_fdv_ratio > 0.8) score += 5; // Good emission schedule
    
    // Community
    if (coin.community_data.twitter_followers > 100000) score += 5;
    if (coin.community_data.reddit_subscribers > 50000) score += 5;
    
    // Dev Activity
    if (coin.developer_data.stars > 5000) score += 10;
    if (coin.developer_data.forks > 1000) score += 5;
    
    // Sentiment
    if (coin.sentiment_votes_up_percentage > 70) score += 10;

    return Math.min(score, 100);
  };

  const score = calculateScore();

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-success";
    if (s >= 60) return "text-primary";
    return "text-yellow-500";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Score and Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-card/50 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle>Fundamental Score</CardTitle>
            <CardDescription>Automated project health rating</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className={`relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-muted`}>
               <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-primary border-r-primary" style={{ transform: `rotate(${(score/100)*360}deg)` }} />
              <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>
            <div className="mt-4 text-center space-y-1">
              <p className="font-medium">
                {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Average"} Health
              </p>
              <p className="text-xs text-muted-foreground">Based on liquidity, community & dev stats</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Project Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {coin.description.en || "No description available."}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {coin.categories.slice(0, 5).map(cat => (
                <Badge key={cat} variant="secondary">{cat}</Badge>
              ))}
            </div>

            <Separator />

            <div className="flex flex-wrap gap-4 pt-2">
              {coin.links.homepage[0] && (
                <a href={coin.links.homepage[0]} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
               {coin.links.repos_url.github[0] && (
                <a href={coin.links.repos_url.github[0]} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Github className="h-4 w-4" /> GitHub
                </a>
              )}
               {coin.links.twitter_screen_name && (
                <a href={`https://twitter.com/${coin.links.twitter_screen_name}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Twitter className="h-4 w-4" /> Twitter
                </a>
              )}
              {coin.links.subreddit_url && (
                <a href={coin.links.subreddit_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Users className="h-4 w-4" /> Reddit
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Tokenomics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-muted-foreground" /> Tokenomics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Market Cap</span>
                <span className="font-mono font-medium">${coin.market_cap.toLocaleString()}</span>
              </div>
            </div>
            <div>
               <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">FDV</span>
                <span className="font-mono font-medium">${(coin.fully_diluted_valuation || coin.market_cap).toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground text-right mt-1">
                 FDV Ratio: {coin.market_cap_fdv_ratio ? coin.market_cap_fdv_ratio.toFixed(2) : "N/A"}
              </div>
            </div>
             <Separator />
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Circulating Supply</span>
                <span className="font-mono font-medium">{coin.circulating_supply.toLocaleString()}</span>
              </div>
              <Progress value={(coin.circulating_supply / (coin.max_supply || coin.total_supply || coin.circulating_supply)) * 100} className="h-1.5 mt-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{((coin.circulating_supply / (coin.max_supply || coin.total_supply || coin.circulating_supply)) * 100).toFixed(0)}% Unlocked</span>
                <span>Max: {coin.max_supply ? coin.max_supply.toLocaleString() : "∞"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Github className="h-4 w-4 text-muted-foreground" /> Dev Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <div className="text-2xl font-bold font-mono">{coin.developer_data.stars.toLocaleString()}</div>
                 <div className="text-xs text-muted-foreground">GitHub Stars</div>
               </div>
                <div>
                 <div className="text-2xl font-bold font-mono">{coin.developer_data.forks.toLocaleString()}</div>
                 <div className="text-xs text-muted-foreground">Forks</div>
               </div>
               <div>
                 <div className="text-2xl font-bold font-mono">{coin.developer_data.pull_requests_merged.toLocaleString()}</div>
                 <div className="text-xs text-muted-foreground">PRs Merged</div>
               </div>
                <div>
                 <div className="text-2xl font-bold font-mono">{coin.developer_data.pull_request_contributors.toLocaleString()}</div>
                 <div className="text-xs text-muted-foreground">Contributors</div>
               </div>
            </div>
            <div className="p-3 bg-muted/50 rounded text-xs text-muted-foreground">
               High developer activity often correlates with project longevity and innovation.
            </div>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" /> Community
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <Twitter className="h-4 w-4 text-sky-500" />
                   <span className="text-sm">Twitter</span>
                 </div>
                 <span className="font-mono font-bold">{coin.community_data.twitter_followers.toLocaleString()}</span>
               </div>
                <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <MessageSquare className="h-4 w-4 text-orange-500" />
                   <span className="text-sm">Reddit</span>
                 </div>
                 <span className="font-mono font-bold">{coin.community_data.reddit_subscribers.toLocaleString()}</span>
               </div>
             </div>

             <Separator />
             
             <div className="space-y-2">
               <span className="text-sm text-muted-foreground">Public Sentiment</span>
               <div className="flex h-4 w-full rounded-full overflow-hidden">
                 <div className="bg-success h-full" style={{ width: `${coin.sentiment_votes_up_percentage}%` }} />
                 <div className="bg-destructive h-full" style={{ width: `${coin.sentiment_votes_down_percentage}%` }} />
               </div>
               <div className="flex justify-between text-xs font-bold">
                 <span className="text-success">{coin.sentiment_votes_up_percentage}% Bullish</span>
                 <span className="text-destructive">{coin.sentiment_votes_down_percentage}% Bearish</span>
               </div>
             </div>
          </CardContent>
        </Card>
        
      </div>

      {/* On-Chain Metrics (Placeholder) */}
      <Card className="opacity-70 border-dashed">
        <CardHeader>
          <CardTitle className="text-base">On-Chain Metrics</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
             <div className="bg-muted rounded-full p-3">
               <Activity className="h-6 w-6 text-muted-foreground" />
             </div>
             <p className="font-medium text-sm">On-chain data integration required</p>
             <p className="text-xs text-muted-foreground max-w-md">
               Detailed network stats (active addresses, transaction count, TVL) require specialized API keys (e.g., Glassnode, Dune, DefiLlama) which are not currently configured.
             </p>
           </div>
        </CardContent>
      </Card>

    </div>
  );
}

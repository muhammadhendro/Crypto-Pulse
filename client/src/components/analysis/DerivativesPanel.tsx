import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Activity, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DerivativesPanel({ coinSymbol }: { coinSymbol: string }) {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Interest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">$4.2B</div>
            <div className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +2.4% (24h)
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funding Rate (Agg)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">0.0100%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Predicted: 0.0098%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Liquidations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">$45.2M</div>
            <div className="flex gap-2 text-xs mt-1">
               <span className="text-success">Long: $12M</span>
               <span className="text-destructive">Short: $33M</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Long/Short Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">1.12</div>
            <Progress value={53} className="h-1.5 mt-2 bg-destructive" />
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span>53% Long</span>
              <span>47% Short</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Activity className="h-5 w-5 text-primary" /> Liquidation Heatmap (Simulated)
           </CardTitle>
           <CardDescription>
             Estimated price levels where large leverage positions may be liquidated. Data provided by Coinglass (Mock).
           </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mock Heatmap Visualization */}
          <div className="h-[200px] w-full bg-accent/5 rounded-lg relative overflow-hidden flex items-end justify-between px-4 pb-0">
             {[30, 45, 20, 60, 80, 40, 30, 90, 50, 20, 10, 30, 40, 70, 40, 20].map((h, i) => (
               <div 
                 key={i} 
                 className="w-[5%] bg-yellow-500/20 hover:bg-yellow-500/40 transition-colors border-t border-yellow-500/50" 
                 style={{ height: `${h}%` }}
               >
                 <div className="opacity-0 hover:opacity-100 absolute bottom-full mb-1 text-xs bg-popover border px-2 py-1 rounded">
                   ${(60000 + i*100).toLocaleString()}
                 </div>
               </div>
             ))}
             <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t border-dashed border-primary"></div>
             <div className="absolute top-1/2 right-2 text-xs text-primary -mt-5">Current Price</div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
             <span>$60,000</span>
             <span>$68,000</span>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg bg-muted/30 border border-dashed flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Disclaimer:</span> Derivative data is aggregated from major exchanges. High open interest coupled with high funding rates may indicate volatility.
        </div>
        <Button variant="outline" size="sm" className="ml-auto">
          View on Coinglass <ExternalLink className="ml-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

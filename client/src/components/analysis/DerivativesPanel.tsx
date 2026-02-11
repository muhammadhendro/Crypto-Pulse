import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertTriangle, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getDerivatives } from "@/lib/app-api";
import { Skeleton } from "@/components/ui/skeleton";

export function DerivativesPanel({ coinSymbol }: { coinSymbol: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["derivatives", coinSymbol],
    queryFn: () => getDerivatives(coinSymbol),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-2">
        <Badge variant="outline">Source: {data.source}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Interest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">${(data.openInterestUsd / 1_000_000_000).toFixed(2)}B</div>
            <div className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> Live derivatives positioning
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funding Rate (Agg)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${data.fundingRate >= 0 ? "text-success" : "text-destructive"}`}>
              {(data.fundingRate * 100).toFixed(4)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">8h perpetual funding snapshot</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Liquidations (Est.)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">${(data.liquidation24hUsd / 1_000_000).toFixed(1)}M</div>
            <div className="text-xs text-muted-foreground mt-1">Estimated from leverage intensity</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Long/Short Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{data.longShortRatio.toFixed(2)}</div>
            <Progress value={data.estimatedLongPct} className="h-1.5 mt-2 bg-destructive" />
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span>{data.estimatedLongPct}% Long</span>
              <span>{data.estimatedShortPct}% Short</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Liquidation Risk Meter
          </CardTitle>
          <CardDescription>Proxy risk meter from OI + funding + long/short concentration</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={Math.min(100, Math.max(5, data.estimatedLongPct + Math.abs(data.fundingRate * 2000)))}
            className="h-3"
          />
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg bg-muted/30 border border-dashed flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Disclaimer:</span> Derivatives metrics are market-context tools, not direct buy/sell signals.
        </div>
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <a href="https://www.coinglass.com/" target="_blank" rel="noreferrer">
            View on Coinglass <ExternalLink className="ml-2 h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}

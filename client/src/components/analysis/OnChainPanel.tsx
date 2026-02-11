import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ExternalLink, Database, TrendingUp, Wallet, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getOnChain } from "@/lib/app-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function OnChainPanel({ coinSymbol }: { coinSymbol: string }) {
  const coinId = coinSymbol.toLowerCase() === "btc" ? "bitcoin" : coinSymbol.toLowerCase();

  const { data, isLoading } = useQuery({
    queryKey: ["onchain", coinId],
    queryFn: () => getOnChain(coinId),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-2">
        <Badge variant="outline">Source: {data.source}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Exchange Net Flow (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${data.netflow7dUsd <= 0 ? "text-success" : "text-destructive"}`}>
              ${Math.abs(data.netflow7dUsd / 1_000_000).toFixed(1)}M {data.netflow7dUsd <= 0 ? "Outflow" : "Inflow"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Negative netflow tends to indicate accumulation.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Whale Activity Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{data.whaleActivityScore}/100</div>
            <p className="text-xs text-success mt-1">
              <TrendingUp className="inline h-3 w-3" /> Elevated large-transfer activity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Miner Pressure Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{data.minerPressureScore}/100</div>
            <p className="text-xs text-muted-foreground mt-1">Higher score = more potential sell pressure from miners.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Exchange Inflow vs Outflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.flows}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <Tooltip />
                <Area type="monotone" dataKey="inflow" stackId="1" stroke="hsl(var(--destructive))" fill="url(#colorIn)" name="Inflow" />
                <Area type="monotone" dataKey="outflow" stackId="2" stroke="hsl(var(--success))" fill="url(#colorOut)" name="Outflow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 flex items-center justify-between hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-full"><Wallet className="h-6 w-6" /></div>
            <div>
              <h3 className="font-bold">CryptoQuant</h3>
              <p className="text-sm text-muted-foreground">Detailed miner & whale datasets</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://cryptoquant.com/" target="_blank" rel="noreferrer">Open <ExternalLink className="ml-2 h-3 w-3" /></a>
          </Button>
        </Card>
        <Card className="p-6 flex items-center justify-between hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-full"><Box className="h-6 w-6" /></div>
            <div>
              <h3 className="font-bold">Glassnode</h3>
              <p className="text-sm text-muted-foreground">Institutional-grade on-chain analytics</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://glassnode.com/" target="_blank" rel="noreferrer">Open <ExternalLink className="ml-2 h-3 w-3" /></a>
          </Button>
        </Card>
      </div>
    </div>
  );
}

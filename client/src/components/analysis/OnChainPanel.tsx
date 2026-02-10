import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ExternalLink, Database, TrendingUp, Wallet, Box } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnChainPanel({ coinSymbol }: { coinSymbol: string }) {
  // Mock data for on-chain metrics
  const mockExchangeFlow = Array.from({ length: 30 }, (_, i) => ({
    day: i,
    inflow: Math.random() * 1000,
    outflow: Math.random() * 1200
  }));

  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card>
           <CardHeader>
             <CardTitle className="text-sm font-medium text-muted-foreground">Exchange Net Flow (7d)</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold font-mono text-destructive">-$142.5M</div>
             <p className="text-xs text-muted-foreground mt-1">
               More assets leaving exchanges (Bullish signal for accumulation).
             </p>
           </CardContent>
         </Card>
          <Card>
           <CardHeader>
             <CardTitle className="text-sm font-medium text-muted-foreground">Active Addresses (24h)</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold font-mono">892,102</div>
             <p className="text-xs text-success mt-1">
               <TrendingUp className="inline h-3 w-3" /> +5.2% vs avg
             </p>
           </CardContent>
         </Card>
          <Card>
           <CardHeader>
             <CardTitle className="text-sm font-medium text-muted-foreground">Large TX Volume (&gt;100k)</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold font-mono">$12.4B</div>
             <p className="text-xs text-muted-foreground mt-1">
               Whale activity is stable.
             </p>
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
               <AreaChart data={mockExchangeFlow}>
                 <defs>
                   <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                   </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="day" hide />
                 <Tooltip />
                 <Area type="monotone" dataKey="inflow" stackId="1" stroke="hsl(var(--destructive))" fill="url(#colorIn)" name="Inflow (Sell Pressure)" />
                 <Area type="monotone" dataKey="outflow" stackId="2" stroke="hsl(var(--success))" fill="url(#colorOut)" name="Outflow (Accumulation)" />
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
               <p className="text-sm text-muted-foreground">Detailed miner & whale data</p>
             </div>
           </div>
           <Button variant="outline" size="sm">Open <ExternalLink className="ml-2 h-3 w-3" /></Button>
         </Card>
          <Card className="p-6 flex items-center justify-between hover:border-primary/50 transition-colors">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-muted rounded-full"><Box className="h-6 w-6" /></div>
             <div>
               <h3 className="font-bold">Glassnode</h3>
               <p className="text-sm text-muted-foreground">Institutional grade on-chain analytics</p>
             </div>
           </div>
           <Button variant="outline" size="sm">Open <ExternalLink className="ml-2 h-3 w-3" /></Button>
         </Card>
       </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Layers, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MultiExchangePanel({ coinSymbol }: { coinSymbol: string }) {
  // Mock exchange data
  const exchanges = [
    { name: "Binance", price: 64250.50, vol: "1.2B", spread: "0.01%" },
    { name: "Coinbase", price: 64280.10, vol: "850M", spread: "0.02%" },
    { name: "Kraken", price: 64245.00, vol: "420M", spread: "0.01%" },
    { name: "Bybit", price: 64252.00, vol: "900M", spread: "0.01%" },
    { name: "OKX", price: 64248.50, vol: "750M", spread: "0.02%" },
  ];

  const avgPrice = exchanges.reduce((acc, curr) => acc + curr.price, 0) / exchanges.length;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Cross-Exchange Arbitrage
            </CardTitle>
            <CardDescription>Real-time price monitoring across liquidity venues</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Exchange</TableHead>
                   <TableHead className="text-right">Price (USD)</TableHead>
                   <TableHead className="text-right">Diff %</TableHead>
                   <TableHead className="text-right">Spread</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {exchanges.map(ex => {
                   const diff = ((ex.price - avgPrice) / avgPrice) * 100;
                   return (
                     <TableRow key={ex.name}>
                       <TableCell className="font-medium">{ex.name}</TableCell>
                       <TableCell className="text-right font-mono">${ex.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                       <TableCell className="text-right">
                         <span className={diff > 0 ? "text-success" : "text-destructive"}>
                           {diff > 0 ? "+" : ""}{diff.toFixed(3)}%
                         </span>
                       </TableCell>
                       <TableCell className="text-right text-muted-foreground">{ex.spread}</TableCell>
                     </TableRow>
                   );
                 })}
               </TableBody>
             </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Aggregated Order Book (Visual)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full bg-accent/5 rounded relative flex items-center justify-center border border-dashed">
                 <p className="text-muted-foreground text-sm text-center px-8">
                   <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-20" />
                   Order Book Visualization Placeholder<br/>
                   (Requires WebSocket Stream)
                 </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-6">
               <div className="flex items-start gap-4">
                 <div className="p-2 bg-primary/10 rounded-full">
                   <ExternalLink className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <h4 className="font-semibold mb-1">Coinigy Integration</h4>
                   <p className="text-sm text-muted-foreground mb-3">
                     Access comprehensive multi-exchange charts and execution tools on Coinigy.
                   </p>
                   <Button variant="outline" size="sm">View on Coinigy</Button>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

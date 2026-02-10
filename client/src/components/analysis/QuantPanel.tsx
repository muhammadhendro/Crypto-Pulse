import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Terminal, PlayCircle } from "lucide-react";

export function QuantPanel() {
  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* Backtrader / Python Stack */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Terminal className="h-5 w-5 text-primary" /> Quant Engine
             </CardTitle>
             <CardDescription>Python-based backtesting environment (Simulation)</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="p-4 bg-black rounded-lg font-mono text-xs text-green-400 overflow-x-auto border border-green-900/30">
                <p># Example Strategy</p>
                <p>import backtrader as bt</p>
                <p>class RsiStrategy(bt.Strategy):</p>
                <p>&nbsp;&nbsp;def __init__(self):</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;self.rsi = bt.indicators.RSI(self.data.close)</p>
                <p>&nbsp;&nbsp;def next(self):</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;if self.rsi &lt; 30 and not self.position:</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;self.buy()</p>
                <p>...</p>
              </div>
              
              <div className="flex gap-2">
                 <Badge variant="outline">pandas</Badge>
                 <Badge variant="outline">numpy</Badge>
                 <Badge variant="outline">TA-Lib</Badge>
                 <Badge variant="outline">vectorbt</Badge>
              </div>

              <div className="pt-2">
                <Button className="w-full gap-2" variant="secondary">
                  <PlayCircle className="h-4 w-4" /> Run Simulation (Mock)
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Executes mock strategy on client-side JS engine mimicking Python logic.
                </p>
              </div>
           </CardContent>
         </Card>

         {/* CCXT & Multi-Exchange */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Code className="h-5 w-5 text-primary" /> CCXT Integration
             </CardTitle>
             <CardDescription>Unified API for multi-exchange data normalization</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This module uses the CCXT library architecture to normalize data streams from Binance, Kraken, and Coinbase for consistent backtesting results.
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded border">
                  <span className="text-sm font-medium">Binance</span>
                  <Badge className="bg-success/20 text-success hover:bg-success/30">Connected</Badge>
                </div>
                 <div className="flex justify-between items-center p-3 bg-muted/30 rounded border">
                  <span className="text-sm font-medium">Kraken</span>
                  <Badge variant="secondary">Simulated</Badge>
                </div>
                 <div className="flex justify-between items-center p-3 bg-muted/30 rounded border">
                  <span className="text-sm font-medium">Coinbase</span>
                  <Badge variant="secondary">Simulated</Badge>
                </div>
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-500">
                <strong>Note:</strong> Live trading execution is disabled in this environment for security. Analysis only.
              </div>
           </CardContent>
         </Card>
       </div>
    </div>
  );
}

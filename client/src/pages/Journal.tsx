import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, TrendingUp, TrendingDown, Save } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Trade {
  id: string;
  date: string;
  pair: string;
  type: "Long" | "Short";
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  notes: string;
  status: "Open" | "Closed";
}

export default function Journal() {
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem("trading-journal");
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState<Partial<Trade>>({
    pair: "BTC/USDT",
    type: "Long",
    status: "Open"
  });

  useEffect(() => {
    localStorage.setItem("trading-journal", JSON.stringify(trades));
  }, [trades]);

  const calculateStats = () => {
    const closedTrades = trades.filter(t => t.status === "Closed");
    const wins = closedTrades.filter(t => t.pnl > 0).length;
    const totalPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
    return { totalTrades: trades.length, winRate, totalPnl };
  };

  const stats = calculateStats();

  const handleSave = () => {
    if (!formData.pair || !formData.entryPrice) return;

    const pnl = formData.status === "Closed" && formData.exitPrice && formData.entryPrice && formData.size
      ? (formData.type === "Long" ? formData.exitPrice - formData.entryPrice : formData.entryPrice - formData.exitPrice) * formData.size
      : 0;

    const newTrade: Trade = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      pair: formData.pair,
      type: formData.type as "Long" | "Short",
      entryPrice: Number(formData.entryPrice),
      exitPrice: Number(formData.exitPrice) || 0,
      size: Number(formData.size) || 0,
      pnl: pnl,
      notes: formData.notes || "",
      status: formData.status as "Open" | "Closed"
    };

    setTrades([newTrade, ...trades]);
    setFormData({ pair: "BTC/USDT", type: "Long", status: "Open" });
    toast({ title: "Trade Logged", description: "Your trade has been saved to the journal." });
  };

  const deleteTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="container py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Trading Journal</h2>
            <p className="text-muted-foreground">Track your performance and learn from your trades.</p>
          </div>
          <div className="flex gap-4">
            <Card className="p-4 bg-accent/10 border-accent/20">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-xl font-mono font-bold">{stats.winRate.toFixed(1)}%</div>
            </Card>
            <Card className="p-4 bg-accent/10 border-accent/20">
              <div className="text-sm text-muted-foreground">Net PnL</div>
              <div className={`text-xl font-mono font-bold ${stats.totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
                ${stats.totalPnl.toFixed(2)}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Entry Form */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Log New Trade</CardTitle>
              <CardDescription>Record entry and exit details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pair</Label>
                <Input 
                  value={formData.pair} 
                  onChange={e => setFormData({...formData, pair: e.target.value})} 
                  placeholder="e.g. BTC/USDT" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v: any) => setFormData({...formData, type: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long">Long</SelectItem>
                      <SelectItem value="Short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v: any) => setFormData({...formData, status: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entry Price</Label>
                  <Input type="number" onChange={e => setFormData({...formData, entryPrice: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input type="number" onChange={e => setFormData({...formData, size: parseFloat(e.target.value)})} />
                </div>
              </div>
              {formData.status === "Closed" && (
                <div className="space-y-2">
                  <Label>Exit Price</Label>
                  <Input type="number" onChange={e => setFormData({...formData, exitPrice: parseFloat(e.target.value)})} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Why did you take this trade?" onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <Button className="w-full" onClick={handleSave}>
                <Plus className="mr-2 h-4 w-4" /> Add Trade
              </Button>
            </CardContent>
          </Card>

          {/* Trade List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Entry</TableHead>
                    <TableHead className="text-right">PnL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No trades recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    trades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="font-mono text-xs">{format(new Date(trade.date), "MM/dd HH:mm")}</TableCell>
                        <TableCell className="font-bold">{trade.pair}</TableCell>
                        <TableCell>
                          <Badge variant={trade.type === "Long" ? "default" : "destructive"}>
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">${trade.entryPrice}</TableCell>
                        <TableCell className={`text-right font-mono font-bold ${trade.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                          {trade.status === "Closed" ? `$${trade.pnl.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline">{trade.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteTrade(trade.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

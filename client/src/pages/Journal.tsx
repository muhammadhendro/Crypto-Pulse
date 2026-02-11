import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createJournalTrade, deleteJournalTrade, getJournalTrades, type NewTrade, type Trade } from "@/lib/app-api";
import { queryClient } from "@/lib/queryClient";

interface TradeForm {
  pair: string;
  type: "Long" | "Short";
  entryPrice?: number;
  exitPrice?: number;
  size?: number;
  notes: string;
  setupTag: string;
  mistakeTag: string;
  mood: "Calm" | "Neutral" | "FOMO" | "Fear";
  status: "Open" | "Closed";
}

export default function Journal() {
  const [formData, setFormData] = useState<TradeForm>({
    pair: "BTC/USDT",
    type: "Long",
    status: "Open",
    notes: "",
    setupTag: "Breakout",
    mistakeTag: "None",
    mood: "Neutral",
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["journal-trades"],
    queryFn: getJournalTrades,
  });

  const createMutation = useMutation({
    mutationFn: (payload: NewTrade) => createJournalTrade(payload),
    onSuccess: (created) => {
      queryClient.setQueryData(["journal-trades"], (current: Trade[] = []) => [created, ...current]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJournalTrade(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(["journal-trades"], (current: Trade[] = []) => current.filter((trade) => trade.id !== id));
    },
  });

  const calculateStats = () => {
    const closedTrades = trades.filter((t) => t.status === "Closed");
    const wins = closedTrades.filter((t) => t.pnl > 0);
    const losses = closedTrades.filter((t) => t.pnl < 0);

    const totalPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

    const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const expectancy = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;

    let equity = 0;
    let peak = 0;
    let maxDrawdown = 0;
    closedTrades
      .slice()
      .reverse()
      .forEach((trade) => {
        equity += trade.pnl;
        peak = Math.max(peak, equity);
        maxDrawdown = Math.max(maxDrawdown, peak - equity);
      });

    const bySetup = closedTrades.reduce((acc, trade) => {
      const key = trade.setupTag || "Unknown";
      const current = acc[key] || { pnl: 0, count: 0 };
      acc[key] = { pnl: current.pnl + trade.pnl, count: current.count + 1 };
      return acc;
    }, {} as Record<string, { pnl: number; count: number }>);

    const setupRanking = Object.entries(bySetup)
      .map(([setup, data]) => ({ setup, avg: data.pnl / data.count, count: data.count }))
      .sort((a, b) => b.avg - a.avg);

    return {
      totalTrades: trades.length,
      closedTrades: closedTrades.length,
      winRate,
      totalPnl,
      profitFactor,
      avgWin,
      avgLoss,
      expectancy,
      maxDrawdown,
      bestSetup: setupRanking[0] ?? null,
      worstSetup: setupRanking[setupRanking.length - 1] ?? null,
    };
  };

  const stats = calculateStats();

  const handleSave = async () => {
    if (!formData.pair || !formData.entryPrice) {
      toast({ title: "Validation", description: "Pair and Entry Price are required." });
      return;
    }

    const pnl =
      formData.status === "Closed" && formData.exitPrice && formData.size
        ? (formData.type === "Long" ? formData.exitPrice - formData.entryPrice : formData.entryPrice - formData.exitPrice) * formData.size
        : 0;

    try {
      await createMutation.mutateAsync({
        pair: formData.pair,
        type: formData.type,
        entryPrice: Number(formData.entryPrice),
        exitPrice: Number(formData.exitPrice) || 0,
        size: Number(formData.size) || 0,
        pnl,
        notes: formData.notes,
        setupTag: formData.setupTag,
        mistakeTag: formData.mistakeTag,
        mood: formData.mood,
        status: formData.status,
      });

      setFormData({ pair: "BTC/USDT", type: "Long", status: "Open", notes: "", setupTag: "Breakout", mistakeTag: "None", mood: "Neutral" });
      toast({ title: "Trade Logged", description: "Your trade has been saved to the journal." });
    } catch (_error) {
      toast({ title: "Save failed", description: "Unable to save trade right now.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (_error) {
      toast({ title: "Delete failed", description: "Unable to delete trade right now.", variant: "destructive" });
    }
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full md:w-auto">
            <Card className="p-3 bg-accent/10 border-accent/20"><div className="text-xs text-muted-foreground">Win Rate</div><div className="text-lg font-mono font-bold">{stats.winRate.toFixed(1)}%</div></Card>
            <Card className="p-3 bg-accent/10 border-accent/20"><div className="text-xs text-muted-foreground">Net PnL</div><div className={`text-lg font-mono font-bold ${stats.totalPnl >= 0 ? "text-success" : "text-destructive"}`}>${stats.totalPnl.toFixed(2)}</div></Card>
            <Card className="p-3 bg-accent/10 border-accent/20"><div className="text-xs text-muted-foreground">Profit Factor</div><div className="text-lg font-mono font-bold">{Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "∞"}</div></Card>
            <Card className="p-3 bg-accent/10 border-accent/20"><div className="text-xs text-muted-foreground">Expectancy</div><div className={`text-lg font-mono font-bold ${stats.expectancy >= 0 ? "text-success" : "text-destructive"}`}>${stats.expectancy.toFixed(2)}</div></Card>
            <Card className="p-3 bg-accent/10 border-accent/20"><div className="text-xs text-muted-foreground">Max Drawdown</div><div className="text-lg font-mono font-bold text-destructive">${stats.maxDrawdown.toFixed(2)}</div></Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Log New Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pair</Label>
                <Input value={formData.pair} onChange={(e) => setFormData({ ...formData, pair: e.target.value })} placeholder="e.g. BTC/USDT" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v: "Long" | "Short") => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long">Long</SelectItem>
                      <SelectItem value="Short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v: "Open" | "Closed") => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Input type="number" onChange={(e) => setFormData({ ...formData, entryPrice: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input type="number" onChange={(e) => setFormData({ ...formData, size: parseFloat(e.target.value) })} />
                </div>
              </div>
              {formData.status === "Closed" && (
                <div className="space-y-2">
                  <Label>Exit Price</Label>
                  <Input type="number" onChange={(e) => setFormData({ ...formData, exitPrice: parseFloat(e.target.value) })} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Setup Tag</Label>
                  <Select value={formData.setupTag} onValueChange={(v) => setFormData({ ...formData, setupTag: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Breakout">Breakout</SelectItem>
                      <SelectItem value="Pullback">Pullback</SelectItem>
                      <SelectItem value="Reversal">Reversal</SelectItem>
                      <SelectItem value="Range">Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mistake Tag</Label>
                  <Select value={formData.mistakeTag} onValueChange={(v) => setFormData({ ...formData, mistakeTag: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Late Entry">Late Entry</SelectItem>
                      <SelectItem value="No Stop Loss">No Stop Loss</SelectItem>
                      <SelectItem value="Overtrade">Overtrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Select value={formData.mood} onValueChange={(v: any) => setFormData({ ...formData, mood: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Calm">Calm</SelectItem>
                      <SelectItem value="Neutral">Neutral</SelectItem>
                      <SelectItem value="FOMO">FOMO</SelectItem>
                      <SelectItem value="Fear">Fear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Why did you take this trade?" onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={createMutation.isPending}>
                <Plus className="mr-2 h-4 w-4" /> {createMutation.isPending ? "Saving..." : "Add Trade"}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Trades ({stats.totalTrades})</CardTitle>
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
                          <Badge variant={trade.type === "Long" ? "default" : "destructive"}>{trade.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">${trade.entryPrice}</TableCell>
                        <TableCell className={`text-right font-mono font-bold ${trade.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                          {trade.status === "Closed" ? `$${trade.pnl.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{trade.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(trade.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                <div className="rounded border p-3">
                  <div className="text-muted-foreground">Avg Win</div>
                  <div className="font-mono text-success">${stats.avgWin.toFixed(2)}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-muted-foreground">Avg Loss</div>
                  <div className="font-mono text-destructive">${stats.avgLoss.toFixed(2)}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-muted-foreground">Closed Trades</div>
                  <div className="font-mono">{stats.closedTrades}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-muted-foreground">Best Setup</div>
                  <div className="font-mono text-success">{stats.bestSetup ? `${stats.bestSetup.setup} (${stats.bestSetup.avg.toFixed(2)})` : "-"}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-muted-foreground">Worst Setup</div>
                  <div className="font-mono text-destructive">{stats.worstSetup ? `${stats.worstSetup.setup} (${stats.worstSetup.avg.toFixed(2)})` : "-"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

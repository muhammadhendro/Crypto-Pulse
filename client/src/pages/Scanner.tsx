import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTopCoins } from "@/lib/crypto-api";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "wouter";

export default function Scanner() {
  const [search, setSearch] = useState("");
  const { data: coins, isLoading } = useQuery({ queryKey: ["topCoins"], queryFn: getTopCoins });

  const filteredCoins = coins?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="container py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Market Scanner</h2>
            <p className="text-muted-foreground">Filter and find potential opportunities</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search coins..." 
                className="pl-8" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filters</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card className="p-4 bg-success/10 border-success/20 cursor-pointer hover:bg-success/20 transition-colors">
             <div className="text-sm text-success font-medium">Top Gainer (24h)</div>
             <div className="text-xl font-bold">SOL +5.2%</div>
           </Card>
           <Card className="p-4 bg-destructive/10 border-destructive/20 cursor-pointer hover:bg-destructive/20 transition-colors">
             <div className="text-sm text-destructive font-medium">Top Loser (24h)</div>
             <div className="text-xl font-bold">BTC -0.8%</div>
           </Card>
           <Card className="p-4 bg-accent/10 border-accent/20">
             <div className="text-sm text-muted-foreground font-medium">Highest Volume</div>
             <div className="text-xl font-bold">USDT</div>
           </Card>
           <Card className="p-4 bg-accent/10 border-accent/20">
             <div className="text-sm text-muted-foreground font-medium">New Highs</div>
             <div className="text-xl font-bold">3 Coins</div>
           </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">24h Change</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Volume</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Mkt Cap</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : filteredCoins?.map(coin => (
                  <TableRow key={coin.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <img src={coin.image} className="h-6 w-6 rounded-full" />
                        <span>{coin.name}</span>
                        <span className="text-muted-foreground text-xs uppercase">{coin.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">${coin.current_price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                       <span className={`flex items-center justify-end ${coin.price_change_percentage_24h >= 0 ? "text-success" : "text-destructive"}`}>
                         {coin.price_change_percentage_24h >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                         {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                       </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground hidden md:table-cell">
                      ${(coin.total_volume / 1000000).toFixed(0)}M
                    </TableCell>
                     <TableCell className="text-right font-mono text-muted-foreground hidden md:table-cell">
                      ${(coin.market_cap / 1000000000).toFixed(1)}B
                    </TableCell>
                    <TableCell className="text-right">
                       <Link href={`/coin/${coin.id}`}>
                         <Button variant="ghost" size="sm">Details</Button>
                       </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

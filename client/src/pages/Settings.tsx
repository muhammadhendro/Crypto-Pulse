import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const [refreshInterval, setRefreshInterval] = useState("30");
  const [currency, setCurrency] = useState("usd");
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container max-w-2xl py-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your dashboard preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Configure data fetching and display options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="currency">Display Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD - US Dollar</SelectItem>
                  <SelectItem value="eur">EUR - Euro</SelectItem>
                  <SelectItem value="idr">IDR - Indonesian Rupiah</SelectItem>
                  <SelectItem value="jpy">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="interval">Auto-Refresh Interval (Seconds)</Label>
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger id="interval">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Seconds (High CPU)</SelectItem>
                  <SelectItem value="30">30 Seconds (Recommended)</SelectItem>
                  <SelectItem value="60">1 Minute</SelectItem>
                  <SelectItem value="300">5 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="indicators">Show Technical Indicators</Label>
                <p className="text-sm text-muted-foreground">
                  Enable advanced charts (RSI, MACD, BB) in Detail view.
                </p>
              </div>
              <Switch id="indicators" defaultChecked />
            </div>

             <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="notifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get alerted when watchlist items hit price targets.
                </p>
              </div>
              <Switch 
                id="notifications" 
                checked={notifications} 
                onCheckedChange={setNotifications}
              />
            </div>
            
             <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="darkmode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Force dark mode interface.
                </p>
              </div>
              <Switch id="darkmode" checked={true} disabled />
            </div>

            <Button onClick={handleSave} className="w-full">Save Changes</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
